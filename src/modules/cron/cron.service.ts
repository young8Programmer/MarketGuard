import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { ScrapingService } from '../scraping/scraping.service';
import { PriceService } from '../price/price.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private scrapingService: ScrapingService,
    private priceService: PriceService,
    private webSocketGateway: WebSocketGateway,
    private configService: ConfigService,
  ) {}

  /**
   * Har 15-30 minutda narxlarni tekshirish
   */
  @Cron('*/15 * * * *') // Har 15 minutda
  async handlePriceCheck() {
    this.logger.log('Starting scheduled price check...');

    try {
      // Scraping joblarini ishga tushirish
      await this.scrapingService.scheduleScrapingJobs();

      // WebSocket orqali status yuborish
      this.webSocketGateway.emitScrapingStatus({
        status: 'started',
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Error in scheduled price check: ${error.message}`);
    }
  }

  /**
   * Scraping tugagandan keyin narxlarni tekshirish va optimallashtirish
   */
  @Cron('*/20 * * * *') // Har 20 minutda (scraping tugagandan keyin)
  async handlePriceAdjustment() {
    this.logger.log('Starting scheduled price adjustment...');

    try {
      await this.priceService.checkAndAdjustPrices();

      this.webSocketGateway.emitScrapingStatus({
        status: 'price-check-completed',
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Error in scheduled price adjustment: ${error.message}`);
    }
  }

  /**
   * Har kuni ertalab 9:00 da umumiy statistika
   */
  @Cron('0 9 * * *')
  async handleDailyReport() {
    this.logger.log('Generating daily report...');
    // Bu yerda kunlik hisobot yuborish mumkin
  }

  /**
   * Har hafta yakshanba kuni 23:59 da haftalik hisobot
   */
  @Cron('59 23 * * 0')
  async handleWeeklyReport() {
    this.logger.log('Generating weekly report...');
    // Bu yerda haftalik hisobot yuborish mumkin
  }
}
