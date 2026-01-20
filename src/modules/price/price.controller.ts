import { Controller, Get, Post, Body, Param, Query, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceService } from './price.service';
import { Product } from '../../entities/product.entity';

@Controller('price')
export class PriceController {
  constructor(
    private readonly priceService: PriceService,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  @Post('check-all')
  async checkAllPrices() {
    await this.priceService.checkAndAdjustPrices();
    return { message: 'Price check completed' };
  }

  @Post('adjust/:productId')
  async adjustPrice(
    @Param('productId') productId: number,
    @Body('newPrice') newPrice: number,
  ) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      return { error: 'Product not found' };
    }
    await this.priceService.adjustProductPrice(product, newPrice, false);
    return { message: 'Price adjusted successfully' };
  }

  @Get('history/:productId')
  async getPriceHistory(
    @Param('productId') productId: number,
    @Query('days') days?: number,
  ) {
    const history = await this.priceService.getPriceHistory(productId, days ? parseInt(days.toString()) : 30);
    return { history };
  }
}
