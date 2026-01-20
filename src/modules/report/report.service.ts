import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';
import { Product } from '../../entities/product.entity';
import { PriceHistory } from '../../entities/price-history.entity';
import { CompetitorProduct } from '../../entities/competitor-product.entity';
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(PriceHistory)
    private priceHistoryRepository: Repository<PriceHistory>,
    @InjectRepository(CompetitorProduct)
    private competitorProductRepository: Repository<CompetitorProduct>,
  ) {}

  /**
   * Excel hisobot yaratish
   */
  async generateExcelReport(
    startDate: Date,
    endDate: Date,
    productIds?: number[],
  ): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Price Report');

    // Sarlavhalar
    worksheet.columns = [
      { header: 'Mahsulot ID', key: 'productId', width: 12 },
      { header: 'Mahsulot nomi', key: 'productName', width: 30 },
      { header: 'Eski narx', key: 'oldPrice', width: 15 },
      { header: 'Yangi narx', key: 'newPrice', width: 15 },
      { header: "O'zgarish", key: 'change', width: 15 },
      { header: "O'zgarish %", key: 'changePercent', width: 15 },
      { header: 'Sana', key: 'date', width: 20 },
      { header: 'Avtomatik', key: 'autoAdjusted', width: 12 },
    ];

    // Ma'lumotlarni olish
    const where: any = {
      createdAt: Between(startDate, endDate),
    };
    if (productIds && productIds.length > 0) {
      where.productId = In(productIds);
    }

    const priceHistory = await this.priceHistoryRepository.find({
      where,
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });

    // Qatorlarni qo'shish
    for (const history of priceHistory) {
      worksheet.addRow({
        productId: history.productId,
        productName: history.product.name,
        oldPrice: history.previousPrice,
        newPrice: history.price,
        change: history.changeAmount,
        changePercent: `${history.changePercent?.toFixed(2)}%`,
        date: history.createdAt.toLocaleDateString('uz-UZ'),
        autoAdjusted: history.isAutoAdjusted ? 'Ha' : 'Yo\'q',
      });
    }

    // Stil qo'llash
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Reports papkasini yaratish
    const reportsDir = join(process.cwd(), 'reports');
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }

    // Faylni saqlash
    const filename = `price-report-${Date.now()}.xlsx`;
    const filepath = join(reportsDir, filename);
    await workbook.xlsx.writeFile(filepath);

    return filepath;
  }

  /**
   * PDF hisobot yaratish
   */
  async generatePDFReport(
    startDate: Date,
    endDate: Date,
    productIds?: number[],
  ): Promise<string> {
    // Reports papkasini yaratish
    const reportsDir = join(process.cwd(), 'reports');
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }

    const filename = `price-report-${Date.now()}.pdf`;
    const filepath = join(reportsDir, filename);
    
    const doc = new PDFDocument();
    doc.pipe(createWriteStream(filepath));

    // Sarlavha
    doc.fontSize(20).text('Narx Monitoring Hisoboti', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Davr: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);
    doc.moveDown();

    // Reports papkasini yaratish
    const reportsDir = join(process.cwd(), 'reports');
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }

    // Ma'lumotlarni olish
    const where: any = {
      createdAt: Between(startDate, endDate),
    };
    if (productIds && productIds.length > 0) {
      where.productId = In(productIds);
    }

    const priceHistory = await this.priceHistoryRepository.find({
      where,
      relations: ['product'],
      order: { createdAt: 'DESC' },
      take: 100, // PDF uchun limit
    });

    // Jadval
    let y = doc.y;
    doc.fontSize(10);

    for (const history of priceHistory) {
      doc.text(`Mahsulot: ${history.product.name}`, { continued: false });
      doc.text(`Narx: ${history.previousPrice} -> ${history.price}`, { indent: 20 });
      doc.text(`O'zgarish: ${history.changeAmount} (${history.changePercent?.toFixed(2)}%)`, {
        indent: 20,
      });
      doc.text(`Sana: ${history.createdAt.toLocaleDateString()}`, { indent: 20 });
      doc.moveDown(0.5);
    }

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(filepath));
      doc.on('error', reject);
    });
  }

  /**
   * Haftalik hisobot
   */
  async generateWeeklyReport(): Promise<{ excel: string; pdf: string }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const excel = await this.generateExcelReport(startDate, endDate);
    const pdf = await this.generatePDFReport(startDate, endDate);

    return { excel, pdf };
  }

  /**
   * Oylik hisobot
   */
  async generateMonthlyReport(): Promise<{ excel: string; pdf: string }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    const excel = await this.generateExcelReport(startDate, endDate);
    const pdf = await this.generatePDFReport(startDate, endDate);

    return { excel, pdf };
  }
}
