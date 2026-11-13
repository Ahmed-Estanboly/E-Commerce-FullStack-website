import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { Schema as NestSchema } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

@NestSchema({ timestamps: true })
export class Category{
    @Prop()
    id:number;
    @Prop()
    name:string;
    @Prop()
    slug:string;
    @Prop()
    image:string;
}

export type CategoryDocument = HydratedDocument<Category>;
export const CategorySchema = SchemaFactory.createForClass(Category);