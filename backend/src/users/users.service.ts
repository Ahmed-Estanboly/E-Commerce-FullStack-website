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
  }

  private async seed() {
    const count = await this.userModel.countDocuments();
    if (count > 0) {
      return; // Skip if data already exists
    }

    await this.userModel.insertMany(initialUsers);
    console.log(`Seeded ${initialUsers.length} users on startup.`);
  }

  async getNextId(){
    let size = await this.userModel.countDocuments();
    return size + 1;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.userModel.exists({ email: dto.email });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, this.saltRounds);

    const created = await this.userModel.create({
      ...dto,
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
    const user = await this.userModel.findOneAndUpdate({ id }, { ...updateUserDto, password: updateUserDto.password ? await bcrypt.hash(updateUserDto.password, this.saltRounds) : undefined }, { new: true }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const userObj = user.toObject();
    delete (userObj as Partial<User>).password;
    return userObj;
  }

  remove(id: number) {
    return this.userModel.findOneAndDelete({ id }).exec();
  }

  // Helper for your AuthService during login
  async validateCredentials(email: string, plainPassword: string) {
    const user = await this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password')
      .exec();

    if (!user) return null;

    const isMatch = await bcrypt.compare(plainPassword, user.password);
    return isMatch ? 'true' : 'false';
  }

  async isAvailable(email: string) {
    const user = await this.userModel.findOne({ email: email.toLowerCase() }).exec();
    return user ? false : true;
  }
}
