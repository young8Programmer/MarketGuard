import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Product } from '../../entities/product.entity';
import { CompetitorProduct } from '../../entities/competitor-product.entity';
import { PriceHistory } from '../../entities/price-history.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../../entities/notification.entity';
import { WebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class PriceService {
  private readonly logger = new Logger(PriceService.name);

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(CompetitorProduct)
    private competitorProductRepository: Repository<CompetitorProduct>,
    @InjectRepository(PriceHistory)
    private priceHistoryRepository: Repository<PriceHistory>,
    private notificationService: NotificationService,
    private configService: ConfigService,
    private webSocketGateway: WebSocketGateway,
  ) {}

  /**
   * Barcha mahsulotlar uchun narxlarni tekshirish va avtomatik o'zgartirish
   */
  async checkAndAdjustPrices(): Promise<void> {
    const products = await this.productRepository.find({
      where: { isActive: true },
      relations: ['competitorProducts', 'competitorProducts.competitor'],
    });

    this.logger.log(`Checking prices for ${products.length} products`);

    for (const product of products) {
      try {
        await this.checkProductPrices(product);
      } catch (error) {
        this.logger.error(`Error checking prices for product ${product.id}: ${error.message}`);
      }
    }
  }

  /**
   * Bitta mahsulot uchun narxlarni tekshirish
   */
  async checkProductPrices(product: Product): Promise<void> {
    const competitorProducts = product.competitorProducts.filter((cp) => cp.isAvailable);

    if (competitorProducts.length === 0) {
      return;
    }

    // Eng arzon narxni topish
    const prices = competitorProducts
      .map((cp) => cp.currentPrice)
      .filter((p) => p > 0);
    
    if (prices.length === 0) {
      return;
    }

    const minCompetitorPrice = Math.min(...prices);
    const minCompetitorProduct = competitorProducts.find(
      (cp) => cp.currentPrice === minCompetitorPrice,
    );

    // Narx farqini hisoblash
    const priceDifference = product.currentPrice - minCompetitorPrice;

    // Agar raqobatchi arzonroq bo'lsa
    if (priceDifference > 0) {
      const margin = this.configService.get('MIN_PRICE_MARGIN_SOMS', 100);
      const recommendedPrice = minCompetitorPrice - margin;

      // Xabarnoma yuborish
      await this.notificationService.createNotification({
        type: NotificationType.COMPETITOR_PRICE_DROP,
        productId: product.id,
        competitorId: minCompetitorProduct?.competitorId,
        title: `Raqobatchi narxni tushirdi`,
        message: `Raqobatchi ${minCompetitorProduct?.competitor.name} narxni ${priceDifference.toFixed(0)} so'mga tushirdi. Hozirgi narx: ${product.currentPrice}, Raqobatchi narxi: ${minCompetitorPrice}`,
        metadata: {
          oldPrice: product.currentPrice,
          newPrice: minCompetitorPrice,
          changeAmount: priceDifference,
          competitorUrl: minCompetitorProduct?.competitorUrl,
        },
      });

      // Avtomatik o'zgartirish
      if (product.autoPriceAdjustment && recommendedPrice >= product.minPrice) {
        await this.adjustProductPrice(product, recommendedPrice, true);
      } else if (recommendedPrice < product.minPrice) {
        this.logger.warn(
          `Cannot adjust price for product ${product.id}: recommended price ${recommendedPrice} is below minimum ${product.minPrice}`,
        );
      }
    }

    // Narx tarixini yozish
    await this.recordPriceHistory(product, product.currentPrice);
  }

  /**
   * Mahsulot narxini o'zgartirish
   */
  async adjustProductPrice(
    product: Product,
    newPrice: number,
    isAutoAdjusted: boolean = false,
  ): Promise<void> {
    const oldPrice = product.currentPrice;

    // Minimal narxni tekshirish
    if (newPrice < product.minPrice) {
      throw new Error(`New price ${newPrice} is below minimum price ${product.minPrice}`);
    }

    // Xarid narxidan past bo'lmasligi kerak (zarar bo'lmasligi uchun)
    if (newPrice < product.costPrice) {
      throw new Error(`New price ${newPrice} is below cost price ${product.costPrice}`);
    }

    // Narxni yangilash
    product.currentPrice = newPrice;
    await this.productRepository.save(product);

    // Tarixni yozish
    await this.recordPriceHistory(product, newPrice, oldPrice, isAutoAdjusted);

    // Real-time WebSocket xabarnomasi
    this.webSocketGateway.emitPriceUpdate(product.id, {
      productId: product.id,
      productName: product.name,
      oldPrice,
      newPrice,
      changeAmount: newPrice - oldPrice,
      isAutoAdjusted,
      timestamp: new Date(),
    });

    // Xabarnoma
    if (isAutoAdjusted) {
      await this.notificationService.createNotification({
        type: NotificationType.AUTO_PRICE_ADJUSTED,
        productId: product.id,
        title: `Narx avtomatik o'zgartirildi`,
        message: `Mahsulot narxi ${oldPrice} dan ${newPrice} ga o'zgartirildi (avtomatik)`,
        metadata: {
          oldPrice,
          newPrice,
          changeAmount: newPrice - oldPrice,
        },
      });
    }

    this.logger.log(
      `Price adjusted for product ${product.id}: ${oldPrice} -> ${newPrice} (auto: ${isAutoAdjusted})`,
    );
  }

  /**
   * Narx tarixini yozish
   */
  async recordPriceHistory(
    product: Product,
    currentPrice: number,
    previousPrice?: number,
    isAutoAdjusted: boolean = false,
  ): Promise<PriceHistory> {
    if (!previousPrice) {
      // Oldingi narxni topish
      const lastHistory = await this.priceHistoryRepository.findOne({
        where: { productId: product.id },
        order: { createdAt: 'DESC' },
      });
      previousPrice = lastHistory?.price || product.currentPrice;
    }

    const changeAmount = currentPrice - previousPrice;
    const changePercent = previousPrice > 0 ? (changeAmount / previousPrice) * 100 : 0;
    const changeType: 'increase' | 'decrease' | 'stable' =
      changeAmount > 0 ? 'increase' : changeAmount < 0 ? 'decrease' : 'stable';

    const history = this.priceHistoryRepository.create({
      productId: product.id,
      price: currentPrice,
      previousPrice,
      changeAmount,
      changePercent,
      changeType,
      isAutoAdjusted,
      reason: isAutoAdjusted ? 'Avtomatik optimallashtirish' : 'Qo'lda o'zgartirish',
    });

    return await this.priceHistoryRepository.save(history);
  }

  /**
   * Mahsulot narx tarixini olish
   */
  async getPriceHistory(productId: number, days: number = 30): Promise<PriceHistory[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.priceHistoryRepository.find({
      where: { productId },
      order: { createdAt: 'DESC' },
    });
  }
}
