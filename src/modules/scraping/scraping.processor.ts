import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ScrapingService } from './scraping.service';
import { ScrapingJobData } from '../../common/interfaces/scraping-result.interface';

@Processor('scraping')
export class ScrapingProcessor extends WorkerHost {
  private readonly logger = new Logger(ScrapingProcessor.name);

  constructor(private readonly scrapingService: ScrapingService) {
    super();
  }

  async process(job: Job<ScrapingJobData>): Promise<any> {
    this.logger.log(`Processing scraping job ${job.id} for URL: ${job.data.url}`);
    return await this.scrapingService.scrapePrice(job.data);
  }
}
