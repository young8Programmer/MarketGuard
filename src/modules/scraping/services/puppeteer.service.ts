import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer, { Browser, Page } from 'puppeteer';
import { Competitor } from '../../../entities/competitor.entity';
import { ScrapingResult } from '../../../common/interfaces/scraping-result.interface';
import { ProxyService } from './proxy.service';

@Injectable()
export class PuppeteerService {
  private readonly logger = new Logger(PuppeteerService.name);
  private browser: Browser | null = null;

  constructor(
    private configService: ConfigService,
    private proxyService: ProxyService,
  ) {}

  async scrape(competitor: Competitor, url: string): Promise<ScrapingResult> {
    let page: Page | null = null;

    try {
      if (!this.browser) {
        await this.initializeBrowser(competitor);
      }

      page = await this.browser!.newPage();

      // User agent o'rnatish
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );

      // Timeout sozlash
      const timeout = this.configService.get('SCRAPING_TIMEOUT_MS', 30000);
      page.setDefaultTimeout(timeout);

      // Saytni yuklash
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: timeout,
      });

      // Kechikish (saytlar blok qilmasligi uchun)
      const delay = competitor.scrapingDelay || this.configService.get('SCRAPING_DELAY_MS', 5000);
      await this.sleep(delay);

      // Konfiguratsiya bo'yicha ma'lumotlarni olish
      const config = competitor.scrapingConfig || {};
      const priceSelector = config.priceSelector || '[data-price], .price, .product-price';
      const nameSelector = config.nameSelector || 'h1, .product-title, .product-name';
      const imageSelector = config.imageSelector || '.product-image img, .product-img';

      const result: ScrapingResult = {
        success: false,
      };

      // Narxni olish
      try {
        const priceElement = await page.$(priceSelector);
        if (priceElement) {
          const priceText = await page.evaluate((el) => el.textContent, priceElement);
          result.price = this.extractPrice(priceText || '');
        }
      } catch (error) {
        this.logger.warn(`Could not extract price: ${error.message}`);
      }

      // Nomni olish
      try {
        const nameElement = await page.$(nameSelector);
        if (nameElement) {
          result.name = await page.evaluate((el) => el.textContent?.trim(), nameElement) || undefined;
        }
      } catch (error) {
        this.logger.warn(`Could not extract name: ${error.message}`);
      }

      // Rasmni olish
      try {
        const imageElement = await page.$(imageSelector);
        if (imageElement) {
          result.imageUrl = await page.evaluate((el) => (el as HTMLImageElement).src, imageElement);
        }
      } catch (error) {
        this.logger.warn(`Could not extract image: ${error.message}`);
      }

      // Mavjudligini tekshirish
      result.isAvailable = !!(await page.$('.out-of-stock, .unavailable')) === false;

      result.success = !!result.price;

      return result;
    } catch (error) {
      this.logger.error(`Puppeteer scraping failed for ${url}: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  private async initializeBrowser(competitor: Competitor): Promise<void> {
    const launchOptions: any = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    };

    // Agar proksi kerak bo'lsa
    if (competitor.requiresProxy) {
      const proxy = await this.proxyService.getProxy();
      if (proxy) {
        launchOptions.args.push(`--proxy-server=${proxy}`);
      }
    }

    this.browser = await puppeteer.launch(launchOptions);
    this.logger.log('Puppeteer browser initialized');
  }

  private extractPrice(text: string): number {
    // Matndan faqat raqam va nuqta/vergulni ajratib olish
    const cleaned = text.replace(/[^\d,.]/g, '').replace(',', '.');
    const price = parseFloat(cleaned);
    return isNaN(price) ? 0 : price;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.logger.log('Puppeteer browser closed');
    }
  }
}
