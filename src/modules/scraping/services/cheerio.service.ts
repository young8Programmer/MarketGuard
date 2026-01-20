import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { Competitor } from '../../../entities/competitor.entity';
import { ScrapingResult } from '../../../common/interfaces/scraping-result.interface';
import { ProxyService } from './proxy.service';

@Injectable()
export class CheerioService {
  private readonly logger = new Logger(CheerioService.name);
  private axiosInstance: AxiosInstance;

  constructor(
    private configService: ConfigService,
    private proxyService: ProxyService,
  ) {
    this.axiosInstance = axios.create({
      timeout: this.configService.get('SCRAPING_TIMEOUT_MS', 30000),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
  }

  async scrape(competitor: Competitor, url: string): Promise<ScrapingResult> {
    try {
      // Kechikish
      const delay = competitor.scrapingDelay || this.configService.get('SCRAPING_DELAY_MS', 5000);
      await this.sleep(delay);

      // HTTP so'rov yuborish
      const config: any = {
        headers: competitor.scrapingConfig?.headers || {},
      };

      // Agar proksi kerak bo'lsa
      if (competitor.requiresProxy) {
        const proxy = await this.proxyService.getProxy();
        if (proxy) {
          config.proxy = {
            host: proxy.split(':')[0],
            port: parseInt(proxy.split(':')[1]),
          };
        }
      }

      const response = await this.axiosInstance.get(url, config);
      const $ = cheerio.load(response.data);

      const scrapingConfig = competitor.scrapingConfig || {};
      const priceSelector = scrapingConfig.priceSelector || '[data-price], .price, .product-price';
      const nameSelector = scrapingConfig.nameSelector || 'h1, .product-title, .product-name';
      const imageSelector = scrapingConfig.imageSelector || '.product-image img, .product-img';

      const result: ScrapingResult = {
        success: false,
      };

      // Narxni olish
      const priceElement = $(priceSelector).first();
      if (priceElement.length) {
        const priceText = priceElement.text().trim();
        result.price = this.extractPrice(priceText);
      }

      // Nomni olish
      const nameElement = $(nameSelector).first();
      if (nameElement.length) {
        result.name = nameElement.text().trim();
      }

      // Rasmni olish
      const imageElement = $(imageSelector).first();
      if (imageElement.length) {
        result.imageUrl = imageElement.attr('src') || imageElement.attr('data-src');
      }

      // Mavjudligini tekshirish
      result.isAvailable = $('.out-of-stock, .unavailable').length === 0;

      result.success = !!result.price;

      return result;
    } catch (error) {
      this.logger.error(`Cheerio scraping failed for ${url}: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private extractPrice(text: string): number {
    const cleaned = text.replace(/[^\d,.]/g, '').replace(',', '.');
    const price = parseFloat(cleaned);
    return isNaN(price) ? 0 : price;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
