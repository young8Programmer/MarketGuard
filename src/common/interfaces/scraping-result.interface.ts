export interface ScrapingResult {
  success: boolean;
  price?: number;
  name?: string;
  imageUrl?: string;
  isAvailable?: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ScrapingJobData {
  competitorId: number;
  competitorProductId?: number;
  url: string;
  productId: number;
}
