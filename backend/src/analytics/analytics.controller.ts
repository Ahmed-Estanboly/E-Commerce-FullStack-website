import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AnalyticsService } from './analytics.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Type } from 'class-transformer';
import { IsInt, IsMongoId, IsOptional, Max, Min } from 'class-validator';

class SalesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;

  @IsOptional()
  @IsMongoId()
  branchId?: string;
}

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('master admin')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('sales')
  sales(@Query() query: SalesQueryDto) {
    return this.analyticsService.sales(query.days ?? 30, query.branchId);
  }

  @Get('sales/export')
  async exportSales(@Query() query: SalesQueryDto, @Res() res: Response) {
    const csv = await this.analyticsService.salesCsv(query.days ?? 30, query.branchId);
    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="sales-${query.days ?? 30}d-${stamp}.csv"`);
    res.send(csv);
  }
}
