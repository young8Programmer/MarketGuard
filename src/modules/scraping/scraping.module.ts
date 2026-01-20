import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { ScrapingService } from './scraping.service';
import { ScrapingController } from './scraping.controller';
import { ScrapingProcessor } from './scraping.processor';
import { Competitor } from '../../entities/competitor.entity';
import { CompetitorProduct } from '../../entities/competitor-product.entity';
import { ScrapingLog } from '../../entities/scraping-log.entity';
import { PuppeteerService } from './services/puppeteer.service';
import { CheerioService } from './services/cheerio.service';
import { ProxyService } from './services/proxy.service';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Competitor, CompetitorProduct, ScrapingLog]),
    BullModule.registerQueue({
      name: 'scraping',
    }),
    ConfigModule,
    WebSocketModule,
  ],
  controllers: [ScrapingController],
  providers: [
    ScrapingService,
    ScrapingProcessor,
    PuppeteerService,
    CheerioService,
    ProxyService,
  ],
  exports: [ScrapingService],
})
export class ScrapingModule {}
