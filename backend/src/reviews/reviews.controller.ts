import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

@Controller('products/:productId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(
    @Param('productId', ParseIntPipe) productId: number,
    @Request() req: { user?: { sub: number } },
  ) {
    return this.reviewsService.list(productId, req.user?.sub);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: CreateReviewDto,
    @Request() req: { user: { sub: number; email?: string } },
  ) {
    return this.reviewsService.upsert(productId, { id: req.user.sub, email: req.user.email }, dto);
  }

  @Delete(':reviewId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('master admin')
  remove(@Param('reviewId') reviewId: string) {
    return this.reviewsService.remove(reviewId);
  }
}
