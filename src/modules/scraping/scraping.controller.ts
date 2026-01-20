import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ScrapingService } from './scraping.service';

@Controller('scraping')
export class ScrapingController {
  constructor(private readonly scrapingService: ScrapingService) {}

  @Post('schedule')
  async scheduleScraping() {
    await this.scrapingService.scheduleScrapingJobs();
    return { message: 'Scraping jobs scheduled successfully' };
  }

  @Get('status')
  async getStatus() {
    return { status: 'ok', message: 'Scraping service is running' };
  }
}
