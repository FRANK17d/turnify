import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TenantsService, Tenant } from '../../../core/services/tenants.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-tenants-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ConfirmDialogComponent],
  template: `
    <div class="admin-page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Gestión de Empresas</h1>
          <p class="page-subtitle">Administración de todos los tenants del sistema</p>
        </div>
      </header>

      <!-- Filtros y estadísticas -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon active">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            </svg>
          </div>
          <div>
            <div class="stat-value">{{ getActiveTenantsCount() }}</div>
            <div class="stat-label">Empresas Activas</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon pro">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
          </div>
          <div>
            <div class="stat-value">{{ getProTenantsCount() }}</div>
            <div class="stat-label">Suscripciones PRO</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon total">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </div>
          <div>
            <div class="stat-value">{{ tenants().length }}</div>
            <div class="stat-label">Total Empresas</div>
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="filters-bar">
        <div class="search-box">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Buscar empresa..."
            [(ngModel)]="searchTerm"
            (input)="applyFilters()"
          />
        </div>
        <select class="filter-select" [(ngModel)]="statusFilter" (change)="applyFilters()">
          <option value="">Todos los estados</option>
          <option value="ACTIVE">Activo</option>
          <option value="INACTIVE">Inactivo</option>
          <option value="SUSPENDED">Suspendido</option>
        </select>
        <select class="filter-select" [(ngModel)]="planFilter" (change)="applyFilters()">
          <option value="">Todos los planes</option>
          <option value="FREE">FREE</option>
          <option value="PRO">PRO</option>
        </select>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando empresas...</p>
        </div>
      } @else if (filteredTenants().length === 0) {
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          </svg>
          <h3>No hay empresas</h3>
          <p>{{ searchTerm || statusFilter || planFilter ? 'No se encontraron empresas con los filtros aplicados' : 'Aún no hay empresas registradas' }}</p>
        </div>
      } @else {
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Plan</th>
                <th>Estado</th>
                <th>Usuarios</th>
                <th>Reservas</th>
                <th>Fecha registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (tenant of filteredTenants(); track tenant.id) {
                <tr>
                  <td>
                    <div class="tenant-info">
                      <div class="tenant-avatar">
                        {{ tenant.name[0] }}
                      </div>
                      <div>
                        <div class="tenant-name">{{ tenant.name }}</div>
                        <div class="tenant-slug">{{ tenant.slug }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="plan-badge" [class.pro]="tenant.subscription?.plan === 'PRO'">
                      {{ tenant.subscription?.plan || 'FREE' }}
                    </span>
                  </td>
                  <td>
                    <span class="status-badge" [class]="getStatusClass(tenant.status)">
                      {{ getStatusLabel(tenant.status) }}
                    </span>
                  </td>
                  <td>{{ tenant._count?.users || tenant.usersCount || 0 }}</td>
                  <td>{{ tenant._count?.bookings || tenant.bookingsCount || 0 }}</td>
                  <td>{{ tenant.createdAt | date:'dd/MM/yyyy' }}</td>
                  <td>
                    <div class="actions">
                      <a [routerLink]="['/admin/tenants', tenant.id]" class="btn btn-icon" title="Ver detalle">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </a>
                      <button
                        class="btn btn-icon"
                        [class.danger]="tenant.status === 'ACTIVE'"
                        (click)="toggleTenantStatus(tenant)"
                        [title]="tenant.status === 'ACTIVE' ? 'Suspender' : 'Activar'"
                      >
                        @if (tenant.status === 'ACTIVE') {
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                          </svg>
                        } @else {
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <app-confirm-dialog
        [isOpen]="showConfirmDialog()"
        [title]="tenantToToggle()?.status === 'ACTIVE' ? 'Suspender Empresa' : 'Activar Empresa'"
        [message]="'¿Estás seguro de que deseas ' + (tenantToToggle()?.status === 'ACTIVE' ? 'suspender' : 'activar') + ' a ' + (tenantToToggle()?.name || '') + '?'"
        [confirmText]="tenantToToggle()?.status === 'ACTIVE' ? 'Sí, suspender' : 'Sí, activar'"
        cancelText="Cancelar"
        [type]="tenantToToggle()?.status === 'ACTIVE' ? 'danger' : 'primary'"
        (confirm)="confirmToggle()"
        (cancel)="closeDialog()"
      />
    </div>
  `,
  styles: [`
    .admin-page {
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
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
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.25rem;
      display: flex;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon.active {
      background: #d1fae5;
      color: #059669;
    }

    .stat-icon.pro {
      background: #fef3c7;
      color: #f59e0b;
    }

    .stat-icon.total {
      background: #dbeafe;
      color: #2563eb;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.25rem;
    }

    .filters-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 0.5rem 1rem;
      flex: 1;
      min-width: 200px;
    }

    .search-box svg {
      color: #9ca3af;
    }

    .search-box input {
      border: none;
      outline: none;
      width: 100%;
    }

    .filter-select {
      padding: 0.625rem 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      background: white;
      cursor: pointer;
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

    .table-container {
      background: white;
      border-radius: 0.75rem;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th,
    .data-table td {
      padding: 0.875rem 1rem;
      text-align: left;
    }

    .data-table th {
      background: #f9fafb;
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .data-table td {
      border-top: 1px solid #e5e7eb;
    }

    .tenant-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .tenant-avatar {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .tenant-name {
      font-weight: 500;
      color: #111827;
    }

    .tenant-slug {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .plan-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      background: #e5e7eb;
      color: #374151;
    }

    .plan-badge.pro {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
    }

    .status-badge {
      font-size: 0.75rem;
      font-weight: 500;
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

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      padding: 0;
      background: #f3f4f6;
      color: #6b7280;
      border: none;
      border-radius: 0.375rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      text-decoration: none;
    }

    .btn-icon:hover {
      background: #e5e7eb;
    }

    .btn-icon.danger {
      color: #ef4444;
    }
  `]
})
export class TenantsListComponent implements OnInit {
  private tenantsService = inject(TenantsService);
  private toastService = inject(ToastService);

