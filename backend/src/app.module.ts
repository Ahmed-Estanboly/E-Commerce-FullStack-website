import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ProductsModule } from './products/products.module.js';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CategoryModule } from './category/category.module.js';

@Module({
  imports: [
    ProductsModule,
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    // Asynchronously connect to MongoDB Atlas
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),
    CategoryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
