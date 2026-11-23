import { Prop, Schema as NestSchema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument } from "mongoose";

@NestSchema({ timestamps: true })
export class Product {
    @Prop()
    id: number;

    @Prop()
    title: string;
    
    @Prop()
    price: number;
    
    @Prop()
    description: string;
    
    @Prop()
    categoryId: number;
    
    @Prop()
    images: string[];

    @Prop()
    slug: string;
    
    @Prop()
    stock:number;

    @Prop({ enum: ['north', 'center', 'south'] })
    branch: string;

    @Prop({ default: 0, min: 0, max: 5 })
    ratingAverage: number;

    @Prop({ default: 0, min: 0 })
    ratingCount: number;
}
export type ProductDocument = HydratedDocument<Product>;
export const ProductSchema = SchemaFactory.createForClass(Product);
