import { Prop, Schema as NestSchema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

@NestSchema({ timestamps: true })
export class User {
    @Prop()
    id: number;
    
    @Prop()
    name: string;
    
    @Prop()
    email: string;
    
    @Prop()
    password: string;
    
    @Prop()
    role: string;

    @Prop()
    avatar: string;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
