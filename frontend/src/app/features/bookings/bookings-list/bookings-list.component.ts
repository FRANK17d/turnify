import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookingsService, Booking, BookingStatus } from '../../../core/services/bookings.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-bookings-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmDialogComponent],
  template: `
    <div class="bookings-page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Reservas</h1>
          <p class="page-subtitle">Gestiona todas las reservas de tu negocio</p>
        </div>
        @if (!canManageBookings()) {
          <a routerLink="/bookings/new" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nueva Reserva
          </a>
        }
      </header>

      <!-- Filtros -->
      <div class="filters-bar">
        <div class="search-box">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Buscar por cliente o servicio..."
            (input)="onSearch($event)"
          />
        </div>
        <div class="filter-buttons">
          @for (status of statuses; track status.value) {
            <button
              class="filter-btn"
              [class.active]="selectedStatus() === status.value"
              (click)="filterByStatus(status.value)"
            >
              {{ status.label }}
            </button>
          }
        </div>
      </div>

      <!-- Lista de reservas -->
      <div class="bookings-list">
        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando reservas...</p>
          </div>
        } @else if (filteredBookings().length === 0) {
          <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <h3>No hay reservas</h3>
            <p>Crea tu primera reserva para comenzar</p>
            @if (canManageBookings()) {
              <a routerLink="/bookings/new" class="btn btn-primary">Crear reserva</a>
            }
          </div>
        } @else {
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Fecha y Hora</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (booking of paginatedBookings(); track booking.id) {
                  <tr>
                    <td>
                      <div class="service-cell">
                        <span class="service-name">{{ booking.service?.name || 'Sin servicio' }}</span>
                        <span class="service-price">{{ booking.service?.price | currency:'USD' }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="date-cell">
                        <span class="date">{{ booking.startTime | date:'EEE, d MMM yyyy':'':'es' }}</span>
                        <span class="time">{{ booking.startTime | date:'HH:mm' }} - {{ booking.endTime | date:'HH:mm' }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="client-cell">
                        <span class="client-name">{{ booking.user?.firstName }} {{ booking.user?.lastName }}</span>
                        <span class="client-email">{{ booking.user?.email }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="status-badge" [class]="'status-' + booking.status.toLowerCase()">
                        {{ getStatusLabel(booking.status) }}
                      </span>
                    </td>
                    <td>
                      <div class="actions">
                        <a [routerLink]="['/bookings', booking.id]" class="action-btn" title="Ver detalles">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </a>
                        @if (booking.status === 'PENDING' && canManageBookings()) {
                          <button
                            class="action-btn confirm"
                            (click)="confirmBooking(booking)"
                            title="Confirmar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </button>
                        }
                        @if (booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED') {
                          <button
                            class="action-btn cancel"
                            (click)="showCancelDialog(booking)"
                            title="Cancelar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Paginación -->
      @if (totalPages() > 1) {
        <div class="pagination">
          <button
            class="page-btn"
            [disabled]="currentPage() === 1"
            (click)="goToPage(currentPage() - 1)"
          >
            Anterior
          </button>
          <span class="page-info">
            Página {{ currentPage() }} de {{ totalPages() }}
          </span>
          <button
            class="page-btn"
            [disabled]="currentPage() === totalPages()"
            (click)="goToPage(currentPage() + 1)"
          >
            Siguiente
          </button>
        </div>
      }

      <!-- Dialog de confirmación -->
      <app-confirm-dialog
        [isOpen]="showConfirmDialog()"
        title="Cancelar Reserva"
        message="¿Estás seguro de que deseas cancelar esta reserva? Esta acción no se puede deshacer."
        confirmText="Sí, cancelar"
        cancelText="No, mantener"
        type="danger"
        (confirm)="cancelBooking()"
        (cancel)="closeDialog()"
      />
    </div>
  `,
  styles: [`
    .bookings-page {
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    @media (max-width: 640px) {
      .page-header {
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
      background: linear-gradient(135deg, var(--primary-color), var(--primary-color-dark));
      color: white;
    }

    .btn-primary:hover {
      background: linear-gradient(135deg, var(--primary-color-dark), var(--primary-color-dark));
    }

    .filters-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 0.5rem 0.75rem;
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
      font-size: 0.875rem;
    }

    .filter-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 0.5rem 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      background: white;
      font-size: 0.875rem;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.15s;
    }

    .filter-btn:hover {
      background: #f9fafb;
    }

    .filter-btn.active {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: white;
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
      border-top-color: var(--primary-color);
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

    .data-table th {
      background: #f9fafb;
      padding: 0.75rem 1rem;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      color: #6b7280;
      border-bottom: 1px solid #e5e7eb;
    }

    .data-table td {
      padding: 1rem;
      border-bottom: 1px solid #f3f4f6;
    }

    .data-table tr:last-child td {
      border-bottom: none;
    }

    .service-cell, .date-cell, .client-cell {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .service-name, .client-name {
      font-weight: 500;
      color: #111827;
    }

    .service-price, .client-email, .time {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .date {
      font-weight: 500;
      color: #111827;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-pending { background: #fef3c7; color: #d97706; }
    .status-confirmed { background: #d1fae5; color: #059669; }
    .status-cancelled { background: #fee2e2; color: #dc2626; }
    .status-completed { background: #e0e7ff; color: #4f46e5; }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      padding: 0.5rem;
      border: none;
      background: #f3f4f6;
      border-radius: 0.375rem;
      cursor: pointer;
      color: #6b7280;
      transition: all 0.15s;
      text-decoration: none;
      display: inline-flex;
    }

    .action-btn:hover {
      background: #e5e7eb;
      color: #374151;
    }

    .action-btn.confirm:hover {
      background: #d1fae5;
      color: #059669;
    }

    .action-btn.cancel:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .page-btn {
      padding: 0.5rem 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      background: white;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      font-size: 0.875rem;
      color: #6b7280;
    }
  `]
})
export class BookingsListComponent implements OnInit {
  private bookingsService = inject(BookingsService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  bookings = signal<Booking[]>([]);
  isLoading = signal(true);
  selectedStatus = signal<string | null>(null);
  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = signal(10);
  showConfirmDialog = signal(false);
  bookingToCancel = signal<Booking | null>(null);

  statuses = [
    { value: null, label: 'Todas' },
    { value: 'PENDING', label: 'Pendientes' },
    { value: 'CONFIRMED', label: 'Confirmadas' },
    { value: 'COMPLETED', label: 'Completadas' },
    { value: 'CANCELLED', label: 'Canceladas' },
  ];

  filteredBookings = computed(() => {
    let result = [...this.bookings()];

    // Filtro por estado
    const status = this.selectedStatus();
    if (status) {
      result = result.filter(b => b.status === status);
    }

    // Filtro por búsqueda
    const search = this.searchTerm().toLowerCase();
    if (search) {
      result = result.filter(b =>
        b.service?.name.toLowerCase().includes(search) ||
        b.user?.firstName.toLowerCase().includes(search) ||
        b.user?.lastName.toLowerCase().includes(search) ||
        b.user?.email.toLowerCase().includes(search)
      );
    }

    return result;
  });

  paginatedBookings = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredBookings().slice(start, end);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredBookings().length / this.pageSize());
  });

  ngOnInit(): void {
    this.loadBookings();
  }

  canManageBookings(): boolean {
    return this.authService.currentUser?.permissions?.includes('MANAGE_BOOKINGS') ?? false;
  }

  loadBookings(): void {
    this.isLoading.set(true);

    this.bookingsService.findAll().subscribe({
      next: (bookings) => {
        this.bookings.set(bookings);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error', 'No se pudieron cargar las reservas');
        this.isLoading.set(false);
      },
    });
  }

  filterByStatus(status: string | null): void {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
    this.loadBookings();
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadBookings();
  }

  confirmBooking(booking: Booking): void {
    this.bookingsService.update(booking.id, { status: BookingStatus.CONFIRMED }).subscribe({
      next: () => {
        this.toastService.success('Reserva confirmada', 'La reserva ha sido confirmada');
        this.loadBookings();
      },
      error: () => {
        this.toastService.error('Error', 'No se pudo confirmar la reserva');
      },
    });
  }

  showCancelDialog(booking: Booking): void {
    this.bookingToCancel.set(booking);
    this.showConfirmDialog.set(true);
  }

  cancelBooking(): void {
    const booking = this.bookingToCancel();
    if (!booking) return;

    this.bookingsService.cancel(booking.id).subscribe({
      next: () => {
        this.toastService.success('Reserva cancelada', 'La reserva ha sido cancelada');
        this.closeDialog();
        this.loadBookings();
      },
      error: () => {
        this.toastService.error('Error', 'No se pudo cancelar la reserva');
        this.closeDialog();
      },
    });
  }

  closeDialog(): void {
    this.showConfirmDialog.set(false);
    this.bookingToCancel.set(null);
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
}
