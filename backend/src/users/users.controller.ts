import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const data = await this.usersService.create(createUserDto);
    return {data, status: 'success', message: 'User created successfully'};
  }

  @Get()
  async findAll() {
    const data = await this.usersService.findAll();
    return {data, status: 'success', message: 'Users retrieved successfully'};
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.usersService.findOne(id);
    return {data, status: 'success', message: 'User retrieved successfully'};
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    const data = await this.usersService.update(id, updateUserDto);
    return {data, status: 'success', message: 'User updated successfully'};
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this.usersService.remove(id);
    return {data, status: 'success', message: 'User deleted successfully'};
  }

  @Post('is-available')
  async isAvailable(@Body() body: { email: string }) {
    const data = await this.usersService.isAvailable(body.email);
    return {data, status: 'success', message: data ? 'User is available' : 'User is not available'};
  }
}
