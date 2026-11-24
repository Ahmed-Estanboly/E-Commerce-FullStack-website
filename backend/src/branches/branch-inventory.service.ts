import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Types } from 'mongoose';
import type { Model } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/products.schema.js';
import { Branch, BranchDocument } from './schemas/branch.schema.js';
import {
  BranchInventory,
  BranchInventoryDocument,
} from './schemas/branch-inventory.schema.js';
import { UpdateBranchInventoryDto } from './dto/update-branch-inventory.dto.js';
import { CreateBranchProductDto } from './dto/create-branch-product.dto.js';
import { ProductsService } from '../products/products.service.js';

@Injectable()
export class BranchInventoryService {
  constructor(
    @InjectModel(Branch.name)
    private readonly branchModel: Model<BranchDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(BranchInventory.name)
    private readonly inventoryModel: Model<BranchInventoryDocument>,
    private readonly productsService: ProductsService,
  ) {}

  async findAll(branchId: string) {
    const branchObjectId = await this.getBranchId(branchId);
    const [products, inventory] = await Promise.all([
      this.productModel.find().sort({ title: 1 }).lean().exec(),
      this.inventoryModel.find({ branch: branchObjectId }).lean().exec(),
    ]);
    const inventoryByProduct = new Map(
      inventory.map((item) => [item.product.toString(), item.quantity]),
    );

    return products.map((product) => ({
      productId: product.id,
      productName: product.title,
      categoryId: product.categoryId,
      price: product.price,
      images: product.images,
      quantity: inventoryByProduct.get(product._id.toString()) ?? 0,
      isAssigned: inventoryByProduct.has(product._id.toString()),
    }));
  }

  async findCatalog(branchId: string) {
    const branch = await this.branchModel.findById(await this.getBranchId(branchId)).exec();
    if (!branch?.isActive) {
      throw new NotFoundException('Active branch not found');
    }

    return (await this.findAll(branchId)).filter((item) => item.isAssigned);
  }

  /** Assigned products at or below the low-stock threshold (default 5). */
  async findAlerts(branchId: string, threshold = 5) {
    const items = await this.findCatalog(branchId);
    return {
      threshold,
      lowStock: items.filter((item) => item.quantity > 0 && item.quantity <= threshold),
      outOfStock: items.filter((item) => item.quantity === 0),
    };
  }

  /** CSV export of a branch's inventory. */
  async exportCsv(branchId: string) {
    const items = await this.findAll(branchId);
    const escape = (value: unknown) => {
      const normalized = typeof value === 'string' ? value : JSON.stringify(value) ?? '';
      return `"${normalized.replaceAll('"', '""')}"`;
    };
    const header = ['productId', 'productName', 'categoryId', 'price', 'quantity', 'isAssigned'];
    const rows = items.map((item) =>
      [item.productId, item.productName, item.categoryId, item.price, item.quantity, item.isAssigned]
        .map(escape)
        .join(','),
    );
    return [header.join(','), ...rows].join('\n');
  }

  async seedDemoInventory() {
    const [branches, products] = await Promise.all([
      this.branchModel.find({ isActive: true }).sort({ name: 1 }).lean().exec(),
      this.productModel.find().sort({ id: 1 }).lean().exec(),
    ]);
    if (!branches.length || !products.length) return;

    const operations = branches.flatMap((branch) =>
      products.map((product) => ({
        updateOne: {
          filter: { branch: branch._id, product: product._id },
          update: {
            $setOnInsert: { quantity: product.stock ?? 10 },
          },
          upsert: true,
        },
      })),
    );

    if (operations.length) {
      const result = await this.inventoryModel.bulkWrite(operations, { ordered: false });
      if (result.upsertedCount > 0) {
        console.log(`Seeded ${result.upsertedCount} missing branch inventory items.`);
      }
    }
  }

  async add(branchId: string, productId: number, dto: UpdateBranchInventoryDto) {
    const branchObjectId = await this.getBranchId(branchId);
    const product = await this.productModel.findOne({ id: productId }).select('_id').lean().exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (await this.inventoryModel.exists({ branch: branchObjectId, product: product._id })) {
      throw new ConflictException('Product is already assigned to this branch');
    }

    let inventory: BranchInventoryDocument;
    try {
      inventory = await this.inventoryModel.create({
        branch: branchObjectId,
        product: product._id,
        quantity: dto.quantity,
      });
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Product is already assigned to this branch');
      }
      throw error;
    }

    return { productId, quantity: inventory.quantity };
  }

  async createProduct(branchId: string, dto: CreateBranchProductDto) {
    const branchObjectId = await this.getBranchId(branchId);
    const { branchQuantity, ...productData } = dto;
    const product = await this.productsService.create({
      ...productData,
      stock: branchQuantity,
    });

    try {
      await this.inventoryModel.create({
        branch: branchObjectId,
        product: product._id,
        quantity: branchQuantity,
      });
    } catch (error) {
      await this.productsService.remove(product.id);
      throw error;
    }

    return Object.assign(product.toObject(), { branchQuantity });
  }

  async update(branchId: string, productId: number, dto: UpdateBranchInventoryDto) {
    const branchObjectId = await this.getBranchId(branchId);
    const product = await this.productModel.findOne({ id: productId }).select('_id').lean().exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const inventory = await this.inventoryModel
      .findOneAndUpdate(
        { branch: branchObjectId, product: product._id },
        { $set: { quantity: dto.quantity } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
      )
      .lean()
      .exec();

    return { productId, quantity: inventory.quantity };
  }

  async remove(branchId: string, productId: number) {
    const branchObjectId = await this.getBranchId(branchId);
    const product = await this.productModel.findOne({ id: productId }).select('_id').lean().exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const inventory = await this.inventoryModel
      .findOneAndDelete({ branch: branchObjectId, product: product._id })
      .lean()
      .exec();
    if (!inventory) {
      throw new NotFoundException('Product is not assigned to this branch');
    }

    return { productId, quantity: 0 };
  }

  async removeForBranch(branchId: Types.ObjectId) {
    await this.inventoryModel.deleteMany({ branch: branchId }).exec();
  }

  private async getBranchId(id: string): Promise<Types.ObjectId> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Branch not found');
    }
    const objectId = new Types.ObjectId(id);
    if (!(await this.branchModel.exists({ _id: objectId }))) {
      throw new NotFoundException('Branch not found');
    }
    return objectId;
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
  }
}
