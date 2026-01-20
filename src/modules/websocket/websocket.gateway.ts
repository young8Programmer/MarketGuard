import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connected', { message: 'Connected to MarketGuard WebSocket' });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:price-updates')
  handlePriceUpdates(client: Socket, payload: { productId?: number }) {
    const room = payload.productId ? `product:${payload.productId}` : 'price-updates';
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
    client.emit('subscribed', { room });
  }

  /**
   * Narx o'zgarishini barcha subscriberlarga yuborish
   */
  emitPriceUpdate(productId: number, data: any) {
    this.server.to(`product:${productId}`).emit('price-update', data);
    this.server.to('price-updates').emit('price-update', { productId, ...data });
  }

  /**
   * Xabarnoma yuborish
   */
  emitNotification(data: any) {
    this.server.emit('notification', data);
  }

  /**
   * Scraping status yangilanishi
   */
  emitScrapingStatus(data: any) {
    this.server.emit('scraping-status', data);
  }
}
