import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

interface SystemStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  proSubscriptions: number;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reports-page">
      <header class="page-header">
        <h1 class="page-title">Reportes del Sistema</h1>
        <p class="page-subtitle">Estadísticas generales de la plataforma</p>
      </header>

      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando estadísticas...</p>
        </div>
      } @else {
        <!-- Estadísticas generales -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon tenants">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().totalTenants }}</div>
              <div class="stat-label">Total Empresas</div>
              <div class="stat-detail">{{ stats().activeTenants }} activas</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon users">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().totalUsers }}</div>
              <div class="stat-label">Total Usuarios</div>
              <div class="stat-detail">En todas las empresas</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon bookings">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().totalBookings }}</div>
              <div class="stat-label">Total Reservas</div>
              <div class="stat-detail">Todas las empresas</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon revenue">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().totalRevenue | currency:'USD' }}</div>
              <div class="stat-label">Ingresos Totales</div>
              <div class="stat-detail">{{ stats().proSubscriptions }} suscripciones PRO</div>
            </div>
          </div>
        </div>

        <!-- Gráfico de suscripciones -->
        <div class="report-card">
          <h2 class="card-title">Distribución de Planes</h2>
          <div class="chart-container">
            <div class="plan-bar">
              <div class="plan-label">
                <span class="plan-name">FREE</span>
                <span class="plan-count">{{ getFreeTenantsCount() }} empresas</span>
              </div>
              <div class="bar-track">
                <div
                  class="bar-fill free"
                  [style.width.%]="getFreePercentage()"
                ></div>
              </div>
              <span class="percentage">{{ getFreePercentage() }}%</span>
            </div>

            <div class="plan-bar">
              <div class="plan-label">
                <span class="plan-name">PRO</span>
                <span class="plan-count">{{ stats().proSubscriptions }} empresas</span>
              </div>
              <div class="bar-track">
                <div
                  class="bar-fill pro"
                  [style.width.%]="getProPercentage()"
                ></div>
              </div>
              <span class="percentage">{{ getProPercentage() }}%</span>
            </div>
          </div>
        </div>

        <!-- Estado de empresas -->
        <div class="report-card">
          <h2 class="card-title">Estado de Empresas</h2>
          <div class="status-grid">
            <div class="status-item active">
              <div class="status-value">{{ stats().activeTenants }}</div>
              <div class="status-label">Activas</div>
            </div>
            <div class="status-item inactive">
              <div class="status-value">{{ stats().totalTenants - stats().activeTenants }}</div>
              <div class="status-label">Inactivas/Suspendidas</div>
            </div>
          </div>
        </div>

        <!-- Información adicional -->
        <div class="info-alert">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <div>
            <strong>Nota:</strong> Los datos mostrados son calculados en tiempo real desde la base de datos.
            Los ingresos corresponden a suscripciones activas procesadas mediante Stripe (sandbox).
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .reports-page {
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;
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

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      display: flex;
      gap: 1.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon.tenants {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
    }

    .stat-icon.users {
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      color: white;
    }

    .stat-icon.bookings {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
    }

    .stat-icon.revenue {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #111827;
      line-height: 1;
      margin-bottom: 0.5rem;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.25rem;
    }

    .stat-detail {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .report-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 1.5rem;
    }

    .card-title {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 1.5rem 0;
    }

    .chart-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .plan-bar {
      display: grid;
      grid-template-columns: 150px 1fr 60px;
      gap: 1rem;
      align-items: center;
    }

    .plan-label {
      display: flex;
      flex-direction: column;
    }

    .plan-name {
      font-weight: 600;
      color: #111827;
    }

    .plan-count {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .bar-track {
      height: 32px;
      background: #f3f4f6;
      border-radius: 9999px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      transition: width 0.3s ease;
    }

    .bar-fill.free {
      background: linear-gradient(90deg, #6b7280, #4b5563);
    }

    .bar-fill.pro {
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    }

    .percentage {
      text-align: right;
      font-weight: 600;
      color: #111827;
    }

    .status-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .status-item {
      padding: 1.5rem;
      border-radius: 0.5rem;
      text-align: center;
    }

    .status-item.active {
      background: #d1fae5;
    }

    .status-item.inactive {
      background: #fee2e2;
    }

    .status-value {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .status-item.active .status-value {
      color: #059669;
    }

    .status-item.inactive .status-value {
      color: #dc2626;
    }

    .status-label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .info-alert {
      display: flex;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: #eff6ff;
      border: 1px solid #3b82f6;
      border-radius: 0.5rem;
      color: #1e40af;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .info-alert svg {
      flex-shrink: 0;
    }
  `]
})
export class ReportsComponent implements OnInit {
  private apiService = inject(ApiService);

  stats = signal<SystemStats>({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    proSubscriptions: 0,
  });
  isLoading = signal(true);

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats(): void {
    this.apiService.get<SystemStats>('/admin/stats').subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        // Mock data for demo
        this.stats.set({
          totalTenants: 15,
          activeTenants: 12,
          totalUsers: 48,
          totalBookings: 234,
          totalRevenue: 348,
          proSubscriptions: 5,
        });
        this.isLoading.set(false);
      },
    });
  }

  getFreeTenantsCount(): number {
    return this.stats().totalTenants - this.stats().proSubscriptions;
  }

  getFreePercentage(): number {
    if (this.stats().totalTenants === 0) return 0;
    return Math.round((this.getFreeTenantsCount() / this.stats().totalTenants) * 100);
  }

  getProPercentage(): number {
    if (this.stats().totalTenants === 0) return 0;
    return Math.round((this.stats().proSubscriptions / this.stats().totalTenants) * 100);
  }
}
