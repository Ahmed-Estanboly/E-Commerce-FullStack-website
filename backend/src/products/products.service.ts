import { BadRequestException, Injectable, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductQueryDto, productSortOrder } from './dto/product-query.dto.js';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from './schemas/products.schema.js';
import { Category, CategoryDocument } from '../category/schemas/category.schema.js';
import { BranchInventory, BranchInventoryDocument } from '../branches/schemas/branch-inventory.schema.js';
import { Branch, BranchDocument } from '../branches/schemas/branch.schema.js';
import { initialProducts } from './productsSeed.js';
import { resolvePagination, toPaginatedResult, type PaginatedResult } from '../common/dto/pagination.dto.js';
import { isValidObjectId, Types } from 'mongoose';
import type { Model } from 'mongoose';

@Injectable()
export class ProductsService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(BranchInventory.name)
    private branchInventoryModel: Model<BranchInventoryDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
  ) {}
  
   // Runs automatically once when NestJS finishes initializing
  async onApplicationBootstrap() {
    await this.seed();
  }

  private async seed() {
    const count = await this.productModel.countDocuments();
    if (count > 0) {
      return; // Skip if data already exists
    }

    await this.productModel.insertMany(
      initialProducts.map((product) => ({ ...product, categoryId: product.category.id })),
    );
    console.log(`Seeded ${initialProducts.length} products on startup.`);
  }

  async getNextId() {
    const lastProduct = await this.productModel
      .findOne()
      .sort({ id: -1 })
      .select('id')
      .lean()
      .exec();
    return (lastProduct?.id ?? 0) + 1;
  }

  private async ensureCategoryExists(categoryId: number) {
    const categoryExists = await this.categoryModel.exists({ id: categoryId });
    if (!categoryExists) {
      throw new BadRequestException(`Category with ID ${categoryId} does not exist.`);
    }
  }

  async create(createProductDto: CreateProductDto) {
    await this.ensureCategoryExists(createProductDto.categoryId);
    const id = await this.getNextId();
    const plainDto = {
      title: createProductDto.title,
      slug: createProductDto.title.toLowerCase().replace(/ /g, '-'),
      price: createProductDto.price,
      description: createProductDto.description,
      categoryId: createProductDto.categoryId,
      images: createProductDto.images,
      stock: createProductDto.stock,
      branch: createProductDto.branch,
      id,
    };
    return this.productModel.create(plainDto);
  }

  async findAll(query: ProductQueryDto = {}): Promise<ProductDocument[] | PaginatedResult<ProductDocument>> {
    const filter: Record<string, unknown> = {};

    const categoryIds = [...new Set([...(query.categoryIds ?? []), ...(query.categoryId ? [query.categoryId] : [])])];
    if (categoryIds.length === 1) {
      filter.categoryId = categoryIds[0];
    } else if (categoryIds.length > 1) {
      filter.categoryId = { $in: categoryIds };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {
        ...(query.minPrice !== undefined ? { $gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { $lte: query.maxPrice } : {}),
      };
    }

    if (query.q?.trim()) {
      const escaped = query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
      ];
    }

    if (query.inStock) {
      filter.stock = { $gt: 0 };
    }

    const branchProductIds = await this.productIdsForBranch(query.branchId);
    if (branchProductIds) {
      filter._id = { $in: branchProductIds };
    }

    const sort = productSortOrder(query.sort);
    const pagination = resolvePagination(query);

    if (!pagination) {
      return this.productModel.find(filter).sort(sort).exec();
    }

    const [items, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort(sort)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);
    return toPaginatedResult(items, total, pagination);
  }

  /**
   * Returns the product document ids assigned to a branch's inventory, or
   * null when no branch filter was requested. Validates the branch exists.
   */
  private async productIdsForBranch(branchId?: string): Promise<Types.ObjectId[] | null> {
    if (!branchId) return null;
    if (!isValidObjectId(branchId)) {
      throw new BadRequestException('branchId must be a valid branch id.');
    }
    const branch = await this.branchModel.exists({ _id: new Types.ObjectId(branchId) }).exec();
    if (!branch) {
      throw new BadRequestException('The selected branch was not found.');
    }
    const inventory = await this.branchInventoryModel
      .find({ branch: new Types.ObjectId(branchId) })
      .select('product')
      .lean()
      .exec();
    return inventory.map((item) => item.product as Types.ObjectId);
  }

  async findOne(id: number) {
    const product = await this.productModel.findOne({ id }).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    if (updateProductDto.categoryId !== undefined) {
      await this.ensureCategoryExists(updateProductDto.categoryId);
    }
    const product = await this.productModel.findOneAndUpdate({ id }, updateProductDto, { new: true }).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async remove(id: number) {
    const product = await this.productModel.findOneAndDelete({ id }).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }
  findByCategoryId(categoryId: number) {
    return this.productModel.find({ categoryId }).exec();
  }

  async getRelatedProducts(id: string) {
    const product = await this.productModel.findOne({ id: parseInt(id) }).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    const category = product.categoryId;
    return this.productModel.find({ categoryId: category }).exec();
  }

  async getProductBySlug(slug: string) {
    const product = await this.productModel.findOne({ slug }).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async getRelatedProductBySlug(slug: string) {
    const product = await this.getProductBySlug(slug);
    const category = product.categoryId;
    return this.productModel.find({ categoryId: category }).exec();
  }
}
