import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../users/schemas/users.schema.js';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import { loginDto } from './dto/login.dto.js';
import { registerDto } from './dto/register.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly userServices: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: registerDto) {
    const created = await this.userServices.create({
      email: dto.email,
      name: dto.name,
      password: dto.password,
      role: 'customer',
      avatar: dto.avatar,
    });

    return this.buildAuthResponse(created.id);
  }

  async login(dto: loginDto) {
    const valid = await this.userServices.validateCredentials(dto.email, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.userModel.findOne({ email: dto.email.toLowerCase() }).exec();
    return this.buildAuthResponse(user!.id);
  }

  async me(userId: number) {
    const user = await this.userModel.findOne({ id: userId }).exec();
    return this.sanitizeUser(user!);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    return this.userServices.updateProfile(userId, dto);
  }

  private async buildAuthResponse(userId: number) {
    const user = await this.userModel.findOne({ id: userId }).exec();
    const payload = {
      sub: user!.id,
      email: user!.email,
      role: user!.role,
    };
    const access_token = await this.jwtService.signAsync(payload);
    return {
      access_token,
      user: this.sanitizeUser(user!),
    };
  }

  private sanitizeUser(user: UserDocument | Record<string, unknown>) {
    const obj: Record<string, unknown> = typeof (user as UserDocument).toObject === 'function'
      ? (user as UserDocument).toObject() as unknown as Record<string, unknown>
      : { ...(user as Record<string, unknown>) };
    delete obj.password;
    delete obj.refreshToken;
    return obj;
  }
}
