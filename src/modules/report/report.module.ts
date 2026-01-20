import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { Product } from '../../entities/product.entity';
import { PriceHistory } from '../../entities/price-history.entity';
import { CompetitorProduct } from '../../entities/competitor-product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, PriceHistory, CompetitorProduct])],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
