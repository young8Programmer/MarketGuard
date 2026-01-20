import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { PriceHistory } from '../../entities/price-history.entity';
import { CompetitorProduct } from '../../entities/competitor-product.entity';
import { ScrapingLog } from '../../entities/scraping-log.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(PriceHistory)
    private priceHistoryRepository: Repository<PriceHistory>,
    @InjectRepository(CompetitorProduct)
    private competitorProductRepository: Repository<CompetitorProduct>,
    @InjectRepository(ScrapingLog)
    private scrapingLogRepository: Repository<ScrapingLog>,
  ) {}

  /**
   * Umumiy statistika
   */
  async getDashboardStats() {
    const totalProducts = await this.productRepository.count({ where: { isActive: true } });
    const totalCompetitors = await this.competitorProductRepository.count();
    const totalPriceChanges = await this.priceHistoryRepository.count({
      where: {
        createdAt: Between(
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          new Date(),
        ),
      },
    });

    // Ombordagi tovarlar statistikasi
    const products = await this.productRepository.find({ where: { isActive: true } });
    const totalStock = products.reduce((sum, p) => sum + p.stockQuantity, 0);
    const lowStockProducts = products.filter((p) => p.stockQuantity < 10).length;

    // Scraping statistikasi
    const scrapingLogs = await this.scrapingLogRepository.find({
      where: {
        createdAt: Between(
          new Date(Date.now() - 24 * 60 * 60 * 1000),
          new Date(),
        ),
      },
    });

    const successfulScrapes = scrapingLogs.filter((log) => log.status === 'success').length;
    const failedScrapes = scrapingLogs.filter((log) => log.status === 'failed').length;

    return {
      totalProducts,
      totalCompetitors,
      totalPriceChanges,
      totalStock,
      lowStockProducts,
      scraping: {
        total: scrapingLogs.length,
        successful: successfulScrapes,
        failed: failedScrapes,
        successRate: scrapingLogs.length > 0 ? (successfulScrapes / scrapingLogs.length) * 100 : 0,
      },
    };
  }

  /**
   * Mahsulotlar bo'yicha narx o'zgarishlari
   */
  async getProductPriceChanges(productId: number, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const history = await this.priceHistoryRepository.find({
      where: {
        productId,
        createdAt: Between(startDate, new Date()),
      },
      order: { createdAt: 'ASC' },
    });

    return {
      productId,
      period: `${days} days`,
      changes: history.map((h) => ({
        date: h.createdAt,
        price: h.price,
        changeAmount: h.changeAmount,
        changePercent: h.changePercent,
        isAutoAdjusted: h.isAutoAdjusted,
      })),
      summary: {
        totalChanges: history.length,
        averageChange: history.reduce((sum, h) => sum + (h.changeAmount || 0), 0) / history.length || 0,
        maxIncrease: Math.max(...history.map((h) => h.changeAmount || 0)),
        maxDecrease: Math.min(...history.map((h) => h.changeAmount || 0)),
      },
    };
  }

  /**
   * Raqobatchilar bo'yicha taqqoslash
   */
  async getCompetitorComparison(productId: number) {
    const competitorProducts = await this.competitorProductRepository.find({
      where: { productId },
      relations: ['competitor'],
    });

    const product = await this.productRepository.findOne({ where: { id: productId } });

    return {
      product: {
        id: product?.id,
        name: product?.name,
        currentPrice: product?.currentPrice,
      },
      competitors: competitorProducts.map((cp) => ({
        id: cp.competitorId,
        name: cp.competitor.name,
        platform: cp.competitor.platform,
        price: cp.currentPrice,
        priceDifference: product ? cp.currentPrice - product.currentPrice : 0,
        isAvailable: cp.isAvailable,
        lastChecked: cp.lastCheckedAt,
      })),
    };
  }
}
