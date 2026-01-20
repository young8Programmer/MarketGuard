import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceService } from './price.service';
import { PriceController } from './price.controller';
import { Product } from '../../entities/product.entity';
import { CompetitorProduct } from '../../entities/competitor-product.entity';
import { PriceHistory } from '../../entities/price-history.entity';
import { NotificationModule } from '../notification/notification.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, CompetitorProduct, PriceHistory]),
    NotificationModule,
    WebSocketModule,
  ],
  controllers: [PriceController],
  providers: [PriceService],
  exports: [PriceService],
})
export class PriceModule {}
