import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductQueryDto } from './dto/product-query.dto.js';
import { PaginatedResult } from '../common/dto/pagination.dto.js';
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
  async findAll(@Query() query: ProductQueryDto) {
    const result = await this.productsService.findAll(query);
    if (Array.isArray(result)) {
      return this.withCategory(result);
    }
    const paginated = result as PaginatedResult<unknown>;
    return {
      ...paginated,
      items: await this.withCategory(paginated.items),
    };
  }

  @Get('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master admin')
  async export(@Res() res: Response) {
    const csv = await this.productsService.exportCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.send(csv);
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

}
