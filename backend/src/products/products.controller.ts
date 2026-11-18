import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { withCategory } from '../common/with-category.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  private withCategory<T>(data: T): Promise<T> {
    return withCategory(this.connection, data);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master admin')
  async create(@Body() createProductDto: CreateProductDto) {
    const data = await this.withCategory(await this.productsService.create(createProductDto));
    return data;
  }

  @Get()
  async findAll(@Query('categoryId', new ParseIntPipe({ optional: true })) categoryId?: number) {
    const data = await this.withCategory(await this.productsService.findAll(categoryId));
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
