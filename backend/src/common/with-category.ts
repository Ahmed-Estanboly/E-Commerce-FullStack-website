import mongoose from 'mongoose';
import { Category } from '../category/schemas/category.schema.js';

/**
 * Products store `categoryId`; API consumers expect a populated `category`
 * object. This hydrates it the same way for every endpoint that returns
 * products (products controller, category products endpoint).
 */
export async function withCategory<T>(connection: mongoose.Connection, data: T): Promise<T> {
  const categories = await connection.model(Category.name).find().exec();
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
          updatedAt: plain.updatedAt,
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

  return (Array.isArray(data) ? data.map(transform) : transform(data)) as T;
}
