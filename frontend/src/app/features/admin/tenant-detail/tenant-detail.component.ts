import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TenantsService, TenantDetail } from '../../../core/services/tenants.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-tenant-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="detail-page">
      <header class="page-header">
        <a routerLink="/admin/tenants" class="back-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Volver a empresas
        </a>
        <h1 class="page-title">{{ tenant()?.name }}</h1>
      </header>

      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando información...</p>
        </div>
      } @else if (tenant()) {
        <div class="detail-grid">
          <!-- Información general -->
          <div class="detail-card">
            <h2 class="card-title">Información General</h2>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">Nombre:</span>
                <span class="info-value">{{ tenant()!.name }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Slug:</span>
                <span class="info-value">{{ tenant()!.slug }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Estado:</span>
                <span class="status-badge" [class]="tenant()!.status">
                  {{ getStatusLabel(tenant()!.status) }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Fecha registro:</span>
                <span class="info-value">{{ tenant()!.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>

            </div>
          </div>

          <!-- Suscripción -->
          <div class="detail-card">
            <h2 class="card-title">Suscripción</h2>
            @if (tenant()!.subscription) {
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">Plan:</span>
                  <span class="plan-badge" [class.pro]="tenant()!.subscription!.plan === 'PRO'">
                    {{ tenant()!.subscription!.plan }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Estado:</span>
                  <span class="status-badge" [class.active]="tenant()!.subscription!.status === 'ACTIVE'">
                    {{ tenant()!.subscription!.status }}
                  </span>
                </div>
              </div>
            } @else {
              <p class="empty-text">Sin suscripción activa</p>
            }
          </div>

          <!-- Estadísticas -->
          <div class="detail-card full-width">
            <h2 class="card-title">Estadísticas</h2>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-icon users">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div>
                  <div class="stat-value">{{ (tenant()?.users?.length) || 0 }}</div>
                  <div class="stat-label">Usuarios</div>
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-icon services">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                    <line x1="7" y1="7" x2="7.01" y2="7"></line>
                  </svg>
                </div>
                <div>
                  <div class="stat-value">{{ (tenant()?.services?.length) || 0 }}</div>
                  <div class="stat-label">Servicios</div>
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-icon bookings">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <div>
                  <div class="stat-value">{{ (tenant()?.bookings?.length) || 0 }}</div>
                  <div class="stat-label">Reservas</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Usuarios recientes -->
          @if (tenant()!.users && tenant()!.users.length > 0) {
            <div class="detail-card full-width">
              <h2 class="card-title">Usuarios Recientes</h2>
              <div class="users-list">
                @for (user of tenant()!.users.slice(0, 5); track user.id) {
                  <div class="user-item">
                    <div class="user-avatar">
                      {{ user.firstName[0] }}{{ user.lastName[0] }}
                    </div>
                    <div class="user-info">
                      <div class="user-name">{{ user.firstName }} {{ user.lastName }}</div>
                      <div class="user-email">{{ user.email }}</div>
                    </div>
                    <span class="user-status" [class.active]="user.isActive">
                      {{ user.isActive ? 'Activo' : 'Inactivo' }}
                    </span>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-page {
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 1.5rem;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: #6b7280;
      text-decoration: none;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
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

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .detail-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .detail-card.full-width {
      grid-column: 1 / -1;
    }

    .card-title {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 1rem 0;
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .info-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .info-label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .info-value {
      font-size: 0.875rem;
      font-weight: 500;
      color: #111827;
    }

    .status-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
    }

    .status-badge.ACTIVE {
      background: #d1fae5;
      color: #059669;
    }

    .status-badge.INACTIVE {
      background: #fee2e2;
      color: #dc2626;
    }

    .status-badge.SUSPENDED {
      background: #fef3c7;
      color: #d97706;
    }

    .status-badge.active {
      background: #d1fae5;
      color: #059669;
    }

    .plan-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.375rem 0.75rem;
      border-radius: 9999px;
      background: #e5e7eb;
      color: #374151;
    }

    .plan-badge.pro {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
    }

    .empty-text {
      color: #9ca3af;
      font-size: 0.875rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 0.5rem;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon.users {
      background: #dbeafe;
      color: #2563eb;
    }

    .stat-icon.services {
      background: #f3e8ff;
      color: #7c3aed;
    }

    .stat-icon.bookings {
      background: #d1fae5;
      color: #059669;
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

    .users-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .user-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      background: #f9fafb;
      border-radius: 0.5rem;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .user-info {
      flex: 1;
    }

    .user-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #111827;
    }

    .user-email {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .user-status {
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      background: #fee2e2;
      color: #dc2626;
    }

    .user-status.active {
      background: #d1fae5;
      color: #059669;
    }

    @media (max-width: 768px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TenantDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private tenantsService = inject(TenantsService);
  private toastService = inject(ToastService);

  tenant = signal<TenantDetail | null>(null);
  isLoading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTenant(id);
    }
  }

  private loadTenant(id: string): void {
    this.tenantsService.findOne(id).subscribe({
      next: (tenant) => {
        this.tenant.set(tenant);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error', 'No se pudo cargar la información de la empresa');
        this.isLoading.set(false);
      },
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'ACTIVE': 'Activo',
      'INACTIVE': 'Inactivo',
      'SUSPENDED': 'Suspendido',
    };
    return labels[status] || status;
  }
}
