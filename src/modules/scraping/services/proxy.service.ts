import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private proxyList: string[] = [];
  private currentProxyIndex = 0;

  constructor(private configService: ConfigService) {
    this.initializeProxyList();
  }

  private initializeProxyList(): void {
    const proxyEnabled = this.configService.get('PROXY_ENABLED', 'false') === 'true';
    
    if (proxyEnabled) {
      const proxyListString = this.configService.get('PROXY_LIST', '');
      this.proxyList = proxyListString
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      
      this.logger.log(`Initialized ${this.proxyList.length} proxies`);
    }
  }

  /**
   * Keyingi proksini olish (round-robin)
   */
  async getProxy(): Promise<string | null> {
    if (this.proxyList.length === 0) {
      return null;
    }

    const proxy = this.proxyList[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyList.length;
    
    return proxy;
  }

  /**
   * Proksi listini yangilash
   */
  updateProxyList(proxies: string[]): void {
    this.proxyList = proxies;
    this.currentProxyIndex = 0;
    this.logger.log(`Updated proxy list: ${proxies.length} proxies`);
  }

  /**
   * Proksi mavjudligini tekshirish
   */
  async testProxy(proxy: string): Promise<boolean> {
    try {
      const [host, port] = proxy.split(':');
      // Bu yerda haqiqiy proksi testini amalga oshirish mumkin
      return true;
    } catch {
      return false;
    }
  }
}
