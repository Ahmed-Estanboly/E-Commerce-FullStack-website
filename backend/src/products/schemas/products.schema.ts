import { Prop, Schema as NestSchema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

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
}
export type ProductDocument = HydratedDocument<Product>;
export const ProductSchema = SchemaFactory.createForClass(Product);
