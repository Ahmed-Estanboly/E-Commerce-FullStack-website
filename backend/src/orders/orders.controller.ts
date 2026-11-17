import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { OrdersService } from './orders.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard.js';

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
  findMine(@Request() req: { user: { sub: number } }) {
    return this.ordersService.findMine(req.user.sub);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }
}
