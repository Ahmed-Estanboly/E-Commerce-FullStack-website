import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/users.schema.js';
import { UsersModule } from '../users/users.module.js';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const JWT_REFRESH_SERVICE = 'JWT_REFRESH_SERVICE';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    UsersModule,
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: JWT_REFRESH_SERVICE,
      useFactory: (config: ConfigService) =>
        new JwtService({
          secret: config.get<string>('JWT_REFRESH_SECRET'),
          signOptions: {
            expiresIn: '7d',
          },
        }),
      inject: [ConfigService],
    },
  ],
})
export class AuthModule {}
