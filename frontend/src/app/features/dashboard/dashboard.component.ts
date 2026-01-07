import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookingsService, Booking } from '../../core/services/bookings.service';
import { ServicesService, Service } from '../../core/services/services.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { WebsocketService, WS_EVENTS } from '../../core/services/websocket.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';

interface DashboardStats {
  totalBookings: number;
  todayBookings: number;
  pendingBookings: number;
  totalRevenue: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <header class="dashboard-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Bienvenido de vuelta, {{ userName() }}</p>
        </div>
        @if (!hasPermission('MANAGE_BOOKINGS')) {
          <a routerLink="/bookings/new" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nueva Reserva
          </a>
        }
      </header>

      <!-- Stats Cards -->
      <div class="stats-grid" [class.client-view]="!hasPermission('MANAGE_BOOKINGS')">
        <div class="stat-card">
          <div class="stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().totalBookings }}</span>
            <span class="stat-label">{{ hasPermission('MANAGE_BOOKINGS') ? 'Total Reservas' : 'Mis Reservas' }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().todayBookings }}</span>
            <span class="stat-label">Reservas Hoy</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon yellow">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().pendingBookings }}</span>
            <span class="stat-label">Pendientes</span>
          </div>
        </div>

        @if (hasPermission('MANAGE_BOOKINGS')) {
          <div class="stat-card">
            <div class="stat-icon purple">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats().totalRevenue | currency:'USD':'symbol':'1.0-0' }}</span>
              <span class="stat-label">Ingresos Totales</span>
            </div>
          </div>
        }
      </div>

      <div class="dashboard-grid">
        <!-- Próximas Reservas -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Próximas Reservas</h2>
            <a routerLink="/bookings" class="card-link">Ver todas</a>
          </div>
          <div class="card-body">
            @if (isLoadingBookings()) {
              <div class="loading-state">
                <div class="spinner"></div>
              </div>
            } @else if (upcomingBookings().length === 0) {
              <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <p>No hay reservas próximas</p>
                <a routerLink="/bookings/new" class="btn btn-outline">Crear reserva</a>
              </div>
            } @else {
              <ul class="booking-list">
                @for (booking of upcomingBookings(); track booking.id) {
                  <li class="booking-item">
                    <div class="booking-info">
                      <span class="booking-service">{{ booking.service?.name || 'Servicio' }}</span>
                      <span class="booking-time">
                        {{ booking.startTime | date:'EEEE, d MMM':'':'es' }} -
                        {{ booking.startTime | date:'HH:mm' }}
                      </span>
                    </div>
                    <span class="booking-status" [class]="'status-' + booking.status.toLowerCase()">
                      {{ getStatusLabel(booking.status) }}
                    </span>
                  </li>
                }
              </ul>
            }
          </div>
        </div>

        <!-- Servicios Populares -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Servicios</h2>
            <a routerLink="/services" class="card-link">Ver todos</a>
          </div>
          <div class="card-body">
            @if (isLoadingServices()) {
              <div class="loading-state">
                <div class="spinner"></div>
              </div>
            } @else if (services().length === 0) {
              <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                  <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
                <p>No hay servicios configurados</p>
                @if (hasPermission('MANAGE_SERVICES')) {
                  <a routerLink="/services/new" class="btn btn-outline">Crear servicio</a>
                }
              </div>
            } @else {
              <ul class="service-list">
                @for (service of services().slice(0, 4); track service.id) {
                  <li class="service-item">
                    <div class="service-info">
                      <span class="service-name">{{ service.name }}</span>
                      <span class="service-duration">{{ service.duration }} min</span>
                    </div>
                    <span class="service-price">{{ +service.price | currency:'USD' }}</span>
                  </li>
                }
              </ul>
            }
          </div>
        </div>
      </div>

      <!-- Actividad Reciente -->
      <div class="card activity-card">
        <div class="card-header">
          <h2 class="card-title">Actividad Reciente</h2>
        </div>
        <div class="card-body">
          @if (recentActivity().length === 0) {
            <div class="empty-state">
              <p>No hay actividad reciente</p>
            </div>
          } @else {
            <ul class="activity-list">
              @for (activity of recentActivity(); track activity.id) {
                <li class="activity-item">
                  <div class="activity-icon" [class]="'type-' + activity.type">
                    {{ getActivityIcon(activity.type) }}
                  </div>
                  <div class="activity-content">
                    <span class="activity-message">{{ activity.message }}</span>
                    <span class="activity-time">{{ getTimeAgo(activity.createdAt) }}</span>
                  </div>
                </li>
              }
            </ul>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1200px;
      margin: 0 auto;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    @media (max-width: 640px) {
      .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
    }

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
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s;
      border: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
    }

    .btn-primary:hover {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
    }

    .btn-outline {
      background: white;
      border: 1px solid #e5e7eb;
      color: #374151;
    }

    .btn-outline:hover {
      background: #f9fafb;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stats-grid.client-view {
      grid-template-columns: repeat(3, 1fr);
    }

    @media (max-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }

    .stat-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon.blue { background: #dbeafe; color: #3b82f6; }
    .stat-icon.green { background: #d1fae5; color: #10b981; }
    .stat-icon.yellow { background: #fef3c7; color: #f59e0b; }
    .stat-icon.purple { background: #ede9fe; color: #8b5cf6; }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    @media (max-width: 768px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }

    .card {
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .card-title {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .card-link {
      font-size: 0.875rem;
      color: #3b82f6;
      text-decoration: none;
    }

    .card-link:hover {
      text-decoration: underline;
    }

    .card-body {
      padding: 1rem 1.25rem;
    }

    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: #9ca3af;
      text-align: center;
      gap: 0.75rem;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .booking-list, .service-list, .activity-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .booking-item, .service-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f3f4f6;
    }

    .booking-item:last-child, .service-item:last-child {
      border-bottom: none;
    }

    .booking-info, .service-info {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .booking-service, .service-name {
      font-weight: 500;
      color: #111827;
    }

    .booking-time, .service-duration {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .booking-status {
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
    }

    .status-pending { background: #fef3c7; color: #d97706; }
    .status-confirmed { background: #d1fae5; color: #059669; }
    .status-cancelled { background: #fee2e2; color: #dc2626; }
    .status-completed { background: #e0e7ff; color: #4f46e5; }

    .service-price {
      font-weight: 600;
      color: #111827;
    }

    .activity-card {
      margin-top: 0;
    }

    .activity-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f3f4f6;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    .activity-icon.type-booking { background: #dbeafe; }
    .activity-icon.type-payment { background: #d1fae5; }
    .activity-icon.type-user { background: #ede9fe; }

    .activity-content {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .activity-message {
      font-size: 0.875rem;
      color: #374151;
    }

    .activity-time {
      font-size: 0.75rem;
      color: #9ca3af;
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private bookingsService = inject(BookingsService);
  private servicesService = inject(ServicesService);
  private notificationsService = inject(NotificationsService);
  private wsService = inject(WebsocketService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  stats = signal<DashboardStats>({
    totalBookings: 0,
    todayBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0,
  });

  upcomingBookings = signal<Booking[]>([]);
  services = signal<Service[]>([]);
  recentActivity = signal<any[]>([]);
  isLoadingBookings = signal(true);
  isLoadingServices = signal(true);

  userName = computed(() => {
    const user = this.authService.currentUser;
    return user?.firstName || 'Usuario';
  });

  private wsUnsubscribes: (() => void)[] = [];

  ngOnInit(): void {
    this.loadData();
    this.setupWebSocket();
  }

  ngOnDestroy(): void {
    this.wsUnsubscribes.forEach(unsub => unsub());
  }

  private loadData(): void {
    // Cargar reservas próximas
    this.bookingsService.findAll().subscribe({
      next: (bookings) => {
        const limited = bookings.slice(0, 4);
        this.upcomingBookings.set(limited);
        this.calculateStats(bookings);
        this.isLoadingBookings.set(false);
      },
      error: () => {
        this.isLoadingBookings.set(false);
      },
    });

    // Cargar servicios
    this.servicesService.findAll().subscribe({
      next: (services) => {
        this.services.set(services);
        this.isLoadingServices.set(false);
      },
      error: () => {
        this.isLoadingServices.set(false);
      },
    });

    // Cargar actividad reciente (notificaciones)
    this.notificationsService.findAll(4).subscribe({
      next: (response) => {
        this.recentActivity.set(response.data.map((n: any) => ({
          id: n.id,
          type: this.getActivityType(n.type),
          message: n.message,
          createdAt: n.createdAt,
        })));
      },
    });
  }

  private calculateStats(bookings: Booking[]): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBookings = bookings.filter(b => {
      const bookingDate = new Date(b.startTime);
      return bookingDate >= today && bookingDate < tomorrow;
    }).length;

    const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;

    // Calcular ingresos (simplificado)
    const totalRevenue = bookings
      .filter(b => b.status === 'COMPLETED' || b.status === 'CONFIRMED')
      .reduce((sum, b) => {
        const price = b.service?.price ? Number(b.service.price) : 0;
        return sum + price;
      }, 0);

    this.stats.set({
      totalBookings: bookings.length,
      todayBookings,
      pendingBookings,
      totalRevenue,
    });
  }

  private setupWebSocket(): void {
    // Escuchar nuevas reservas
    const unsub1 = this.wsService.on(WS_EVENTS.BOOKING_CREATED, (data) => {
      this.toastService.info('Nueva Reserva', 'Se ha creado una nueva reserva');
      this.loadData();
    });
    this.wsUnsubscribes.push(unsub1);

    // Escuchar actualizaciones de reservas
    const unsub2 = this.wsService.on(WS_EVENTS.BOOKING_UPDATED, (data) => {
      this.loadData();
    });
    this.wsUnsubscribes.push(unsub2);
  }

  private getActivityType(notificationType: string): string {
    if (notificationType.includes('BOOKING')) return 'booking';
    if (notificationType.includes('PAYMENT') || notificationType.includes('SUBSCRIPTION')) return 'payment';
    return 'user';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmada',
      CANCELLED: 'Cancelada',
      COMPLETED: 'Completada',
    };
    return labels[status] || status;
  }

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      booking: '📅',
      payment: '💰',
      user: '👤',
    };
    return icons[type] || '📌';
  }

  hasPermission(permission: string): boolean {
    return this.authService.currentUser?.permissions?.includes(permission) ?? false;
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
}
