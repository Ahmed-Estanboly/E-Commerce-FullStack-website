import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master admin')
  async create(@Body() createUserDto: CreateUserDto) {
    const data = await this.usersService.create(createUserDto);
    return data;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master admin')
  async findAll() {
    const data = await this.usersService.findAll();
    return data;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master admin')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.usersService.findOne(id);
    return data;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master admin')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    const data = await this.usersService.update(id, updateUserDto);
    return data;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master admin')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this.usersService.remove(id);
    return data;
  }

  @Post('is-available')
  async isAvailable(@Body() body: { email: string }) {
    const data = await this.usersService.isAvailable(body.email);
    return data;
  }
}
