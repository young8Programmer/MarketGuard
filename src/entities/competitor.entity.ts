import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CompetitorProduct } from './competitor-product.entity';

export enum CompetitorPlatform {
  UZUM = 'uzum',
  OLCHA = 'olcha',
  AMAZON = 'amazon',
  WILDBERRIES = 'wildberries',
  OTHER = 'other',
}

@Entity('competitors')
export class Competitor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'enum', enum: CompetitorPlatform })
  platform: CompetitorPlatform;

  @Column({ length: 500 })
  baseUrl: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  requiresProxy: boolean; // Proksi kerakmi

  @Column({ type: 'json', nullable: true })
  scrapingConfig: {
    selector?: string;
    priceSelector?: string;
    nameSelector?: string;
    imageSelector?: string;
    headers?: Record<string, string>;
    delay?: number;
  };

  @Column({ type: 'int', default: 0 })
  scrapingDelay: number; // Scraping o'rtasidagi kechikish (ms)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(
    () => CompetitorProduct,
    (competitorProduct) => competitorProduct.competitor,
  )
  competitorProducts: CompetitorProduct[];
}
