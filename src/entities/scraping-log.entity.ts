import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Competitor } from './competitor.entity';

export enum ScrapingStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('scraping_logs')
@Index(['competitor', 'status', 'createdAt'])
export class ScrapingLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Competitor)
  @JoinColumn({ name: 'competitorId' })
  competitor: Competitor;

  @Column()
  competitorId: number;

  @Column({ type: 'enum', enum: ScrapingStatus, default: ScrapingStatus.PENDING })
  status: ScrapingStatus;

  @Column({ type: 'text', nullable: true })
  url: string;

  @Column({ type: 'int', default: 0 })
  productsScraped: number;

  @Column({ type: 'int', default: 0 })
  productsUpdated: number;

  @Column({ type: 'int', default: 0 })
  errorsCount: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'json', nullable: true })
  metadata: {
    executionTime?: number;
    proxyUsed?: string;
    retryCount?: number;
  };

  @Column({ type: 'datetime', nullable: true })
  startedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
