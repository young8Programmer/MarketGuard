import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { ScrapingModule } from '../scraping/scraping.module';
import { PriceModule } from '../price/price.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [ScrapingModule, PriceModule, WebSocketModule],
  providers: [CronService],
})
export class CronModule {}
