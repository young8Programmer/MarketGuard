import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PriceHistory } from './price-history.entity';
import { CompetitorProduct } from './competitor-product.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 100, nullable: true })
  sku: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  currentPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  minPrice: number; // Minimal chegara narx

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  costPrice: number; // Xarid narxi

  @Column({ type: 'int', default: 0 })
  stockQuantity: number; // Ombordagi miqdor

  @Column({ type: 'int', default: 100 })
  autoAdjustmentMargin: number; // Avtomatik o'zgartirish uchun minimal marja (so'm)

  @Column({ type: 'boolean', default: false })
  autoPriceAdjustment: boolean; // Avtomatik narx o'zgartirish yoqilganmi

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  imageUrl: string;

  @Column({ type: 'json', nullable: true })
  metadata: object; // Qo'shimcha ma'lumotlar

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => PriceHistory, (priceHistory) => priceHistory.product)
  priceHistory: PriceHistory[];

  @OneToMany(
    () => CompetitorProduct,
    (competitorProduct) => competitorProduct.product,
  )
  competitorProducts: CompetitorProduct[];
}
