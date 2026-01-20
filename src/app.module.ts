import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseConfig } from './config/database.config';
import { ProductModule } from './modules/product/product.module';
import { CompetitorModule } from './modules/competitor/competitor.module';
import { ScrapingModule } from './modules/scraping/scraping.module';
import { PriceModule } from './modules/price/price.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ReportModule } from './modules/report/report.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { CronModule } from './modules/cron/cron.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: DatabaseConfig,
    }),

    // Scheduling
    ScheduleModule.forRoot(),

    // BullMQ Queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),

    // Feature Modules
    ProductModule,
    CompetitorModule,
    ScrapingModule,
    PriceModule,
    NotificationModule,
    ReportModule,
    AnalyticsModule,
    WebSocketModule,
    CronModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
