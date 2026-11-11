import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    const data = await this.productsService.create(createProductDto);
    return {data, status: 'success', message: 'Product added successfuly'};
  }

  @Get()
  async findAll() {
    const data = await this.productsService.findAll();
    return {data, status: 'success', message: 'Product retrieved successfuly'};
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.productsService.findOne(id);
    return {data, status: 'success', message: 'Product retrieved successfuly'};
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateProductDto: UpdateProductDto) { 
    const data = await this.productsService.update(id, updateProductDto);
    return {data, status: 'success', message: 'Product updated successfuly'};
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this.productsService.remove(id);
    return {data, status: 'success', message: 'Product deleted successfuly'};
  }
}
