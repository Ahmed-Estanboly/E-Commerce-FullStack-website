import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/products.schema.js';
import { Branch, BranchDocument } from './schemas/branch.schema.js';
import {
  BranchInventory,
  BranchInventoryDocument,
} from './schemas/branch-inventory.schema.js';
import { UpdateBranchInventoryDto } from './dto/update-branch-inventory.dto.js';

@Injectable()
export class BranchInventoryService {
  constructor(
    @InjectModel(Branch.name)
    private readonly branchModel: Model<BranchDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(BranchInventory.name)
    private readonly inventoryModel: Model<BranchInventoryDocument>,
  ) {}

  async findAll(branchId: string) {
    const branchObjectId = await this.getBranchId(branchId);
    const [products, inventory] = await Promise.all([
      this.productModel.find().sort({ title: 1 }).lean().exec(),
      this.inventoryModel.find({ branch: branchObjectId }).lean().exec(),
    ]);
    const quantities = new Map(
      inventory.map((item) => [item.product.toString(), item.quantity]),
    );

    return products.map((product) => ({
      productId: product.id,
      productName: product.title,
      categoryId: product.categoryId,
      price: product.price,
      images: product.images,
      quantity: quantities.get(product._id.toString()) ?? 0,
    }));
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
}
