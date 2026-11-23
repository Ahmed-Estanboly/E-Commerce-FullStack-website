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
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { BranchesService } from './branches.service.js';
import { BranchInventoryService } from './branch-inventory.service.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';
import { UpdateBranchInventoryDto } from './dto/update-branch-inventory.dto.js';
import { CreateBranchProductDto } from './dto/create-branch-product.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { BranchAccessGuard } from '../common/guards/branch-access.guard.js';

@Controller('branches')
export class BranchesController {
  constructor(
    private readonly branchesService: BranchesService,
    private readonly branchInventoryService: BranchInventoryService,
  ) {}

  @Get(':branchId/inventory')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchAccessGuard)
  @Roles('master admin', 'branch owner', 'central owner', 'south owner')
  getInventory(@Param('branchId') branchId: string) {
    return this.branchInventoryService.findAll(branchId);
  }

  @Get(':branchId/catalog')
  getCatalog(@Param('branchId') branchId: string) {
    return this.branchInventoryService.findCatalog(branchId);
  }

  @Get(':branchId/inventory/alerts')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchAccessGuard)
  @Roles('master admin', 'branch owner', 'central owner', 'south owner')
  getInventoryAlerts(@Param('branchId') branchId: string, @Query('threshold') threshold?: string) {
    const parsed = threshold ? Number.parseInt(threshold, 10) : undefined;
    return this.branchInventoryService.findAlerts(
      branchId,
      parsed !== undefined && Number.isFinite(parsed) && parsed >= 0 ? parsed : 5,
    );
  }

  @Get(':branchId/inventory/export')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchAccessGuard)
  @Roles('master admin', 'branch owner', 'central owner', 'south owner')
  async exportInventory(@Param('branchId') branchId: string, @Res() res: Response) {
    const csv = await this.branchInventoryService.exportCsv(branchId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="inventory-${branchId}.csv"`);
    res.send(csv);
  }

  @Put(':branchId/inventory/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchAccessGuard)
  @Roles('master admin', 'branch owner', 'central owner', 'south owner')
  updateInventory(
    @Param('branchId') branchId: string,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpdateBranchInventoryDto,
  ) {
    return this.branchInventoryService.update(branchId, productId, dto);
  }

  @Post(':branchId/inventory/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchAccessGuard)
  @Roles('master admin', 'branch owner', 'central owner', 'south owner')
  addInventoryProduct(
    @Param('branchId') branchId: string,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpdateBranchInventoryDto,
  ) {
    return this.branchInventoryService.add(branchId, productId, dto);
  }

  @Post(':branchId/products')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchAccessGuard)
  @Roles('master admin', 'branch owner', 'central owner', 'south owner')
  createBranchProduct(
    @Param('branchId') branchId: string,
    @Body() dto: CreateBranchProductDto,
  ) {
    return this.branchInventoryService.createProduct(branchId, dto);
  }

  @Delete(':branchId/inventory/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchAccessGuard)
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
