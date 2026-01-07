import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ServicesService, Service } from '../../../core/services/services.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-services-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmDialogComponent],
  template: `
    <div class="services-page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Servicios</h1>
          <p class="page-subtitle">Gestiona los servicios que ofrece tu negocio</p>
        </div>
        @if (canManageServices()) {
          <a routerLink="/services/new" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nuevo Servicio
          </a>
        }
      </header>

      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando servicios...</p>
        </div>
      } @else if (services().length === 0) {
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
            <line x1="7" y1="7" x2="7.01" y2="7"></line>
          </svg>
          <h3>No hay servicios</h3>
          <p>Crea tu primer servicio para que los clientes puedan reservar</p>
          @if (canManageServices()) {
            <a routerLink="/services/new" class="btn btn-primary">Crear servicio</a>
          }
        </div>
      } @else {
        <div class="services-grid">
          @for (service of services(); track service.id) {
            <div class="service-card" [class.inactive]="!service.isActive">
              <div class="card-header">
                <h3 class="service-name">{{ service.name }}</h3>
                <span class="service-status" [class.active]="service.isActive">
                  {{ service.isActive ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
              <p class="service-description">{{ service.description || 'Sin descripción' }}</p>
              <div class="service-details">
                <div class="detail-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  {{ service.duration }} min
                </div>
                <div class="detail-item price">
                  {{ service.price | currency:'USD' }}
                </div>
              </div>
              @if (canManageServices()) {
                <div class="card-actions">
                  <a [routerLink]="['/services', service.id, 'edit']" class="btn btn-outline btn-sm">
                    Editar
                  </a>
                  <button
                    class="btn btn-ghost btn-sm"
                    (click)="toggleServiceStatus(service)"
                  >
                    {{ service.isActive ? 'Desactivar' : 'Activar' }}
                  </button>
                  <button
                    class="btn btn-danger-ghost btn-sm"
                    (click)="showDeleteDialog(service)"
                  >
                    Eliminar
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }

      <app-confirm-dialog
        [isOpen]="showConfirmDialog()"
        title="Eliminar Servicio"
        [message]="'¿Estás seguro de que deseas eliminar el servicio ' + (serviceToDelete()?.name || '') + '?'"
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        type="danger"
        (confirm)="deleteService()"
        (cancel)="closeDialog()"
      />
    </div>
  `,
  styles: [`
    .services-page {
      max-width: 1200px;
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

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
    }

    .btn-outline {
      background: white;
      border: 1px solid #e5e7eb;
      color: #374151;
    }

    .btn-ghost {
      background: transparent;
      color: #6b7280;
    }

    .btn-ghost:hover {
      background: #f3f4f6;
    }

    .btn-danger-ghost {
      background: transparent;
      color: #ef4444;
    }

    .btn-danger-ghost:hover {
      background: #fef2f2;
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

    .empty-state .btn {
      margin-top: 1rem;
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

    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }

    .service-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.15s;
    }

    .service-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .service-card.inactive {
      opacity: 0.7;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }

    .service-name {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .service-status {
      font-size: 0.625rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      background: #fee2e2;
      color: #dc2626;
    }

    .service-status.active {
      background: #d1fae5;
      color: #059669;
    }

    .service-description {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0 0 1rem 0;
      line-height: 1.5;
    }

    .service-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-top: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 1rem;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .detail-item.price {
      font-weight: 600;
      color: #10b981;
      font-size: 1rem;
    }

    .card-actions {
      display: flex;
      gap: 0.5rem;
    }
  `]
})
export class ServicesListComponent implements OnInit {
  private servicesService = inject(ServicesService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  services = signal<Service[]>([]);
  isLoading = signal(true);
  showConfirmDialog = signal(false);
  serviceToDelete = signal<Service | null>(null);

  ngOnInit(): void {
    this.loadServices();
  }

  canManageServices(): boolean {
    return this.authService.currentUser?.permissions?.includes('MANAGE_SERVICES') ?? false;
  }

  loadServices(): void {
    this.isLoading.set(true);
    this.servicesService.findAll().subscribe({
      next: (services) => {
        this.services.set(services);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error', 'No se pudieron cargar los servicios');
        this.isLoading.set(false);
      },
    });
  }

  toggleServiceStatus(service: Service): void {
    this.servicesService.update(service.id, { isActive: !service.isActive }).subscribe({
      next: () => {
        this.toastService.success(
          service.isActive ? 'Servicio desactivado' : 'Servicio activado',
          `El servicio "${service.name}" ha sido ${service.isActive ? 'desactivado' : 'activado'}`
        );
        this.loadServices();
      },
      error: () => {
        this.toastService.error('Error', 'No se pudo actualizar el servicio');
      },
    });
  }

  showDeleteDialog(service: Service): void {
    this.serviceToDelete.set(service);
    this.showConfirmDialog.set(true);
  }

  deleteService(): void {
    const service = this.serviceToDelete();
    if (!service) return;

    this.servicesService.delete(service.id).subscribe({
      next: () => {
        this.toastService.success('Servicio eliminado', `El servicio "${service.name}" ha sido eliminado`);
        this.closeDialog();
        this.loadServices();
      },
      error: () => {
        this.toastService.error('Error', 'No se pudo eliminar el servicio');
        this.closeDialog();
      },
    });
  }

  closeDialog(): void {
    this.showConfirmDialog.set(false);
    this.serviceToDelete.set(null);
  }
}
