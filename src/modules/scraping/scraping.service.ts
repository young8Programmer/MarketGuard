import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { Competitor } from '../../entities/competitor.entity';
import { CompetitorProduct } from '../../entities/competitor-product.entity';
import { ScrapingLog, ScrapingStatus } from '../../entities/scraping-log.entity';
import { ScrapingResult, ScrapingJobData } from '../../common/interfaces/scraping-result.interface';
import { PuppeteerService } from './services/puppeteer.service';
import { CheerioService } from './services/cheerio.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);

  constructor(
    @InjectRepository(Competitor)
    private competitorRepository: Repository<Competitor>,
    @InjectRepository(CompetitorProduct)
    private competitorProductRepository: Repository<CompetitorProduct>,
    @InjectRepository(ScrapingLog)
    private scrapingLogRepository: Repository<ScrapingLog>,
    @InjectQueue('scraping')
    private scrapingQueue: Queue,
    private puppeteerService: PuppeteerService,
    private cheerioService: CheerioService,
    private configService: ConfigService,
    private webSocketGateway: WebSocketGateway,
  ) {}

  /**
   * Barcha faol raqobatchilar uchun scraping job yaratish
   */
  async scheduleScrapingJobs(): Promise<void> {
    const activeCompetitors = await this.competitorRepository.find({
      where: { isActive: true },
    });

    this.logger.log(`Scheduling scraping jobs for ${activeCompetitors.length} competitors`);

    // WebSocket orqali status yuborish
    this.webSocketGateway.emitScrapingStatus({
      status: 'scheduling',
      competitorsCount: activeCompetitors.length,
      timestamp: new Date(),
    });

    let totalJobs = 0;
    for (const competitor of activeCompetitors) {
      const products = await this.competitorProductRepository.find({
        where: { competitorId: competitor.id },
        relations: ['product'],
      });

      for (const competitorProduct of products) {
        await this.scrapingQueue.add(
          'scrape-competitor-price',
          {
            competitorId: competitor.id,
            competitorProductId: competitorProduct.id,
            url: competitorProduct.competitorUrl,
            productId: competitorProduct.productId,
          } as ScrapingJobData,
          {
            attempts: this.configService.get('SCRAPING_RETRY_ATTEMPTS', 3),
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
          },
        );
        totalJobs++;
      }
    }

    this.logger.log(`Scheduled ${totalJobs} scraping jobs`);
    
    this.webSocketGateway.emitScrapingStatus({
      status: 'scheduled',
      totalJobs,
      timestamp: new Date(),
    });
  }

  /**
   * Bitta URL uchun scraping qilish
   */
  async scrapePrice(data: ScrapingJobData): Promise<ScrapingResult> {
    const competitor = await this.competitorRepository.findOne({
      where: { id: data.competitorId },
    });

    if (!competitor) {
      return { success: false, error: 'Competitor not found' };
    }

    const log = await this.createScrapingLog(competitor.id, data.url);

    try {
      let result: ScrapingResult;

      // Platforma bo'yicha scraping usulini tanlash
      if (competitor.platform === 'uzum' || competitor.platform === 'olcha') {
        // Uzum va Olcha uchun Puppeteer ishlatish (JS render kerak bo'lishi mumkin)
        result = await this.puppeteerService.scrape(competitor, data.url);
      } else {
        // Boshqa saytlar uchun Cheerio (tezroq)
        result = await this.cheerioService.scrape(competitor, data.url);
      }

      await this.updateScrapingLog(log.id, {
        status: result.success ? ScrapingStatus.SUCCESS : ScrapingStatus.FAILED,
        errorMessage: result.error,
        completedAt: new Date(),
        metadata: {
          executionTime: Date.now() - log.createdAt.getTime(),
          ...result.metadata,
        },
      });

      // Agar muvaffaqiyatli bo'lsa, narxni yangilash
      if (result.success && result.price && data.competitorProductId) {
        await this.updateCompetitorPrice(data.competitorProductId, result);
      }

      return result;
    } catch (error) {
      this.logger.error(`Scraping failed for ${data.url}: ${error.message}`);
      await this.updateScrapingLog(log.id, {
        status: ScrapingStatus.FAILED,
        errorMessage: error.message,
        completedAt: new Date(),
      });
      return { success: false, error: error.message };
    }
  }

  private async createScrapingLog(
    competitorId: number,
    url: string,
  ): Promise<ScrapingLog> {
    const log = this.scrapingLogRepository.create({
      competitorId,
      url,
      status: ScrapingStatus.IN_PROGRESS,
      startedAt: new Date(),
    });
    return await this.scrapingLogRepository.save(log);
  }

  private async updateScrapingLog(
    logId: number,
    updates: Partial<ScrapingLog>,
  ): Promise<void> {
    await this.scrapingLogRepository.update(logId, updates);
  }

  private async updateCompetitorPrice(
    competitorProductId: number,
    result: ScrapingResult,
  ): Promise<void> {
    const competitorProduct = await this.competitorProductRepository.findOne({
      where: { id: competitorProductId },
      relations: ['product', 'competitor'],
    });

    if (!competitorProduct) return;

    const previousPrice = competitorProduct.currentPrice;
    const newPrice = result.price!;

    // Narx o'zgarganini tekshirish
    if (previousPrice !== newPrice) {
      competitorProduct.previousPrice = previousPrice;
      competitorProduct.currentPrice = newPrice;
      competitorProduct.lastPriceChangeAt = new Date();

      // WebSocket orqali real-time xabar
      if (competitorProduct.product) {
        this.webSocketGateway.emitPriceUpdate(competitorProduct.productId, {
          productId: competitorProduct.productId,
          competitorId: competitorProduct.competitorId,
          competitorName: competitorProduct.competitor?.name,
          oldPrice: previousPrice,
          newPrice: newPrice,
          changeAmount: newPrice - previousPrice,
          timestamp: new Date(),
        });
      }
    }

    competitorProduct.isAvailable = result.isAvailable ?? true;
    competitorProduct.lastCheckedAt = new Date();
    if (result.name) {
      competitorProduct.competitorProductName = result.name;
    }

    await this.competitorProductRepository.save(competitorProduct);
  }
}
