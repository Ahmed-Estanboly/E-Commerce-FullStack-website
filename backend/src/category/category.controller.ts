import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { CategoryService } from './category.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { withCategory } from '../common/with-category.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

@Controller('category')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master admin')
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const data = await this.categoryService.create(createCategoryDto);
    return data;
  }

  @Get()
  async findAll() {
    const data = await this.categoryService.findAll();
    return data;
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.categoryService.findOne(id);
    return data;
  }

  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    const data = await this.categoryService.getBySlug(slug);
    return data;
  }

  @Get(':id/products')
  async getProductsByCategory(@Param('id', ParseIntPipe) id: number) {
    const data = await withCategory(this.connection, await this.categoryService.getProductsByCategory(id));
    return data;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master admin')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateCategoryDto: UpdateCategoryDto) {
    const data = await this.categoryService.update(id, updateCategoryDto);
    return data;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master admin')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this.categoryService.remove(id);
    return data;
  }
}
