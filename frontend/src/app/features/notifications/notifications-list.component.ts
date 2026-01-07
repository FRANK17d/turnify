import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationsService, Notification, NotificationType } from '../../core/services/notifications.service';
import { WebsocketService, WS_EVENTS } from '../../core/services/websocket.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  // ... (selector y template iguales)
  selector: 'app-notifications-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Notificaciones</h1>
          <p class="page-subtitle">Historial de notificaciones del sistema</p>
        </div>
        <div class="header-actions">
          @if (hasUnread()) {
            <button class="btn btn-outline" (click)="markAllAsRead()">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Marcar todas como leídas
            </button>
          }
        </div>
      </header>

      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando notificaciones...</p>
        </div>
      } @else if (notifications().length === 0) {
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <h3>No hay notificaciones</h3>
          <p>Te notificaremos cuando haya actividad importante</p>
        </div>
      } @else {
        <div class="notifications-container">
          @for (notification of notifications(); track notification.id) {
            <div
              class="notification-item"
              [class.unread]="!notification.isRead"
              (click)="markAsRead(notification)"
            >
              <div class="notification-icon" [class]="getIconClass(notification.type)">
                @switch (notification.type) {
                  @case (NotificationType.BOOKING_CREATED) {
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  }
                  @case (NotificationType.BOOKING_CONFIRMED) {
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  }
                  @case (NotificationType.BOOKING_CANCELED) {
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                  }
                  @case (NotificationType.SUBSCRIPTION_UPDATED) {
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                      <line x1="2" y1="10" x2="22" y2="10"></line>
                    </svg>
                  }
                  @default {
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  }
                }
              </div>

              <div class="notification-content">
                <div class="notification-header">
                  <h3 class="notification-title">{{ notification.title }}</h3>
                  <span class="notification-time">{{ getTimeAgo(notification.createdAt) }}</span>
                </div>
                <p class="notification-message">{{ notification.message }}</p>
                @if (!notification.isRead) {
                  <span class="unread-badge">Nueva</span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .notifications-page {
      max-width: 800px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    
    /* ... (resto de estilos se heredan bien del reemplazo total si tuviera, pero aqui estoy reemplazando el bloque inicial para meter OnDestroy e imports) */
    
    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .page-subtitle {
      color: #6b7280;
      margin-top: 0.25rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-outline {
      background: white;
      border: 1px solid #e5e7eb;
      color: #374151;
    }

    .btn-outline:hover {
      background: #f9fafb;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .loading-state, .empty-state {
      background: white;
      border-radius: 0.75rem;
      padding: 4rem 2rem;
      text-align: center;
      color: #6b7280;
    }

    .empty-state svg {
      color: #d1d5db;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .notifications-container {
      background: white;
      border-radius: 0.75rem;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .notification-item {
      display: flex;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e5e7eb;
      cursor: pointer;
      transition: background 0.15s;
    }

    .notification-item:last-child {
      border-bottom: none;
    }

    .notification-item:hover {
      background: #f9fafb;
    }

    .notification-item.unread {
      background: #eff6ff;
    }

    .notification-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .notification-icon.BOOKING_CREATED {
      background: #dbeafe;
      color: #2563eb;
    }

    .notification-icon.BOOKING_CONFIRMED {
      background: #d1fae5;
      color: #059669;
    }

    .notification-icon.BOOKING_CANCELED {
      background: #fee2e2;
      color: #dc2626;
    }

    .notification-icon.SUBSCRIPTION_UPDATED {
      background: #f3e8ff;
      color: #7c3aed;
    }

    .notification-content {
      flex: 1;
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.25rem;
    }

    .notification-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .notification-time {
      font-size: 0.75rem;
      color: #9ca3af;
      white-space: nowrap;
    }

    .notification-message {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0 0 0.5rem 0;
    }

    .unread-badge {
      font-size: 0.625rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      background: #3b82f6;
      color: white;
    }
  `]
})
export class NotificationsListComponent implements OnInit, OnDestroy {
  private notificationsService = inject(NotificationsService);
  private toastService = inject(ToastService);
  private wsService = inject(WebsocketService);

  notifications = signal<Notification[]>([]);
  isLoading = signal(true);

  private subs: Subscription[] = [];
  private wsUnsubscribe?: () => void;

  // Exponer enum al template
  protected readonly NotificationType = NotificationType;

  ngOnInit(): void {
    this.loadNotifications();

    // Suscripción a eventos de lectura
    this.subs.push(
      this.notificationsService.notificationRead$.subscribe(id => {
        this.notifications.update(list =>
          list.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
      })
    );

    this.subs.push(
      this.notificationsService.allNotificationsRead$.subscribe(() => {
        this.notifications.update(list =>
          list.map(n => ({ ...n, isRead: true }))
        );
      })
    );

    // Suscripción a nuevas notificaciones en tiempo real via WebSocket
    this.wsUnsubscribe = this.wsService.on(WS_EVENTS.NOTIFICATION_NEW, (data) => {
      const newNotification: Notification = data.notification;
      // Agregar la nueva notificación al inicio de la lista
      this.notifications.update(list => [newNotification, ...list]);
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.wsUnsubscribe?.();
  }

  loadNotifications(): void {
    this.isLoading.set(true);
    this.notificationsService.findAll().subscribe({
      next: (response) => {
        this.notifications.set(response.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error', 'No se pudieron cargar las notificaciones');
        this.isLoading.set(false);
      },
    });
  }

  hasUnread(): boolean {
    return this.notifications().some(n => !n.isRead);
  }

  markAsRead(notification: Notification): void {
    if (notification.isRead) return;

    this.notificationsService.markAsRead(notification.id).subscribe({
      next: () => {
        const updated = this.notifications().map(n =>
          n.id === notification.id ? { ...n, isRead: true } : n
        );
        this.notifications.set(updated);
      },
      error: () => {
        this.toastService.error('Error', 'No se pudo marcar como leída');
      },
    });
  }

  markAllAsRead(): void {
    this.notificationsService.markAllAsRead().subscribe({
      next: () => {
        const updated = this.notifications().map(n => ({ ...n, isRead: true }));
        this.notifications.set(updated);
        this.toastService.success('Notificaciones leídas', 'Todas las notificaciones han sido marcadas como leídas');
      },
      error: () => {
        this.toastService.error('Error', 'No se pudieron marcar las notificaciones');
      },
    });
  }

  getIconClass(type: string): string {
    return type || 'default';
  }

  getTimeAgo(date: string): string {
    const now = new Date();
    const notifDate = new Date(date);
    const diff = now.getTime() - notifDate.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days}d`;
  }
}


