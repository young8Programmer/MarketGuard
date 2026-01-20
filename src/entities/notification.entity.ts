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
import { Competitor } from './competitor.entity';

export enum NotificationType {
  PRICE_CHANGE = 'price_change',
  COMPETITOR_PRICE_DROP = 'competitor_price_drop',
  COMPETITOR_PRICE_INCREASE = 'competitor_price_increase',
  AUTO_PRICE_ADJUSTED = 'auto_price_adjusted',
  STOCK_LOW = 'stock_low',
  PRODUCT_UNAVAILABLE = 'product_unavailable',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  READ = 'read',
  FAILED = 'failed',
}

@Entity('notifications')
@Index(['status', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ nullable: true })
  productId: number;

  @ManyToOne(() => Competitor, { nullable: true })
  @JoinColumn({ name: 'competitorId' })
  competitor: Competitor;

  @Column({ nullable: true })
  competitorId: number;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'json', nullable: true })
  metadata: {
    oldPrice?: number;
    newPrice?: number;
    changeAmount?: number;
    competitorUrl?: string;
  };

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'datetime', nullable: true })
  readAt: Date;

  @Column({ type: 'datetime', nullable: true })
  sentAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
