import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ApiService } from '../../../core/services/api.service';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  roles: { id: string; name: string }[];
}

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ConfirmDialogComponent],
  template: `
    <div class="users-page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Usuarios</h1>
          <p class="page-subtitle">Gestiona los usuarios de tu empresa</p>
        </div>
        <a routerLink="/users/new" class="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
          Nuevo Usuario
        </a>
      </header>

      <!-- Filtros -->
      <div class="filters-bar">
        <div class="search-box">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            [(ngModel)]="searchTerm"
            (input)="applyFilters()"
          />
        </div>
        <select class="filter-select" [(ngModel)]="statusFilter" (change)="applyFilters()">
          <option value="">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando usuarios...</p>
        </div>
      } @else if (filteredUsers().length === 0) {
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <h3>No hay usuarios</h3>
          <p>{{ searchTerm || statusFilter ? 'No se encontraron usuarios con los filtros aplicados' : 'Invita a tu primer usuario' }}</p>
          @if (!searchTerm && !statusFilter) {
            <a routerLink="/users/new" class="btn btn-primary">Invitar usuario</a>
          }
        </div>
      } @else {
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Fecha registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (user of filteredUsers(); track user.id) {
                <tr>
                  <td>
                    <div class="user-info">
                      <div class="avatar">
                        {{ user.firstName[0] }}{{ user.lastName[0] }}
                      </div>
                      <div>
                        <div class="user-name">{{ user.firstName }} {{ user.lastName }}</div>
                        <div class="user-email">{{ user.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="roles-list">
                      @for (role of user.roles; track role.id) {
                        <span class="role-badge" [class]="getRoleClass(role.name)">
                          {{ getRoleLabel(role.name) }}
                        </span>
                      }
                    </div>
                  </td>
                  <td>
                    <span class="status-badge" [class.active]="user.isActive" [class.inactive]="!user.isActive">
                      {{ user.isActive ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td>{{ user.createdAt | date:'dd/MM/yyyy' }}</td>
                  <td>
                    <div class="actions">
                      <a [routerLink]="['/users', user.id, 'edit']" class="btn btn-icon" title="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </a>
                      <button
                        class="btn btn-icon"
                        [class.danger]="user.isActive"
                        (click)="toggleUserStatus(user)"
                        [title]="user.isActive ? 'Desactivar' : 'Activar'"
                      >
                        @if (user.isActive) {
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
        [title]="userToToggle()?.isActive ? 'Desactivar Usuario' : 'Activar Usuario'"
        [message]="'¿Estás seguro de que deseas ' + (userToToggle()?.isActive ? 'desactivar' : 'activar') + ' al usuario ' + (userToToggle()?.firstName || '') + ' ' + (userToToggle()?.lastName || '') + '?'"
        [confirmText]="userToToggle()?.isActive ? 'Sí, desactivar' : 'Sí, activar'"
        cancelText="Cancelar"
        [type]="userToToggle()?.isActive ? 'danger' : 'primary'"
        (confirm)="confirmToggle()"
        (cancel)="closeDialog()"
      />
    </div>
  `,
  styles: [`
    .users-page {
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
      justify-content: center;
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

    .btn-icon {
      width: 32px;
      height: 32px;
      padding: 0;
      background: #f3f4f6;
      color: #6b7280;
    }

    .btn-icon:hover {
      background: #e5e7eb;
    }

    .btn-icon.danger {
      color: #ef4444;
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

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .avatar {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .user-name {
      font-weight: 500;
      color: #111827;
    }

    .user-email {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .roles-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .role-badge {
      font-size: 0.625rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      background: #e5e7eb;
      color: #374151;
    }

    .role-badge.admin {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .role-badge.client {
      background: #f3e8ff;
      color: #7c3aed;
    }

    .status-badge {
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
    }

    .status-badge.active {
      background: #d1fae5;
      color: #059669;
    }

    .status-badge.inactive {
      background: #fee2e2;
      color: #dc2626;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }
  `]
})
export class UsersListComponent implements OnInit {
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);

  users = signal<User[]>([]);
  filteredUsers = signal<User[]>([]);
  isLoading = signal(true);
  searchTerm = '';
  statusFilter = '';
  showConfirmDialog = signal(false);
  userToToggle = signal<User | null>(null);

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.apiService.get<User[]>('/users').subscribe({
      next: (response) => {
        // Handle both cases: raw array or { data: User[] }
        const users = Array.isArray(response) ? response : (response as any).data || [];
        this.users.set(users);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error', 'No se pudieron cargar los usuarios');
        this.isLoading.set(false);
      },
    });
  }

  applyFilters(): void {
    const usersValue = this.users();
    if (!Array.isArray(usersValue)) {
      this.filteredUsers.set([]);
      return;
    }

    let result = [...usersValue];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(u =>
        u.firstName.toLowerCase().includes(term) ||
        u.lastName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    }

    if (this.statusFilter === 'active') {
      result = result.filter(u => u.isActive);
    } else if (this.statusFilter === 'inactive') {
      result = result.filter(u => !u.isActive);
    }

    this.filteredUsers.set(result);
  }

  getRoleClass(roleName: string): string {
    if (roleName.includes('ADMIN')) return 'admin';
    if (roleName.includes('CLIENTE')) return 'client';
    return '';
  }

  getRoleLabel(roleName: string): string {
    const labels: Record<string, string> = {
      'SUPER_ADMIN': 'Super Admin',
      'ADMIN_EMPRESA': 'Admin',
      'CLIENTE': 'Cliente',
    };
    return labels[roleName] || roleName;
  }

  toggleUserStatus(user: User): void {
    this.userToToggle.set(user);
    this.showConfirmDialog.set(true);
  }

  confirmToggle(): void {
    const user = this.userToToggle();
    if (!user) return;

    this.apiService.patch(`/users/${user.id}`, { isActive: !user.isActive }).subscribe({
      next: () => {
        this.toastService.success(
          user.isActive ? 'Usuario desactivado' : 'Usuario activado',
          `${user.firstName} ${user.lastName} ha sido ${user.isActive ? 'desactivado' : 'activado'}`
        );
        this.closeDialog();
        this.loadUsers();
      },
      error: () => {
        this.toastService.error('Error', 'No se pudo actualizar el usuario');
        this.closeDialog();
      },
    });
  }

  closeDialog(): void {
    this.showConfirmDialog.set(false);
    this.userToToggle.set(null);
  }
}
