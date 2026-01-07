import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../shared/services/toast.service';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue: any;
  newValue: any;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="audit-page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Auditoría</h1>
          <p class="page-subtitle">Historial de cambios en el sistema</p>
        </div>
      </header>

      <!-- Filtros -->
      <div class="filters-bar">
        <select class="filter-select" [(ngModel)]="actionFilter" (change)="applyFilters()">
          <option value="">Todas las acciones</option>
          <option value="CREATE">Crear</option>
          <option value="UPDATE">Actualizar</option>
          <option value="DELETE">Eliminar</option>
          <option value="LOGIN">Inicio de sesión</option>
        </select>
        <select class="filter-select" [(ngModel)]="entityFilter" (change)="applyFilters()">
          <option value="">Todas las entidades</option>
          <option value="User">Usuarios</option>
          <option value="Service">Servicios</option>
          <option value="Booking">Reservas</option>
          <option value="Tenant">Empresa</option>
        </select>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando registros...</p>
        </div>
      } @else if (filteredLogs().length === 0) {
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <h3>No hay registros</h3>
          <p>{{ actionFilter || entityFilter ? 'No se encontraron registros con los filtros aplicados' : 'Aún no hay actividad registrada' }}</p>
        </div>
      } @else {
        <div class="timeline">
          @for (log of filteredLogs(); track log.id) {
            <div class="timeline-item">
              <div class="timeline-marker" [class]="getActionClass(log.action)">
                @switch (log.action) {
                  @case ('CREATE') {
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  }
                  @case ('UPDATE') {
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  }
                  @case ('DELETE') {
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  }
                  @case ('LOGIN') {
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                      <polyline points="10 17 15 12 10 7"></polyline>
                      <line x1="15" y1="12" x2="3" y2="12"></line>
                    </svg>
                  }
                  @default {
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  }
                }
              </div>

              <div class="timeline-content">
                <div class="log-header">
                  <div>
                    <h3 class="log-title">
                      {{ getActionLabel(log.action) }} {{ getEntityLabel(log.entityType) }}
                    </h3>
                    <p class="log-user">
                      Por {{ log.user.firstName }} {{ log.user.lastName }}
                    </p>
                  </div>
                  <span class="log-time">{{ log.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>

                @if (log.oldValue || log.newValue) {
                  <div class="log-changes">
                    @if (log.action === 'UPDATE' && log.oldValue && log.newValue) {
                      <div class="changes-grid">
                        @for (key of getChangedKeys(log); track key) {
                          <div class="change-item">
                            <span class="change-label">{{ key }}:</span>
                            <span class="change-old">{{ log.oldValue[key] }}</span>
                            <span class="change-arrow">→</span>
                            <span class="change-new">{{ log.newValue[key] }}</span>
                          </div>
                        }
                      </div>
                    }
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
    .audit-page {
      max-width: 900px;
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

    .filters-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .filter-select {
      padding: 0.625rem 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      background: white;
      cursor: pointer;
      font-size: 0.875rem;
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

    .timeline {
      position: relative;
      padding-left: 2rem;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 1rem;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #e5e7eb;
    }

    .timeline-item {
      position: relative;
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .timeline-marker {
      position: absolute;
      left: -1.5rem;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border: 2px solid;
    }

    .timeline-marker.CREATE {
      border-color: #10b981;
      color: #10b981;
    }

    .timeline-marker.UPDATE {
      border-color: #3b82f6;
      color: #3b82f6;
    }

    .timeline-marker.DELETE {
      border-color: #ef4444;
      color: #ef4444;
    }

    .timeline-marker.LOGIN {
      border-color: #8b5cf6;
      color: #8b5cf6;
    }

    .timeline-content {
      flex: 1;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1rem;
    }

    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }

    .log-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 0.25rem 0;
    }

    .log-user {
      font-size: 0.75rem;
      color: #6b7280;
      margin: 0;
    }

    .log-time {
      font-size: 0.75rem;
      color: #9ca3af;
      white-space: nowrap;
    }

    .log-changes {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid #e5e7eb;
    }

    .changes-grid {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .change-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
    }

    .change-label {
      font-weight: 500;
      color: #6b7280;
      min-width: 100px;
    }

    .change-old {
      color: #ef4444;
      text-decoration: line-through;
    }

    .change-arrow {
      color: #9ca3af;
    }

    .change-new {
      color: #10b981;
      font-weight: 500;
    }
  `]
})
export class AuditLogsComponent implements OnInit {
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);

  logs = signal<AuditLog[]>([]);
  filteredLogs = signal<AuditLog[]>([]);
  isLoading = signal(true);
  actionFilter = '';
  entityFilter = '';

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.isLoading.set(true);
    this.apiService.get<{ data: AuditLog[] }>('/audit').subscribe({
      next: (response) => {
        this.logs.set(response.data);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error', 'No se pudieron cargar los registros de auditoría');
        this.isLoading.set(false);
      },
    });
  }

  applyFilters(): void {
    let result = [...this.logs()];

    if (this.actionFilter) {
      result = result.filter(l => l.action === this.actionFilter);
    }

    if (this.entityFilter) {
      result = result.filter(l => l.entityType === this.entityFilter);
    }

    this.filteredLogs.set(result);
  }

  getActionClass(action: string): string {
    return action;
  }

  getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      'CREATE': 'Creó',
      'UPDATE': 'Actualizó',
      'DELETE': 'Eliminó',
      'LOGIN': 'Inició sesión en',
    };
    return labels[action] || action;
  }

  getEntityLabel(entity: string): string {
    const labels: Record<string, string> = {
      'User': 'usuario',
      'Service': 'servicio',
      'Booking': 'reserva',
      'Tenant': 'empresa',
    };
    return labels[entity] || entity;
  }

  getChangedKeys(log: AuditLog): string[] {
    if (!log.oldValue || !log.newValue) return [];

    const oldKeys = Object.keys(log.oldValue);
    const newKeys = Object.keys(log.newValue);
    const allKeys = [...new Set([...oldKeys, ...newKeys])];

    return allKeys.filter(key =>
      log.oldValue[key] !== log.newValue[key] &&
      key !== 'updatedAt' &&
      key !== 'id'
    );
  }
}