  tenants = signal<Tenant[]>([]);
  filteredTenants = signal<Tenant[]>([]);
  isLoading = signal(true);
  searchTerm = '';
  statusFilter = '';
  planFilter = '';
  showConfirmDialog = signal(false);
  tenantToToggle = signal<Tenant | null>(null);

  ngOnInit(): void {
    this.loadTenants();
  }

  loadTenants(): void {
    this.isLoading.set(true);
    this.tenantsService.findAll().subscribe({
      next: (tenants) => {
        this.tenants.set(tenants);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error', 'No se pudieron cargar las empresas');
        this.isLoading.set(false);
      },
    });
  }

  applyFilters(): void {
    let result = [...this.tenants()];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(term) ||
        t.slug.toLowerCase().includes(term)
      );
    }

    if (this.statusFilter) {
      result = result.filter(t => t.status === this.statusFilter);
    }

    if (this.planFilter) {
      result = result.filter(t => t.subscription?.plan === this.planFilter);
    }

    this.filteredTenants.set(result);
  }

  getActiveTenantsCount(): number {
    return this.tenants().filter(t => t.status === 'ACTIVE').length;
  }

  getProTenantsCount(): number {
    return this.tenants().filter(t => t.subscription?.plan === 'PRO').length;
  }

  getStatusClass(status: string): string {
    return status;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'ACTIVE': 'Activo',
      'INACTIVE': 'Inactivo',
      'SUSPENDED': 'Suspendido',
    };
    return labels[status] || status;
  }

  toggleTenantStatus(tenant: Tenant): void {
    this.tenantToToggle.set(tenant);
    this.showConfirmDialog.set(true);
  }

  confirmToggle(): void {
    const tenant = this.tenantToToggle();
    if (!tenant) return;

    const newStatus = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

    this.tenantsService.updateStatus(tenant.id, newStatus).subscribe({
      next: () => {
        this.toastService.success(
          'Estado actualizado',
          `${tenant.name} ha sido ${newStatus === 'ACTIVE' ? 'activado' : 'suspendido'}`
        );
        this.closeDialog();
        this.loadTenants();
      },
      error: () => {
        this.toastService.error('Error', 'No se pudo actualizar el estado');
        this.closeDialog();
      },
    });
  }

  closeDialog(): void {
    this.showConfirmDialog.set(false);
    this.tenantToToggle.set(null);
  }
}
