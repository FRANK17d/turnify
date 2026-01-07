import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BookingsService, Booking, BookingStatus } from '../../../core/services/bookings.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmDialogComponent],
  template: `
    <div class="booking-detail-page">
      <header class="page-header">
        <a routerLink="/bookings" class="back-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Volver a reservas
        </a>
      </header>

      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando reserva...</p>
        </div>
      } @else if (booking()) {
        <div class="detail-grid">
          <div class="detail-card main-card">
            <div class="card-header">
              <h1 class="booking-title">{{ booking()!.service?.name }}</h1>
              <span class="status-badge" [class]="'status-' + booking()!.status.toLowerCase()">
                {{ getStatusLabel(booking()!.status) }}
              </span>
            </div>

            <div class="info-section">
              <h3 class="section-title">Fecha y Hora</h3>
              <div class="info-row">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <div>
                  <strong>{{ booking()!.startTime | date:'EEEE, d MMMM yyyy':'':'es' }}</strong>
                  <span>{{ booking()!.startTime | date:'HH:mm' }} - {{ booking()!.endTime | date:'HH:mm' }}</span>
                </div>
              </div>
            </div>

            <div class="info-section">
              <h3 class="section-title">Servicio</h3>
              <div class="service-info">
                <div class="service-detail">
                  <span class="label">Nombre</span>
                  <span class="value">{{ booking()!.service?.name }}</span>
                </div>
                <div class="service-detail">
                  <span class="label">Duración</span>
                  <span class="value">{{ booking()!.service?.duration }} minutos</span>
                </div>
                <div class="service-detail">
                  <span class="label">Precio</span>
                  <span class="value price">{{ booking()!.service?.price | currency:'USD' }}</span>
                </div>
              </div>
            </div>

            @if (booking()!.notes) {
              <div class="info-section">
                <h3 class="section-title">Notas</h3>
                <p class="notes-text">{{ booking()!.notes }}</p>
              </div>
            }

            <div class="card-actions">
              @if (booking()!.status === 'PENDING' && canManageBookings()) {
                <button class="btn btn-success" (click)="confirmBooking()">
                  Confirmar Reserva
                </button>
              }
              @if (booking()!.status !== 'CANCELLED' && booking()!.status !== 'COMPLETED') {
                <button class="btn btn-danger" (click)="showConfirmDialog.set(true)">
                  Cancelar Reserva
                </button>
              }
              @if (booking()!.status === 'CONFIRMED' && canManageBookings()) {
                <button class="btn btn-primary" (click)="completeBooking()">
                  Marcar Completada
                </button>
              }
            </div>
          </div>

          <div class="detail-card">
            <h3 class="card-title">Cliente</h3>
            <div class="client-info">
              <div class="client-avatar">
                {{ getInitials(booking()!.user?.firstName, booking()!.user?.lastName) }}
              </div>
              <div class="client-details">
                <strong>{{ booking()!.user?.firstName }} {{ booking()!.user?.lastName }}</strong>
                <span>{{ booking()!.user?.email }}</span>
              </div>
            </div>
          </div>

          <div class="detail-card">
            <h3 class="card-title">Información</h3>
            <div class="meta-info">
              <div class="meta-item">
                <span class="meta-label">ID de Reserva</span>
                <span class="meta-value">{{ booking()!.id.slice(0, 8) }}...</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Creada</span>
                <span class="meta-value">{{ booking()!.createdAt | date:'d MMM yyyy, HH:mm':'':'es' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Última actualización</span>
                <span class="meta-value">{{ booking()!.updatedAt | date:'d MMM yyyy, HH:mm':'':'es' }}</span>
              </div>
            </div>
          </div>
        </div>
      }

      <app-confirm-dialog
        [isOpen]="showConfirmDialog()"
        title="Cancelar Reserva"
        message="¿Estás seguro de que deseas cancelar esta reserva? Esta acción no se puede deshacer."
        confirmText="Sí, cancelar"
        cancelText="No, mantener"
        type="danger"
        (confirm)="cancelBooking()"
        (cancel)="showConfirmDialog.set(false)"
      />
    </div>
  `,
  styles: [`
    .booking-detail-page {
      max-width: 1000px;
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
    }

    .back-btn:hover {
      color: #374151;
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
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 1.5rem;
    }

    @media (max-width: 768px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }
    }

    .detail-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .main-card {
      grid-row: span 2;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .booking-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .status-badge {
      padding: 0.375rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-pending { background: #fef3c7; color: #d97706; }
    .status-confirmed { background: #d1fae5; color: #059669; }
    .status-cancelled { background: #fee2e2; color: #dc2626; }
    .status-completed { background: #e0e7ff; color: #4f46e5; }

    .info-section {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .section-title {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      color: #6b7280;
      margin: 0 0 0.75rem 0;
    }

    .info-row {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
    }

    .info-row svg {
      color: #6b7280;
      flex-shrink: 0;
    }

    .info-row div {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .info-row strong {
      color: #111827;
    }

    .info-row span {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .service-info {
      display: grid;
      gap: 0.75rem;
    }

    .service-detail {
      display: flex;
      justify-content: space-between;
    }

    .service-detail .label {
      color: #6b7280;
    }

    .service-detail .value {
      font-weight: 500;
      color: #111827;
    }

    .service-detail .price {
      color: #10b981;
      font-size: 1.125rem;
    }

    .notes-text {
      color: #374151;
      margin: 0;
      line-height: 1.5;
    }

    .card-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .card-title {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 1rem 0;
    }

    .client-info {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .client-avatar {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-color-dark));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
    }

    .client-details {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .client-details strong {
      color: #111827;
    }

    .client-details span {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .meta-info {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .meta-item {
      display: flex;
      justify-content: space-between;
    }

    .meta-label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .meta-value {
      font-size: 0.875rem;
      color: #374151;
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

    .btn-primary {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-color-dark));
      color: white;
    }

    .btn-success {
      background: #10b981;
      color: white;
    }

    .btn-danger {
      background: white;
      border: 1px solid #ef4444;
      color: #ef4444;
    }

    .btn-danger:hover {
      background: #fef2f2;
    }
  `]
})
export class BookingDetailComponent implements OnInit {
  private bookingsService = inject(BookingsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  booking = signal<Booking | null>(null);
  isLoading = signal(true);
  showConfirmDialog = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBooking(id);
    }
  }

  canManageBookings(): boolean {
    return this.authService.currentUser?.permissions?.includes('MANAGE_BOOKINGS') ?? false;
  }

  private loadBooking(id: string): void {
    this.bookingsService.findOne(id).subscribe({
      next: (booking) => {
        this.booking.set(booking);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error', 'No se pudo cargar la reserva');
        this.router.navigate(['/bookings']);
      },
    });
  }

  confirmBooking(): void {
    const booking = this.booking();
    if (!booking) return;

    this.bookingsService.update(booking.id, { status: BookingStatus.CONFIRMED }).subscribe({
      next: () => {
        this.toastService.success('Reserva confirmada', 'La reserva ha sido confirmada');
        this.loadBooking(booking.id);
      },
      error: () => {
        this.toastService.error('Error', 'No se pudo confirmar la reserva');
      },
    });
  }

  completeBooking(): void {
    const booking = this.booking();
    if (!booking) return;

    this.bookingsService.update(booking.id, { status: BookingStatus.COMPLETED }).subscribe({
      next: () => {
        this.toastService.success('Reserva completada', 'La reserva ha sido marcada como completada');
        this.loadBooking(booking.id);
      },
      error: () => {
        this.toastService.error('Error', 'No se pudo completar la reserva');
      },
    });
  }

  cancelBooking(): void {
    const booking = this.booking();
    if (!booking) return;

    this.bookingsService.cancel(booking.id).subscribe({
      next: () => {
        this.toastService.success('Reserva cancelada', 'La reserva ha sido cancelada');
        this.showConfirmDialog.set(false);
        this.loadBooking(booking.id);
      },
      error: () => {
        this.toastService.error('Error', 'No se pudo cancelar la reserva');
        this.showConfirmDialog.set(false);
      },
    });
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

  getInitials(firstName?: string, lastName?: string): string {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  }
}
