import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Competitor } from '../../entities/competitor.entity';
import { CompetitorProduct } from '../../entities/competitor-product.entity';

@Injectable()
export class CompetitorService {
  constructor(
    @InjectRepository(Competitor)
    private competitorRepository: Repository<Competitor>,
    @InjectRepository(CompetitorProduct)
    private competitorProductRepository: Repository<CompetitorProduct>,
  ) {}

  async findAll() {
    return await this.competitorRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    return await this.competitorRepository.findOne({
      where: { id },
      relations: ['competitorProducts', 'competitorProducts.product'],
    });
  }

  async create(competitorData: Partial<Competitor>) {
    const competitor = this.competitorRepository.create(competitorData);
    return await this.competitorRepository.save(competitor);
  }

  async update(id: number, competitorData: Partial<Competitor>) {
    await this.competitorRepository.update(id, competitorData);
    return await this.findOne(id);
  }

  async delete(id: number) {
    await this.competitorRepository.delete(id);
    return { message: 'Competitor deleted successfully' };
  }

  async linkProduct(competitorId: number, productId: number, competitorUrl: string) {
    const existing = await this.competitorProductRepository.findOne({
      where: { competitorId, productId },
    });

    if (existing) {
      existing.competitorUrl = competitorUrl;
      return await this.competitorProductRepository.save(existing);
    }

    const competitorProduct = this.competitorProductRepository.create({
      competitorId,
      productId,
      competitorUrl,
      currentPrice: 0,
      isAvailable: true,
    });

    return await this.competitorProductRepository.save(competitorProduct);
  }
}
