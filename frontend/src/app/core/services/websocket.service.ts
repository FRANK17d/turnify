import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

export interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: string;
}

export const WS_EVENTS = {
  BOOKING_CREATED: 'booking.created',
  BOOKING_UPDATED: 'booking.updated',
  BOOKING_CANCELLED: 'booking.cancelled',
  SUBSCRIPTION_EXPIRING: 'subscription.expiring',
  SUBSCRIPTION_EXPIRED: 'subscription.expired',
  SUBSCRIPTION_UPDATED: 'subscription.updated',
  NOTIFICATION_NEW: 'notification.new',
  NOTIFICATION_READ: 'notification.read',
  USER_CONNECTED: 'user.connected',
  USER_DISCONNECTED: 'user.disconnected',
} as const;

@Injectable({
  providedIn: 'root'
})
export class WebsocketService implements OnDestroy {
  private socket: Socket | null = null;

  private connectedSignal = signal(false);
  private lastEventSignal = signal<WebSocketEvent | null>(null);

  isConnected = computed(() => this.connectedSignal());
  lastEvent = computed(() => this.lastEventSignal());

  // Callbacks para eventos específicos
  private eventCallbacks = new Map<string, Set<(data: any) => void>>();

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    const wsUrl = environment.apiUrl.replace('/api', '');

    this.socket = io(`${wsUrl}/ws`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupListeners();
  }

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
      this.connectedSignal.set(true);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('WebSocket disconnected:', reason);
      this.connectedSignal.set(false);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error);
      this.connectedSignal.set(false);
    });

    // Escuchar todos los eventos definidos
    Object.values(WS_EVENTS).forEach(eventName => {
      this.socket?.on(eventName, (data) => {
        const event: WebSocketEvent = {
          type: eventName,
          data,
          timestamp: new Date().toISOString(),
        };

        this.lastEventSignal.set(event);
        this.notifyCallbacks(eventName, data);
      });
    });
  }

  // Suscribirse a un evento específico
  on(eventName: string, callback: (data: any) => void): () => void {
    if (!this.eventCallbacks.has(eventName)) {
      this.eventCallbacks.set(eventName, new Set());
    }

    this.eventCallbacks.get(eventName)!.add(callback);

    // Retornar función para desuscribirse
    return () => {
      this.eventCallbacks.get(eventName)?.delete(callback);
    };
  }

  // Suscribirse a múltiples eventos
  onMany(events: string[], callback: (event: WebSocketEvent) => void): () => void {
    const unsubscribers = events.map(eventName =>
      this.on(eventName, (data) => callback({
        type: eventName,
        data,
        timestamp: new Date().toISOString(),
      }))
    );

    return () => unsubscribers.forEach(unsub => unsub());
  }

  private notifyCallbacks(eventName: string, data: any): void {
    this.eventCallbacks.get(eventName)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in WebSocket callback for ${eventName}:`, error);
      }
    });
  }

  // Emitir evento al servidor
  emit(eventName: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(eventName, data);
    } else {
      console.warn('WebSocket not connected, cannot emit:', eventName);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectedSignal.set(false);
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.eventCallbacks.clear();
  }
}
