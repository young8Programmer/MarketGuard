import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Product } from '../../entities/product.entity';
import { PriceHistory } from '../../entities/price-history.entity';
import { CompetitorProduct } from '../../entities/competitor-product.entity';
import { ScrapingLog } from '../../entities/scraping-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, PriceHistory, CompetitorProduct, ScrapingLog]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
