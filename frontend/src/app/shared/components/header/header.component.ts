import { Component, inject, OnInit, OnDestroy, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationsService, Notification } from '../../../core/services/notifications.service';
import { WebsocketService, WS_EVENTS } from '../../../core/services/websocket.service';
import { BrandingService } from '../../../core/services/branding.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="header">
      <div class="header-left">
        <button class="menu-toggle" (click)="toggleSidebar.emit()">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div class="brand">
          @if (branding().logo) {
            <img [src]="branding().logo" alt="Logo" class="brand-logo">
          }
          <span class="brand-name" [style.color]="branding().primaryColor">
            {{ branding().name }}
          </span>
        </div>
      </div>

      <div class="header-right">
        <!-- WebSocket Status -->
        <div class="ws-status" [class.connected]="wsService.isConnected()">
          <span class="ws-dot"></span>
        </div>

        <!-- Notifications -->
        <div class="notifications-wrapper">
          <button class="icon-btn" (click)="toggleNotifications()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            @if (unreadCount() > 0) {
              <span class="badge">{{ unreadCount() > 99 ? '99+' : unreadCount() }}</span>
            }
          </button>

          @if (showNotifications()) {
            <div class="notifications-dropdown">
              <div class="notifications-header">
                <h4>Notificaciones</h4>
                @if (unreadCount() > 0) {
                  <button class="mark-all-btn" (click)="markAllAsRead()">
                    Marcar todas como leídas
                  </button>
                }
              </div>
              <div class="notifications-list">
                @if (notifications().length === 0) {
                  <div class="empty-state">
                    <span>No hay notificaciones</span>
                  </div>
                } @else {
                  @for (notification of notifications(); track notification.id) {
                    <div
                      class="notification-item"
                      [class.unread]="!notification.isRead"
                      (click)="onNotificationClick(notification)"
                    >
                      <div class="notification-icon" [class]="'type-' + notification.type.toLowerCase()">
                        {{ getNotificationIcon(notification.type) }}
                      </div>
                      <div class="notification-content">
                        <div class="notification-title">{{ notification.title }}</div>
                        <div class="notification-message">{{ notification.message }}</div>
                        <div class="notification-time">{{ getTimeAgo(notification.createdAt) }}</div>
                      </div>
                    </div>
                  }
                }
              </div>
              @if (notifications().length > 0) {
                <div class="notifications-footer">
                  <a routerLink="/notifications">Ver todas</a>
                </div>
              }
            </div>
          }
        </div>

        <!-- User Menu -->
        <div class="user-menu-wrapper">
          <button class="user-btn" (click)="toggleUserMenu()">
            <div class="user-avatar">
              {{ userInitials() }}
            </div>
            <span class="user-name">{{ userName() }}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          @if (showUserMenu()) {
            <div class="user-dropdown">
              <a routerLink="/profile" class="dropdown-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Mi Perfil
              </a>
              @if (isAdmin()) {
                <a routerLink="/settings" class="dropdown-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  Configuración
                </a>
              }
              <div class="dropdown-divider"></div>
              <button class="dropdown-item logout" (click)="logout()">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Cerrar Sesión
              </button>
            </div>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      height: 64px;
      background: white;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .menu-toggle {
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: #6b7280;
      display: none;
    }

    @media (max-width: 768px) {
      .menu-toggle {
        display: block;
      }
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-logo {
      height: 32px;
    }

    .brand-name {
      font-size: 1.25rem;
      font-weight: 700;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .ws-status {
      padding: 0.5rem;
    }

    .ws-dot {
      display: block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ef4444;
    }

    .ws-status.connected .ws-dot {
      background: #10b981;
    }

    .icon-btn {
      position: relative;
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: #6b7280;
      border-radius: 0.5rem;
      transition: all 0.15s;
    }

    .icon-btn:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .badge {
      position: absolute;
      top: 0;
      right: 0;
      background: #ef4444;
      color: white;
      font-size: 0.625rem;
      font-weight: 600;
      padding: 0.125rem 0.375rem;
      border-radius: 9999px;
      min-width: 18px;
      text-align: center;
    }

    .notifications-wrapper, .user-menu-wrapper {
      position: relative;
    }

    .notifications-dropdown {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      width: 360px;
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      animation: slideDown 0.2s ease-out;
    }

    .notifications-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .notifications-header h4 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .mark-all-btn {
      background: none;
      border: none;
      color: #3b82f6;
      font-size: 0.75rem;
      cursor: pointer;
    }

    .notifications-list {
      max-height: 320px;
      overflow-y: auto;
    }

    .empty-state {
      padding: 2rem;
      text-align: center;
      color: #9ca3af;
    }

    .notification-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      cursor: pointer;
      transition: background 0.15s;
    }

    .notification-item:hover {
      background: #f9fafb;
    }

    .notification-item.unread {
      background: #eff6ff;
    }

    .notification-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    .notification-icon.type-booking_confirmed { background: #d1fae5; }
    .notification-icon.type-booking_cancelled { background: #fee2e2; }
    .notification-icon.type-booking_reminder { background: #fef3c7; }
    .notification-icon.type-subscription_expiring { background: #fef3c7; }
    .notification-icon.type-subscription_expired { background: #fee2e2; }
    .notification-icon.type-payment_failed { background: #fee2e2; }
    .notification-icon.type-system { background: #e0e7ff; }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-title {
      font-size: 0.875rem;
      font-weight: 500;
      color: #111827;
    }

    .notification-message {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.125rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .notification-time {
      font-size: 0.625rem;
      color: #9ca3af;
      margin-top: 0.25rem;
    }

    .notifications-footer {
      padding: 0.75rem;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }

    .notifications-footer a {
      color: #3b82f6;
      font-size: 0.875rem;
      text-decoration: none;
    }

    .user-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      padding: 0.375rem 0.75rem;
      cursor: pointer;
      border-radius: 0.5rem;
      transition: background 0.15s;
    }

    .user-btn:hover {
      background: #f3f4f6;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-color-dark));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .user-name {
      font-size: 0.875rem;
      color: #374151;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    @media (max-width: 640px) {
      .user-name {
        display: none;
      }
    }

    .user-dropdown {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      width: 200px;
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      padding: 0.5rem;
      animation: slideDown 0.2s ease-out;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.75rem;
      border-radius: 0.5rem;
      color: #374151;
      text-decoration: none;
      font-size: 0.875rem;
      background: none;
      border: none;
      width: 100%;
      cursor: pointer;
      transition: background 0.15s;
    }

    .dropdown-item:hover {
      background: #f3f4f6;
    }

    .dropdown-item.logout {
      color: #dc2626;
    }

    .dropdown-divider {
      height: 1px;
      background: #e5e7eb;
      margin: 0.5rem 0;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class HeaderComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private notificationsService = inject(NotificationsService);
  private brandingService = inject(BrandingService);
  private router = inject(Router);
  wsService = inject(WebsocketService);

  branding = this.brandingService.branding;
  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);
  showNotifications = signal(false);
  showUserMenu = signal(false);

  toggleSidebar = output<void>(); // Output signal

  // Convertir observable a signal para reactividad
  private currentUser = toSignal(this.authService.currentUser$);

  userName = computed(() => {
    const user = this.currentUser();
    if (user?.firstName) {
      return `${user.firstName} ${user.lastName || ''}`.trim();
    }
    return user?.email || 'Usuario';
  });

  userInitials = computed(() => {
    const user = this.currentUser();
    if (user?.firstName) {
      return `${user.firstName[0]}${user.lastName?.[0] || ''}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  });

  isAdmin = computed(() => {
    const user = this.currentUser();
    return user?.roles?.includes('ADMIN_EMPRESA') || user?.roles?.includes('SUPER_ADMIN');
  });

  private wsUnsubscribe?: () => void;

  ngOnInit(): void {
    this.loadNotifications();
    this.setupWebSocket();

    // Cerrar dropdowns al hacer clic fuera
    document.addEventListener('click', this.closeDropdowns.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.closeDropdowns.bind(this));
    this.wsUnsubscribe?.();
  }

  private loadNotifications(): void {
    this.notificationsService.findAll(10).subscribe({
      next: (response) => this.notifications.set(response.data),
      error: (err) => console.error('Error loading notifications:', err),
    });

    this.notificationsService.countUnread().subscribe({
      next: (response) => this.unreadCount.set(response.count),
      error: (err) => console.error('Error counting notifications:', err),
    });

    // Suscribirse a eventos de sincronización
    const sub1 = this.notificationsService.notificationRead$.subscribe(id => {
      this.notifications.update(list => list.map(n => n.id === id ? { ...n, isRead: true } : n));
      // Recalcular unread count localmente si estaba en la lista y no leído
      // Ojo: countUnread es global. Mejor decrementarlo si sabemos que lo afectó.
      // Pero si llegó por evento externo, asumimos que debemos decrementar
      // Una estrategia segura es decrementar si encontramos la notif no leída en nuestra lista, 
      // O simplemente decrementar siempre (con min 0) si confiamos en que era unread.
      this.unreadCount.update(c => Math.max(0, c - 1));
    });

    const sub2 = this.notificationsService.allNotificationsRead$.subscribe(() => {
      this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
      this.unreadCount.set(0);
    });

    // Guardar suscripciones para limpiar después (usando una técnica ad-hoc ya que no tenemos array de subs definido)
    // Lo ideal es agregarlo al wsUnsubscribe o crear un array.
    // Voy a hackearlo agregandolo a una función de limpieza combinada
    const oldUnsub = this.wsUnsubscribe;
    this.wsUnsubscribe = () => {
      sub1.unsubscribe();
      sub2.unsubscribe();
      if (oldUnsub) oldUnsub();
    };
  }

  private setupWebSocket(): void {
    const token = localStorage.getItem('accessToken');
    if (token) {
      this.wsService.connect(token);

      this.wsUnsubscribe = this.wsService.on(WS_EVENTS.NOTIFICATION_NEW, (data) => {
        this.notifications.update(notifications => [data.notification, ...notifications.slice(0, 9)]);
        this.unreadCount.update(count => count + 1);
      });
    }
  }

  toggleNotifications(): void {
    this.showNotifications.update(v => !v);
    this.showUserMenu.set(false);
  }

  toggleUserMenu(): void {
    this.showUserMenu.update(v => !v);
    this.showNotifications.set(false);
  }

  private closeDropdowns(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notifications-wrapper')) {
      this.showNotifications.set(false);
    }
    if (!target.closest('.user-menu-wrapper')) {
      this.showUserMenu.set(false);
    }
  }

  onNotificationClick(notification: Notification): void {
    if (!notification.isRead) {
      this.notificationsService.markAsRead(notification.id).subscribe({
        next: () => {
          this.notifications.update(notifications =>
            notifications.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
          );
          this.unreadCount.update(count => Math.max(0, count - 1));
        },
      });
    }

    // Navegar según el tipo de notificación
    if (notification.metadata?.['bookingId']) {
      this.router.navigate(['/bookings', notification.metadata['bookingId']]);
    }

    this.showNotifications.set(false);
  }

  markAllAsRead(): void {
    this.notificationsService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update(notifications =>
          notifications.map(n => ({ ...n, isRead: true }))
        );
        this.unreadCount.set(0);
      },
    });
  }

  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      BOOKING_CONFIRMED: '✓',
      BOOKING_CANCELLED: '✕',
      BOOKING_REMINDER: '🔔',
      SUBSCRIPTION_EXPIRING: '⚠',
      SUBSCRIPTION_EXPIRED: '🚫',
      PAYMENT_FAILED: '💳',
      SYSTEM: 'ℹ',
    };
    return icons[type] || 'ℹ';
  }

  getTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Hace un momento';
    if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} h`;
    if (seconds < 604800) return `Hace ${Math.floor(seconds / 86400)} d`;
    return date.toLocaleDateString('es-ES');
  }

  logout(): void {
    this.wsService.disconnect();
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
