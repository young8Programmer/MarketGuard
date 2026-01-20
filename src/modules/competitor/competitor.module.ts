import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompetitorService } from './competitor.service';
import { CompetitorController } from './competitor.controller';
import { Competitor } from '../../entities/competitor.entity';
import { CompetitorProduct } from '../../entities/competitor-product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Competitor, CompetitorProduct])],
  controllers: [CompetitorController],
  providers: [CompetitorService],
  exports: [CompetitorService],
})
export class CompetitorModule {}
