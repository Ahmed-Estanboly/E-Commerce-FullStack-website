import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from './schemas/products.schema.js';
import { initialProducts } from './productsSeed.js';
import { Model } from 'mongoose';

@Injectable()
export class ProductsService implements OnApplicationBootstrap {
  constructor(@InjectModel(Product.name) private productModel: Model<ProductDocument>) {}
  
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

  async getNextId(){
    let size = await this.productModel.countDocuments();
    return size + 1;
  }

  async create(createProductDto: CreateProductDto) {
    const id = await this.getNextId();
    return this.productModel.create({ ...createProductDto, id, slug: createProductDto.title.toLowerCase().replace(/ /g, '-') });
  }

  findAll() {
    return this.productModel.find().exec();
  }

  findOne(id: number) {
    return this.productModel.findOne({id}).exec();
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return this.productModel.findOneAndUpdate({ id }, updateProductDto, { new: true }).exec();
  }

  remove(id: number) {
    return this.productModel.findOneAndDelete({ id }).exec();
  }
  findByCategoryId(categoryId: number) {
    return this.productModel.find({ categoryId }).exec();
  }

  async getRelatedProducts(id: string) {
    const product = await this.productModel.findOne({ id: parseInt(id) }).exec();
    if (!product) {
      return [];
    }
    const category = product.categoryId;
    return this.productModel.find({ categoryId: category }).exec();
  }

  getProductBySlug(slug: string) {
    return this.productModel.findOne({ slug }).exec();
  }

  async getRelatedProductBySlug(slug: string) {
    const product = await this.getProductBySlug(slug);
    if (!product) {
      return [];
    }
    const category = product.categoryId;
    return this.productModel.find({ categoryId: category }).exec();
  }
}
