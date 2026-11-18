import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { BranchesService } from './branches.service.js';
import { BranchInventoryService } from './branch-inventory.service.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';
import { UpdateBranchInventoryDto } from './dto/update-branch-inventory.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

@Controller('branches')
export class BranchesController {
  constructor(
    private readonly branchesService: BranchesService,
    private readonly branchInventoryService: BranchInventoryService,
  ) {}

  @Get(':branchId/inventory')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master admin', 'branch owner', 'central owner', 'south owner')
  getInventory(@Param('branchId') branchId: string) {
    return this.branchInventoryService.findAll(branchId);
  }

  @Put(':branchId/inventory/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master admin', 'branch owner', 'central owner', 'south owner')
  updateInventory(
    @Param('branchId') branchId: string,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpdateBranchInventoryDto,
  ) {
    return this.branchInventoryService.update(branchId, productId, dto);
  }

  @Delete(':branchId/inventory/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master admin', 'branch owner', 'central owner', 'south owner')
  removeInventory(
    @Param('branchId') branchId: string,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.branchInventoryService.remove(branchId, productId);
  }

  @Get()
  findAll() {
    return this.branchesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master admin')
  create(@Body() dto: CreateBranchDto) {
    return this.branchesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master admin')
  update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.branchesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master admin')
  remove(@Param('id') id: string) {
    return this.branchesService.remove(id);
  }
}
