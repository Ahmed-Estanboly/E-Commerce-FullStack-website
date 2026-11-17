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
} from '@nestjs/common';
import { BranchesService } from './branches.service.js';
import { BranchInventoryService } from './branch-inventory.service.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';
import { UpdateBranchInventoryDto } from './dto/update-branch-inventory.dto.js';

@Controller('branches')
export class BranchesController {
  constructor(
    private readonly branchesService: BranchesService,
    private readonly branchInventoryService: BranchInventoryService,
  ) {}

  @Get(':branchId/inventory')
  getInventory(@Param('branchId') branchId: string) {
    return this.branchInventoryService.findAll(branchId);
  }

  @Put(':branchId/inventory/:productId')
  updateInventory(
    @Param('branchId') branchId: string,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpdateBranchInventoryDto,
  ) {
    return this.branchInventoryService.update(branchId, productId, dto);
  }

  @Delete(':branchId/inventory/:productId')
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
  create(@Body() dto: CreateBranchDto) {
    return this.branchesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.branchesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.branchesService.remove(id);
  }
}
