import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../users/schemas/users.schema.js';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class AuthService {

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>,
              private readonly userServices: UsersService) {}

  assignToken(){
    //todo: implement the env token fetch on role 
  }

  async login(email:string, password:string) {
    const valid = await this.userServices.validateCredentials(email, password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.assignToken();
  }
}
