import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Request, UseGuards } from '@nestjs/common';
import { WishlistService } from './wishlist.service.js';
import { ToggleWishlistDto } from './dto/toggle-wishlist.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  list(@Request() req: { user: { sub: number } }) {
    return this.wishlistService.list(req.user.sub);
  }

  @Post()
  add(@Request() req: { user: { sub: number } }, @Body() dto: ToggleWishlistDto) {
    return this.wishlistService.add(req.user.sub, dto.productId);
  }

  @Delete(':productId')
  remove(@Request() req: { user: { sub: number } }, @Param('productId', ParseIntPipe) productId: number) {
    return this.wishlistService.remove(req.user.sub, productId);
  }
}
