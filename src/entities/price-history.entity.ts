import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('price_history')
@Index(['product', 'createdAt'])
export class PriceHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, (product) => product.priceHistory)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  previousPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  changeAmount: number; // O'zgarish miqdori

  @Column({ type: 'float', nullable: true })
  changePercent: number; // O'zgarish foizi

  @Column({ type: 'varchar', length: 50, nullable: true })
  changeType: 'increase' | 'decrease' | 'stable'; // O'zgarish turi

  @Column({ type: 'text', nullable: true })
  reason: string; // O'zgarish sababi

  @Column({ type: 'boolean', default: false })
  isAutoAdjusted: boolean; // Avtomatik o'zgartirilganmi

  @CreateDateColumn()
  createdAt: Date;
}
