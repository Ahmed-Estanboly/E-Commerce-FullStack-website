import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../users/schemas/users.schema.js';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service.js';
import { registerDto } from './dto/register.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { JwtService } from '@nestjs/jwt';
import { JWT_REFRESH_SERVICE } from './auth.module.js';
import { Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';

@Injectable()
export class AuthService {

  private readonly saltRounds = 10;

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>,
              private readonly userServices: UsersService,
              private readonly jwtService: JwtService,
              @Inject(JWT_REFRESH_SERVICE) private readonly jwtRefreshService: JwtService) {}

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async assignTokens(user: UserDocument) {
    const payload = { sub: user._id.toString(), email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtRefreshService.signAsync(payload);

    user.refreshToken = this.hashToken(refreshToken);
    await user.save();

    return { accessToken, refreshToken };
  }

  async login(email: string, password: string) {
    const valid = await this.userServices.validateCredentials(email, password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.assignTokens(user);
  }

  async register(dto: registerDto) {
    const exists = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (exists) {
      throw new ConflictException('User already exists');
    }
    const user = await this.userModel.create({
      email: dto.email.toLowerCase(),
      password: await bcrypt.hash(dto.password, this.saltRounds),
      name: dto.name,
      role: "user",
      avatar: dto.avatar,
    });
    return this.assignTokens(user);
  }

  async profile(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const userObj = user.toObject();
    delete (userObj as Partial<User>).password;
    delete userObj.refreshToken;
    return userObj;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.avatar !== undefined) user.avatar = dto.avatar;
    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, this.saltRounds);
    }
    await user.save();

    const userObj = user.toObject();
    delete (userObj as Partial<User>).password;
    delete userObj.refreshToken;
    return userObj;
  }

  async logout(userId: string) {
    await this.userModel
      .findByIdAndUpdate(userId, { refreshToken: null })
      .exec();
    return { message: 'Logged out' };
  }

  async refreshToken(token: string) {
    let payload: any;
    try {
      payload = await this.jwtRefreshService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userModel
      .findById(payload.sub)
      .select('+refreshToken')
      .exec();
    if (!user || user.refreshToken !== this.hashToken(token)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.assignTokens(user);
  }
}
