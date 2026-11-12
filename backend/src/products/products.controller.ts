import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { Category } from '../category/schema/category.schema.js';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  private async withCategory(data: any) {
    const categories = await this.connection.model(Category.name).find().exec();
    const byId = new Map(
      categories.map((category: any) => {
        const plain = typeof category.toObject === 'function' ? category.toObject() : category;
        return [
          plain.id,
          {
            id: plain.id,
            name: plain.name,
            slug: plain.slug,
            image: plain.image,
            creationAt: plain.createdAt ?? plain.creationAt,
            updatedAt: plain.updatedAt ?? plain.updatedAt,
          },
        ];
      }),
    );
    const transform = (product: any) => {
      if (!product) return product;
      const plain = typeof product.toObject === 'function' ? product.toObject() : { ...product };
      const { categoryId, ...rest } = plain;
      return { ...rest, category: byId.get(categoryId) ?? null };
    };
    return Array.isArray(data) ? data.map(transform) : transform(data);
  }

  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    const data = await this.withCategory(await this.productsService.create(createProductDto));
    return {data, status: 'success', message: 'Product added successfuly'};
  }

  @Get()
  async findAll() {
    const data = await this.withCategory(await this.productsService.findAll());
    return {data, status: 'success', message: 'Product retrieved successfuly'};
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.withCategory(await this.productsService.findOne(id));
    return {data, status: 'success', message: 'Product retrieved successfuly'};
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateProductDto: UpdateProductDto) { 
    const data = await this.withCategory(await this.productsService.update(id, updateProductDto));
    return {data, status: 'success', message: 'Product updated successfuly'};
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this.withCategory(await this.productsService.remove(id));
    return {data, status: 'success', message: 'Product deleted successfuly'};
  }
  @Get(':id/related')
  async getRelatedProducts(@Param('id', ParseIntPipe) id: number) {
    const data = await this.withCategory(await this.productsService.getRelatedProducts(id.toString()));
    return {data, status: 'success', message: 'Related products retrieved successfuly'};
  }

  @Get('slug/:slug')
  async getProductBySlug(@Param('slug') slug: string) {
    const data = await this.withCategory(await this.productsService.getProductBySlug(slug));
    return {data, status: 'success', message: 'Product retrieved successfuly'};
  }

  @Get('slug/:slug/related')
  async getRelatedProductBySlug(@Param('slug') slug: string) {
    const data = await this.withCategory(await this.productsService.getRelatedProductBySlug(slug));
    return {data, status: 'success', message: 'Related products retrieved successfuly'};
  }
}
