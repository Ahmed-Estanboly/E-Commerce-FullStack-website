import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../users/schemas/users.schema.js';
import type { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'node:crypto';
import { Inject } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { loginDto } from './dto/login.dto.js';
import { registerDto } from './dto/register.dto.js';
import { refreshDto } from './dto/refresh.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { JWT_REFRESH_SERVICE } from './tokens.js';

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly userServices: UsersService,
    private readonly jwtService: JwtService,
    @Inject(JWT_REFRESH_SERVICE) private readonly refreshJwt: JwtService,
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

  async refresh(dto: refreshDto) {
    let payload: { sub: number };
    try {
      payload = await this.refreshJwt.verifyAsync<{ sub: number }>(dto.refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userModel.findOne({ id: payload.sub }).select('+refreshToken').exec();
    if (!user || user.refreshToken !== hashToken(dto.refreshToken)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.buildAuthResponse(user.id);
  }

  async logout(userId: number) {
    await this.userModel.updateOne({ id: userId }, { $unset: { refreshToken: 1 } }).exec();
    return { success: true };
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
      branchId: user!.branchId,
    };
    const access_token = await this.jwtService.signAsync(payload);
    const refresh_token = await this.refreshJwt.signAsync({ sub: user!.id });
    await this.userModel
      .updateOne({ id: userId }, { $set: { refreshToken: hashToken(refresh_token) } })
      .exec();
    return {
      access_token,
      refresh_token,
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
