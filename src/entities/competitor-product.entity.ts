import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Product } from './product.entity';
import { Competitor } from './competitor.entity';

@Entity('competitor_products')
@Index(['product', 'competitor'], { unique: true })
export class CompetitorProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, (product) => product.competitorProducts)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: number;

  @ManyToOne(() => Competitor, (competitor) => competitor.competitorProducts)
  @JoinColumn({ name: 'competitorId' })
  competitor: Competitor;

  @Column()
  competitorId: number;

  @Column({ length: 500 })
  competitorUrl: string; // Raqobatchi saytdagi tovar linki

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  currentPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  previousPrice: number; // Oldingi narx

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean; // Tovar mavjudmi

  @Column({ type: 'text', nullable: true })
  competitorProductName: string; // Raqobatchi saytdagi tovar nomi

  @Column({ type: 'datetime', nullable: true })
  lastCheckedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  lastPriceChangeAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
