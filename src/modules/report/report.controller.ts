import { Controller, Get, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportService } from './report.service';
import { readFileSync, existsSync } from 'fs';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('weekly')
  async generateWeeklyReport() {
    return await this.reportService.generateWeeklyReport();
  }

  @Get('monthly')
  async generateMonthlyReport() {
    return await this.reportService.generateMonthlyReport();
  }

  @Get('custom')
  async generateCustomReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('format') format: 'excel' | 'pdf' = 'excel',
    @Res() res: Response,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const filepath =
      format === 'excel'
        ? await this.reportService.generateExcelReport(start, end)
        : await this.reportService.generatePDFReport(start, end);

    if (existsSync(filepath)) {
      const file = readFileSync(filepath);
      const mimetype = format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf';
      res.setHeader('Content-Type', mimetype);
      res.setHeader('Content-Disposition', `attachment; filename=${filepath.split('/').pop()}`);
      res.send(file);
    } else {
      res.status(404).send('Report not found');
    }
  }
}
