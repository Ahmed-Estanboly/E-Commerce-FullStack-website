import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Category } from '../category/schemas/category.schema.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { Product } from './schemas/products.schema.js';
import { ProductsService } from './products.service.js';

describe('ProductsService validation', () => {
  const productModel = {
    create: vi.fn(),
    findOneAndUpdate: vi.fn(),
  };
  const categoryModel = {
    exists: vi.fn(),
  };
  let service: ProductsService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getModelToken(Product.name), useValue: productModel },
        { provide: getModelToken(Category.name), useValue: categoryModel },
      ],
    }).compile();
    service = module.get(ProductsService);
  });

  it('rejects fractional stock in create and update DTOs', async () => {
    const createDto = plainToInstance(CreateProductDto, {
      title: 'Test product',
      price: 10,
      description: 'A valid product description.',
      categoryId: 1,
      images: ['https://example.com/product.jpg'],
      stock: 1.5,
    });
    const updateDto = plainToInstance(UpdateProductDto, { stock: 1.5 });

    expect((await validate(createDto)).some((error) => error.property === 'stock')).toBe(true);
    expect((await validate(updateDto)).some((error) => error.property === 'stock')).toBe(true);
  });

  it('rejects a missing category when creating a product', async () => {
    categoryModel.exists.mockResolvedValue(null);

    await expect(
      service.create({
        title: 'Test product',
        price: 10,
        description: 'A valid product description.',
        categoryId: 999999,
        images: ['https://example.com/product.jpg'],
        stock: 1,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(productModel.create).not.toHaveBeenCalled();
  });

  it('rejects a missing category when updating a product', async () => {
    categoryModel.exists.mockResolvedValue(null);

    await expect(service.update(52, { categoryId: 999999 })).rejects.toThrow(BadRequestException);
    expect(productModel.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
