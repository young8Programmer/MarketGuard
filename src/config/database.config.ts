import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: this.configService.get('DB_HOST', 'localhost'),
      port: this.configService.get('DB_PORT', 3306),
      username: this.configService.get('DB_USERNAME', 'root'),
      password: this.configService.get('DB_PASSWORD', ''),
      database: this.configService.get('DB_DATABASE', 'marketguard'),
      entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
      migrations: [join(__dirname, '..', 'migrations', '*.{.ts,.js}')],
      synchronize: this.configService.get('NODE_ENV') === 'development',
      logging: this.configService.get('NODE_ENV') === 'development',
      charset: 'utf8mb4',
      timezone: '+00:00',
    };
  }
}
