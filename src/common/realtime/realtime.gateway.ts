import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';

@WebSocketGateway()
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private clients: Set<WebSocket> = new Set();

  handleConnection(client: WebSocket) {
    this.clients.add(client);
    console.log('[WS] Client connected. Total clients:', this.clients.size);
    client.send(
      JSON.stringify({
        event: 'welcome',
        payload: 'Connected to Realtime Gateway',
      }),
    );
  }

  handleDisconnect(client: WebSocket) {
    this.clients.delete(client);
    console.log('[WS] Client disconnected. Total clients:', this.clients.size);
  }

  broadcast(event: string, payload: any) {
    const data = JSON.stringify({ event, payload });
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(data);
        } catch (e) {
          console.error('[WS] Failed to send message to client:', e);
        }
      }
    });
  }
}
