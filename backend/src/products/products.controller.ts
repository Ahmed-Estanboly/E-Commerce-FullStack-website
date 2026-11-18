import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { Category } from '../category/schemas/category.schema.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

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
            createdAt: plain.createdAt ?? plain.creationAt,
            updatedAt: plain.updatedAt ?? plain.updatedAt,
          },
        ];
      }),
    );
    const transform = (product: any) => {
      if (!product) return product;
      const plain = typeof product.toObject === 'function' ? product.toObject() : { ...product };
      const { categoryId, ...rest } = plain;
      const category = byId.get(categoryId) ?? {
        id: categoryId ?? 0,
        name: 'Uncategorised',
        slug: 'uncategorised',
        image: '',
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt,
      };
      return { ...rest, category };
    };
    return Array.isArray(data) ? data.map(transform) : transform(data);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master admin')
  async create(@Body() createProductDto: CreateProductDto) {
    const data = await this.withCategory(await this.productsService.create(createProductDto));
    return data;
  }

  @Get()
  async findAll() {
    const data = await this.withCategory(await this.productsService.findAll());
    return data;
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.withCategory(await this.productsService.findOne(id));
    return data;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master admin')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateProductDto: UpdateProductDto) {
    const data = await this.withCategory(await this.productsService.update(id, updateProductDto));
    return data;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master admin')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this.withCategory(await this.productsService.remove(id));
    return data;
  }

  @Get(':id/related')
  async getRelatedProducts(@Param('id', ParseIntPipe) id: number) {
    const data = await this.withCategory(await this.productsService.getRelatedProducts(id.toString()));
    return data;
  }

  @Get('slug/:slug')
  async getProductBySlug(@Param('slug') slug: string) {
    const data = await this.withCategory(await this.productsService.getProductBySlug(slug));
    return data;
  }

  @Get('slug/:slug/related')
  async getRelatedProductBySlug(@Param('slug') slug: string) {
    const data = await this.withCategory(await this.productsService.getRelatedProductBySlug(slug));
    return data;
  }
}
