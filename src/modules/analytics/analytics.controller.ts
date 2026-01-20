import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboardStats() {
    return await this.analyticsService.getDashboardStats();
  }

  @Get('products/:productId/price-changes')
  async getProductPriceChanges(
    @Param('productId') productId: number,
    @Query('days') days?: number,
  ) {
    return await this.analyticsService.getProductPriceChanges(productId, days ? parseInt(days.toString()) : 30);
  }

  @Get('products/:productId/competitors')
  async getCompetitorComparison(@Param('productId') productId: number) {
    return await this.analyticsService.getCompetitorComparison(productId);
  }
}
