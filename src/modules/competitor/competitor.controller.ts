import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CompetitorService } from './competitor.service';

@Controller('competitors')
export class CompetitorController {
  constructor(private readonly competitorService: CompetitorService) {}

  @Get()
  async findAll() {
    return await this.competitorService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return await this.competitorService.findOne(id);
  }

  @Post()
  async create(@Body() competitorData: any) {
    return await this.competitorService.create(competitorData);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() competitorData: any) {
    return await this.competitorService.update(id, competitorData);
  }

  @Delete(':id')
  async delete(@Param('id') id: number) {
    return await this.competitorService.delete(id);
  }

  @Post(':competitorId/link-product')
  async linkProduct(
    @Param('competitorId') competitorId: number,
    @Body('productId') productId: number,
    @Body('competitorUrl') competitorUrl: string,
  ) {
    return await this.competitorService.linkProduct(competitorId, productId, competitorUrl);
  }
}
