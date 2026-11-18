import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/users.schema.js';
import { initialUsers } from './userSeed.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {

  private readonly saltRounds = 10;
  
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}
  
  async onApplicationBootstrap() {
    await this.seed();
    await this.hashPlaintextPasswords();
  }

  private async seed() {
    const count = await this.userModel.countDocuments();
    if (count > 0) {
      return; // Skip if data already exists
    }

    const hashedUsers = await Promise.all(
      initialUsers.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, this.saltRounds),
      })),
    );
    await this.userModel.insertMany(hashedUsers);
    console.log(`Seeded ${initialUsers.length} users on startup.`);
  }

  private async hashPlaintextPasswords() {
    const users = await this.userModel.find({}).select('+password').exec();
    for (const user of users) {
      if (user.password && !user.password.startsWith('$2')) {
        user.password = await bcrypt.hash(user.password, this.saltRounds);
        await user.save();
      }
    }
  }

  async getNextId() {
    const lastUser = await this.userModel
      .findOne()
      .sort({ id: -1 })
      .select('id')
      .lean()
      .exec();
    return (lastUser?.id ?? 0) + 1;
  }

  async create(dto: CreateUserDto) {
    const email = dto.email.toLowerCase();
    const existing = await this.userModel.exists({ email });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, this.saltRounds);

    const created = await this.userModel.create({
      email,
      name: dto.name,
      role: dto.role,
      avatar: dto.avatar,
      id: await this.getNextId(),
      password: hashedPassword,
    });

    const userObj = created.toObject();
    delete (userObj as Partial<User>).password;
    return userObj;
  }

  async findAll() {
    return this.userModel.find().exec().then((users) => {
      return users.map((user) => {
        const userObj = user.toObject();
        delete (userObj as Partial<User>).password;
        return userObj;
      });
    });
  }

  async findOne(id: number) {
    const user = await this.userModel.findOne({ id }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const userObj = user.toObject();
    delete (userObj as Partial<User>).password;
    return userObj;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { password, ...rest } = updateUserDto;
    const update: Record<string, unknown> = { ...rest };
    if (password) {
      update.password = await bcrypt.hash(password, this.saltRounds);
    }
    const user = await this.userModel.findOneAndUpdate({ id }, update, { new: true }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const userObj = user.toObject();
    delete (userObj as Partial<User>).password;
    return userObj;
  }

  async updateProfile(id: number, dto: { name?: string; avatar?: string; phone?: string; password?: string }) {
    return this.update(id, dto as UpdateUserDto);
  }

  async remove(id: number) {
    const user = await this.userModel.findOneAndDelete({ id }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const userObj = user.toObject();
    delete (userObj as Partial<User>).password;
    delete userObj.refreshToken;
    return userObj;
  }

  // Helper for your AuthService during login
  async validateCredentials(email: string, plainPassword: string) {
    const user = await this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password')
      .exec();

    if (!user) return false;

    const isMatch = await bcrypt.compare(plainPassword, user.password);
    return isMatch;
  }

  async isAvailable(email: string) {
    const user = await this.userModel.findOne({ email: email.toLowerCase() }).exec();
    return user ? false : true;
  }
}
