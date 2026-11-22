import { BadRequestException, Injectable, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from './schemas/products.schema.js';
import { Category, CategoryDocument } from '../category/schemas/category.schema.js';
import { initialProducts } from './productsSeed.js';
import type { Model } from 'mongoose';

@Injectable()
export class ProductsService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
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

  findAll(categoryId?: number) {
    const filter = categoryId === undefined ? {} : { categoryId };
    return this.productModel.find(filter).exec();
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
