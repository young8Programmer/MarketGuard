import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll(@Query() pagination: PaginationDto) {
    return await this.productService.findAll(pagination);
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return await this.productService.findOne(id);
  }

  @Post()
  async create(@Body() productData: any) {
    return await this.productService.create(productData);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() productData: any) {
    return await this.productService.update(id, productData);
  }

  @Delete(':id')
  async delete(@Param('id') id: number) {
    return await this.productService.delete(id);
  }
}
