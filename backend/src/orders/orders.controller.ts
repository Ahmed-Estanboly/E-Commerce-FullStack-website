import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { OrdersService } from './orders.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { BranchAccessGuard } from '../common/guards/branch-access.guard.js';

interface AuthenticatedUser {
  sub: number;
  email?: string;
  role?: string;
  branchId?: string;
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  create(
    @Body() createOrderDto: CreateOrderDto,
    @Request() req: { user?: { sub: number } },
  ) {
    return this.ordersService.create(createOrderDto, req.user?.sub);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMine(
    @Request() req: { user: AuthenticatedUser },
    @Query() query: PaginationQueryDto,
  ) {
    return this.ordersService.findMine(req.user.sub, req.user.email, query);
  }

  @Get('me/:id')
  @UseGuards(JwtAuthGuard)
  async findMyOrder(@Param('id') id: string, @Request() req: { user: AuthenticatedUser }) {
    const order = await this.ordersService.findOneForCustomer(id, req.user.sub);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  @Get('branch/:branchId')
  @UseGuards(JwtAuthGuard, RolesGuard, BranchAccessGuard)
  @Roles('master admin', 'branch owner', 'central owner', 'south owner')
  findByBranch(
    @Param('branchId') branchId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.ordersService.findByBranch(branchId, query);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master admin', 'branch owner', 'central owner', 'south owner')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Request() req: { user: AuthenticatedUser },
  ) {
    return this.ordersService.updateStatus(id, dto, {
      id: req.user.sub,
      role: req.user.role,
      branchId: req.user.branchId,
      label: `${req.user.role ?? 'user'}:${req.user.sub}`,
    });
  }

  @Get('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master admin')
  async export(@Res() res: Response) {
    const csv = await this.ordersService.exportCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    res.send(csv);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master admin')
  findAll(@Query() query: PaginationQueryDto) {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master admin')
  async findOne(@Param('id') id: string) {
    const order = await this.ordersService.findOne(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }
}
