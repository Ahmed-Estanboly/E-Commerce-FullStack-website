import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { CategoryService } from './category.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const data = await this.categoryService.create(createCategoryDto);
    return {data, status: 'success', message: 'Category created successfully'};
  }

  @Get()
  async findAll() {
    const data = await this.categoryService.findAll();
    return {data, status: 'success', message: 'Categories retrieved successfuly'};
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.categoryService.findOne(id);
    return {data, status: 'success', message: 'Category retrieved successfuly'};
  }

  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    const data = await this.categoryService.getBySlug(slug);
    return {data, status: 'success', message: 'Category retrieved successfuly'};
  }

  @Get(':id/products')
  async getProductsByCategory(@Param('id', ParseIntPipe) id: number) {
    const data = await this.categoryService.getProductsByCategory(id);
    return {data, status: 'success', message: 'Products retrieved successfuly'};
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateCategoryDto: UpdateCategoryDto) {
    const data = await this.categoryService.update(id, updateCategoryDto);
    return {data, status: 'success', message: 'Category updated successfuly'};
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this.categoryService.remove(id);
    return {data, status: 'success', message: 'Category deleted successfuly'};
  }
}
