import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getHealth(): object {
    return {
      status: 'ok',
      service: 'MarketGuard API',
      version: '1.0.0',
      environment: this.configService.get('NODE_ENV', 'development'),
      timestamp: new Date().toISOString(),
    };
  }
}
