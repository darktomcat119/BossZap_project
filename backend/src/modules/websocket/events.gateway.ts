import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';

interface TokenPayload {
  sub: string;
  type: string;
}

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/',
})
export class EventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private readonly subscriberSockets = new Map<
    string,
    Set<string>
  >();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace(
          'Bearer ',
          '',
        );

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<TokenPayload>(
        token,
        {
          secret: this.configService.get<string>(
            'JWT_SECRET',
          ),
        },
      );

      const subscriberId = payload.sub;
      client.data.subscriberId = subscriberId;

      client.join(`subscriber:${subscriberId}`);

      if (!this.subscriberSockets.has(subscriberId)) {
        this.subscriberSockets.set(
          subscriberId,
          new Set(),
        );
      }
      this.subscriberSockets
        .get(subscriberId)
        ?.add(client.id);

      this.logger.log(
        `Client connected: ${subscriberId}`,
      );
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const subscriberId = client.data
      .subscriberId as string;
    if (subscriberId) {
      this.subscriberSockets
        .get(subscriberId)
        ?.delete(client.id);

      if (
        this.subscriberSockets.get(subscriberId)?.size === 0
      ) {
        this.subscriberSockets.delete(subscriberId);
      }

      this.logger.log(
        `Client disconnected: ${subscriberId}`,
      );
    }
  }

  emitToSubscriber(
    subscriberId: string,
    event: string,
    data: unknown,
  ): void {
    this.server
      .to(`subscriber:${subscriberId}`)
      .emit(event, data);
  }

  emitFinancialCreated(
    subscriberId: string,
    record: unknown,
  ): void {
    this.emitToSubscriber(
      subscriberId,
      'financial:created',
      record,
    );
  }

  emitEventCreated(
    subscriberId: string,
    event: unknown,
  ): void {
    this.emitToSubscriber(
      subscriberId,
      'event:created',
      event,
    );
  }

  emitBudgetCreated(
    subscriberId: string,
    budget: unknown,
  ): void {
    this.emitToSubscriber(
      subscriberId,
      'budget:created',
      budget,
    );
  }

  emitSubscriptionUpdated(
    subscriberId: string,
    subscription: unknown,
  ): void {
    this.emitToSubscriber(
      subscriberId,
      'subscription:updated',
      subscription,
    );
  }
}
