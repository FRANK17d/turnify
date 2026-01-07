import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../shared/services/toast.service';
import { WebsocketService, WS_EVENTS } from '../../core/services/websocket.service';

interface ReportData {
  bookings: {
    total: number;
    byStatus: {
      pending: number;
      confirmed: number;
      completed: number;
      cancelled: number;
    };
    revenue: number;
  };
  trend: { date: string; count: number }[];
  revenue: {
    currentMonth: number;
    lastMonth: number;
    growth: number;
    byService: { name: string; revenue: number; count: number }[];
  };
  popularServices: {
    serviceId: string;
    serviceName: string;
    bookingCount: number;
    completedCount: number;
    completionRate: number;
  }[];
  userActivity: {
    topClients: { userId: string; name: string; email: string; bookingCount: number }[];
    newUsers: number;
    totalUsers: number;
  };
  timeAnalysis: {
    peakHours: { hour: number; count: number }[];
    busiestDays: { day: string; dayIndex: number; count: number }[];
  };
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reports-container">
      <header class="page-header">
        <div>
          <h1 class="page-title">Reportes</h1>
          <p class="page-subtitle">Análisis de rendimiento de tu negocio (últimos 15 días) <span class="live-badge">● En vivo</span></p>
        </div>
        <button class="btn btn-outline" (click)="loadReports()">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          Actualizar
        </button>
      </header>

      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando reportes...</p>
        </div>
      } @else if (data()) {
        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card blue">
            <div class="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ data()!.bookings.total }}</span>
              <span class="stat-label">Total Reservas</span>
            </div>
          </div>

          <div class="stat-card green">
            <div class="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ data()!.revenue.currentMonth | currency:'USD':'symbol':'1.0-0' }}</span>
              <span class="stat-label">Ingresos del Mes</span>
            </div>
          </div>

          <div class="stat-card purple">
            <div class="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ data()!.userActivity.totalUsers }}</span>
              <span class="stat-label">Total Usuarios</span>
            </div>
          </div>

          <div class="stat-card" [class.positive]="data()!.revenue.growth > 0" [class.negative]="data()!.revenue.growth < 0">
            <div class="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ data()!.revenue.growth > 0 ? '+' : '' }}{{ data()!.revenue.growth | number:'1.1-1' }}%</span>
              <span class="stat-label">Crecimiento</span>
            </div>
          </div>
        </div>

        <!-- Main Grid -->
        <div class="main-grid">
          <!-- Reservas por Estado -->
          <div class="card">
            <div class="card-header">
              <h3>Reservas por Estado</h3>
            </div>
            <div class="card-body">
              <div class="status-bars">
                <div class="status-item">
                  <div class="status-info">
                    <span class="status-label">Pendientes</span>
                    <span class="status-value">{{ data()!.bookings.byStatus.pending }}</span>
                  </div>
                  <div class="status-bar">
                    <div class="status-fill pending" [style.width.%]="getPercentage(data()!.bookings.byStatus.pending)"></div>
                  </div>
                </div>
                <div class="status-item">
                  <div class="status-info">
                    <span class="status-label">Confirmadas</span>
                    <span class="status-value">{{ data()!.bookings.byStatus.confirmed }}</span>
                  </div>
                  <div class="status-bar">
                    <div class="status-fill confirmed" [style.width.%]="getPercentage(data()!.bookings.byStatus.confirmed)"></div>
                  </div>
                </div>
                <div class="status-item">
                  <div class="status-info">
                    <span class="status-label">Completadas</span>
                    <span class="status-value">{{ data()!.bookings.byStatus.completed }}</span>
                  </div>
                  <div class="status-bar">
                    <div class="status-fill completed" [style.width.%]="getPercentage(data()!.bookings.byStatus.completed)"></div>
                  </div>
                </div>
                <div class="status-item">
                  <div class="status-info">
                    <span class="status-label">Canceladas</span>
                    <span class="status-value">{{ data()!.bookings.byStatus.cancelled }}</span>
                  </div>
                  <div class="status-bar">
                    <div class="status-fill cancelled" [style.width.%]="getPercentage(data()!.bookings.byStatus.cancelled)"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Ingresos por Servicio -->
          <div class="card">
            <div class="card-header">
              <h3>Ingresos por Servicio</h3>
            </div>
            <div class="card-body">
              @if (data()!.revenue.byService.length === 0) {
                <div class="empty-mini">Sin datos</div>
              } @else {
                <div class="service-revenue-list">
                  @for (service of data()!.revenue.byService.slice(0, 5); track service.name) {
                    <div class="service-revenue-item">
                      <div class="service-info">
                        <span class="service-name">{{ service.name }}</span>
                        <span class="service-count">{{ service.count }} reservas</span>
                      </div>
                      <span class="service-revenue">{{ service.revenue | currency:'USD':'symbol':'1.0-0' }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Servicios Populares -->
          <div class="card">
            <div class="card-header">
              <h3>Servicios Populares</h3>
            </div>
            <div class="card-body">
              @if (data()!.popularServices.length === 0) {
                <div class="empty-mini">Sin datos</div>
              } @else {
                <div class="popular-list">
                  @for (service of data()!.popularServices; track service.serviceId; let i = $index) {
                    <div class="popular-item">
                      <div class="popular-rank">{{ i + 1 }}</div>
                      <div class="popular-info">
                        <span class="popular-name">{{ service.serviceName }}</span>
                        <span class="popular-stats">{{ service.bookingCount }} reservas · {{ service.completionRate | number:'1.0-0' }}% completadas</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Clientes Frecuentes -->
          <div class="card">
            <div class="card-header">
              <h3>Clientes Frecuentes</h3>
              <span class="badge">+{{ data()!.userActivity.newUsers }} nuevos</span>
            </div>
            <div class="card-body">
              @if (data()!.userActivity.topClients.length === 0) {
                <div class="empty-mini">Sin datos</div>
              } @else {
                <div class="clients-list">
                  @for (client of data()!.userActivity.topClients; track client.userId) {
                    <div class="client-item">
                      <div class="client-avatar">
                        {{ getInitials(client.name) }}
                      </div>
                      <div class="client-info">
                        <span class="client-name">{{ client.name }}</span>
                        <span class="client-email">{{ client.email }}</span>
                      </div>
                      <span class="client-count">{{ client.bookingCount }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Horarios Pico -->
          <div class="card">
            <div class="card-header">
              <h3>Horarios Más Demandados</h3>
            </div>
            <div class="card-body">
              @if (data()!.timeAnalysis.peakHours.length === 0) {
                <div class="empty-mini">Sin datos</div>
              } @else {
                <div class="peak-hours">
                  @for (hour of data()!.timeAnalysis.peakHours; track hour.hour) {
                    <div class="peak-item">
                      <span class="peak-time">{{ formatHour(hour.hour) }}</span>
                      <div class="peak-bar">
                        <div class="peak-fill" [style.width.%]="getHourPercentage(hour.count)"></div>
                      </div>
                      <span class="peak-count">{{ hour.count }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Días Más Activos -->
          <div class="card">
            <div class="card-header">
              <h3>Días Más Activos</h3>
            </div>
            <div class="card-body">
              @if (data()!.timeAnalysis.busiestDays.length === 0) {
                <div class="empty-mini">Sin datos</div>
              } @else {
                <div class="days-chart">
                  @for (day of data()!.timeAnalysis.busiestDays; track day.dayIndex) {
                    <div class="day-bar-container">
                      <div class="day-bar" [style.height.%]="getDayPercentage(day.count)"></div>
                      <span class="day-label">{{ day.day.substring(0, 3) }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Tendencia de Reservas -->
        <div class="card trend-card">
          <div class="card-header">
            <h3>Tendencia de Reservas (Últimos 15 días)</h3>
          </div>
          <div class="card-body">
            <div class="trend-chart">
              @for (point of data()!.trend; track point.date; let i = $index) {
                <div 
                  class="trend-bar" 
                  [style.height.%]="getTrendPercentage(point.count)"
                  [title]="point.date + ': ' + point.count + ' reservas'"
                ></div>
              }
            </div>
            <div class="trend-labels">
              <span>{{ data()!.trend[0]?.date | date:'d MMM' }}</span>
              <span>{{ data()!.trend[data()!.trend.length - 1]?.date | date:'d MMM' }}</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .reports-container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
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
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .live-badge {
      font-size: 0.625rem;
      font-weight: 600;
      color: #10b981;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
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
      border: none;
    }

    .btn-outline {
      background: white;
      border: 1px solid #e5e7eb;
      color: #374151;
    }

    .btn-outline:hover {
      background: #f9fafb;
    }

    .loading-state {
      background: white;
      border-radius: 0.75rem;
      padding: 4rem 2rem;
      text-align: center;
      color: #6b7280;
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

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    @media (max-width: 1024px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: 1fr; }
    }

    .stat-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-card.blue .stat-icon { background: #dbeafe; color: #3b82f6; }
    .stat-card.green .stat-icon { background: #d1fae5; color: #10b981; }
    .stat-card.purple .stat-icon { background: #ede9fe; color: #8b5cf6; }
    .stat-card.positive .stat-icon { background: #d1fae5; color: #10b981; }
    .stat-card.negative .stat-icon { background: #fee2e2; color: #ef4444; }

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

    /* Main Grid */
    .main-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    @media (max-width: 1024px) {
      .main-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 640px) {
      .main-grid { grid-template-columns: 1fr; }
    }

    .card {
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .card-header h3 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .badge {
      font-size: 0.625rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      background: #d1fae5;
      color: #059669;
    }

    .card-body {
      padding: 1rem 1.25rem;
    }

    .empty-mini {
      text-align: center;
      color: #9ca3af;
      padding: 1rem;
      font-size: 0.875rem;
    }

    /* Status Bars */
    .status-bars {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .status-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .status-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
    }

    .status-label { color: #6b7280; }
    .status-value { font-weight: 600; color: #111827; }

    .status-bar {
      height: 8px;
      background: #f3f4f6;
      border-radius: 4px;
      overflow: hidden;
    }

    .status-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .status-fill.pending { background: #f59e0b; }
    .status-fill.confirmed { background: #3b82f6; }
    .status-fill.completed { background: #10b981; }
    .status-fill.cancelled { background: #ef4444; }

    /* Service Revenue */
    .service-revenue-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .service-revenue-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .service-info {
      display: flex;
      flex-direction: column;
    }

    .service-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #111827;
    }

    .service-count {
      font-size: 0.625rem;
      color: #9ca3af;
    }

    .service-revenue {
      font-size: 0.875rem;
      font-weight: 600;
      color: #10b981;
    }

    /* Popular Services */
    .popular-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .popular-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .popular-rank {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .popular-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .popular-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #111827;
    }

    .popular-stats {
      font-size: 0.625rem;
      color: #9ca3af;
    }

    /* Clients */
    .clients-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .client-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .client-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      font-size: 0.625rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .client-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .client-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #111827;
    }

    .client-email {
      font-size: 0.625rem;
      color: #9ca3af;
    }

    .client-count {
      font-size: 0.875rem;
      font-weight: 600;
      color: #3b82f6;
    }

    /* Peak Hours */
    .peak-hours {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .peak-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .peak-time {
      width: 50px;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .peak-bar {
      flex: 1;
      height: 8px;
      background: #f3f4f6;
      border-radius: 4px;
      overflow: hidden;
    }

    .peak-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      border-radius: 4px;
    }

    .peak-count {
      width: 30px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #111827;
      text-align: right;
    }

    /* Days Chart */
    .days-chart {
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      height: 120px;
      padding-top: 1rem;
    }

    .day-bar-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
    }

    .day-bar {
      width: 24px;
      background: linear-gradient(180deg, #3b82f6, #8b5cf6);
      border-radius: 4px 4px 0 0;
      min-height: 4px;
      transition: height 0.5s ease;
    }

    .day-label {
      font-size: 0.625rem;
      color: #6b7280;
    }

    /* Trend Chart */
    .trend-card {
      margin-bottom: 1.5rem;
    }

    .trend-chart {
      display: flex;
      align-items: flex-end;
      gap: 2px;
      height: 100px;
      padding: 0.5rem 0;
    }

    .trend-bar {
      flex: 1;
      background: linear-gradient(180deg, #3b82f6, #60a5fa);
      border-radius: 2px 2px 0 0;
      min-height: 2px;
      transition: height 0.3s ease;
      cursor: pointer;
    }

    .trend-bar:hover {
      background: linear-gradient(180deg, #2563eb, #3b82f6);
    }

    .trend-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.625rem;
      color: #9ca3af;
      margin-top: 0.5rem;
    }
  `]
})
export class ReportsComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);
  private wsService = inject(WebsocketService);

  data = signal<ReportData | null>(null);
  isLoading = signal(true);

  private maxBookings = 0;
  private maxHourCount = 0;
  private maxDayCount = 0;
  private maxTrendCount = 0;
  private wsUnsubscribe?: () => void;

  ngOnInit(): void {
    this.loadReports();
    this.setupWebSocket();
  }

  ngOnDestroy(): void {
    if (this.wsUnsubscribe) {
      this.wsUnsubscribe();
    }
  }

  private setupWebSocket(): void {
    const token = localStorage.getItem('accessToken');
    if (token) {
      this.wsService.connect(token);

      // Escuchar eventos de reservas para actualizar en tiempo real
      const unsub1 = this.wsService.on(WS_EVENTS.BOOKING_CREATED, () => {
        this.loadReports();
      });

      const unsub2 = this.wsService.on(WS_EVENTS.BOOKING_UPDATED, () => {
        this.loadReports();
      });

      const unsub3 = this.wsService.on(WS_EVENTS.BOOKING_CANCELLED, () => {
        this.loadReports();
      });

      this.wsUnsubscribe = () => {
        unsub1();
        unsub2();
        unsub3();
      };
    }
  }

  loadReports(): void {
    this.isLoading.set(true);
    this.apiService.get<ReportData>('/reports').subscribe({
      next: (data) => {
        this.data.set(data);
        this.calculateMaxValues(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.toastService.error('Error', error.error?.message || 'No se pudieron cargar los reportes');
        this.isLoading.set(false);
      },
    });
  }

  private calculateMaxValues(data: ReportData): void {
    const { bookings, timeAnalysis, trend } = data;
    this.maxBookings = Math.max(
      bookings.byStatus.pending,
      bookings.byStatus.confirmed,
      bookings.byStatus.completed,
      bookings.byStatus.cancelled,
      1
    );
    this.maxHourCount = Math.max(...timeAnalysis.peakHours.map(h => h.count), 1);
    this.maxDayCount = Math.max(...timeAnalysis.busiestDays.map(d => d.count), 1);
    this.maxTrendCount = Math.max(...trend.map(t => t.count), 1);
  }

  getPercentage(value: number): number {
    return (value / this.maxBookings) * 100;
  }

  getHourPercentage(count: number): number {
    return (count / this.maxHourCount) * 100;
  }

  getDayPercentage(count: number): number {
    return (count / this.maxDayCount) * 100;
  }

  getTrendPercentage(count: number): number {
    return (count / this.maxTrendCount) * 100;
  }

  formatHour(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    return `${h}:00 ${period}`;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'U';
  }
}
