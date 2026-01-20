import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 20 } = pagination;
    const [data, total] = await this.productRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    return await this.productRepository.findOne({
      where: { id },
      relations: ['competitorProducts', 'competitorProducts.competitor'],
    });
  }

  async create(productData: Partial<Product>) {
    const product = this.productRepository.create(productData);
    return await this.productRepository.save(product);
  }

  async update(id: number, productData: Partial<Product>) {
    await this.productRepository.update(id, productData);
    return await this.findOne(id);
  }

  async delete(id: number) {
    await this.productRepository.delete(id);
    return { message: 'Product deleted successfully' };
  }
}
