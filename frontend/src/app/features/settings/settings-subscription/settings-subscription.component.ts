import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionsService, Subscription } from '../../../core/services/subscriptions.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-settings-subscription',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="settings-section">
      <h2 class="section-title">Suscripción</h2>
      <p class="section-description">Gestiona tu plan y pagos</p>

      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando información...</p>
        </div>
      } @else {
        <div class="subscription-card">
          <div class="plan-header">
            <div>
              <h3 class="plan-name">Plan {{ currentPlan() }}</h3>
              <span class="plan-status" [class.active]="subscription()?.status === 'ACTIVE'">
                {{ getStatusLabel(subscription()?.status) }}
              </span>
            </div>
            @if (currentPlan() === 'FREE') {
              <button class="btn btn-primary" (click)="upgradePlan()">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <polyline points="19 12 12 19 5 12"></polyline>
                </svg>
                Actualizar a PRO
              </button>
            }
          </div>

          <div class="plan-features">
            <h4 class="features-title">Características de tu plan</h4>
            <div class="features-grid">
              @if (currentPlan() === 'FREE') {
                <div class="feature-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Hasta 50 reservas/mes
                </div>
                <div class="feature-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Hasta 3 servicios
                </div>
                <div class="feature-item disabled">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Notificaciones por email
                </div>
                <div class="feature-item disabled">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Reportes avanzados
                </div>
              } @else {
                <div class="feature-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Reservas ilimitadas
                </div>
                <div class="feature-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Servicios ilimitados
                </div>
                <div class="feature-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Notificaciones por email
                </div>
                <div class="feature-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Reportes avanzados
                </div>
                <div class="feature-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Soporte prioritario
                </div>
              }
            </div>
          </div>

          @if (subscription()) {
            <div class="subscription-info">
              <div class="info-row">
                <span class="info-label">Fecha de inicio:</span>
                <span class="info-value">{{ subscription()!.currentPeriodStart | date:'dd/MM/yyyy' }}</span>
              </div>
              @if (subscription()!.currentPeriodEnd) {
                <div class="info-row">
                  <span class="info-label">Próxima renovación:</span>
                  <span class="info-value">{{ subscription()!.currentPeriodEnd | date:'dd/MM/yyyy' }}</span>
                </div>
              }
            </div>
          }
        </div>

        @if (currentPlan() === 'PRO' && payments().length > 0) {
          <div class="payments-section">
            <h3 class="section-subtitle">Historial de pagos</h3>
            <div class="table-container">
              <table class="payments-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Método</th>
                  </tr>
                </thead>
                <tbody>
                  @for (payment of payments(); track payment.id) {
                    <tr>
                      <td>{{ payment.paymentDate | date:'dd/MM/yyyy HH:mm' }}</td>
                      <td class="amount">{{ payment.amount | currency:'USD' }}</td>
                      <td>
                        <span class="payment-status" [class.success]="payment.status === 'COMPLETED'">
                          {{ payment.status === 'COMPLETED' ? 'Completado' : payment.status }}
                        </span>
                      </td>
                      <td>Stripe</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        @if (subscription()?.status === 'PAST_DUE') {
          <div class="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <div>
              <strong>Pago pendiente</strong>
              <p>Tu suscripción está vencida. Actualiza tu método de pago para continuar.</p>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .settings-section {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .section-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 0.25rem 0;
    }

    .section-description {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0 0 1.5rem 0;
    }

    .loading-state {
      text-align: center;
      padding: 3rem;
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

    .subscription-card {
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .plan-header {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .plan-name {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .plan-status {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .plan-status.active {
      background: rgba(16, 185, 129, 0.3);
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
    }

    .btn-primary {
      background: white;
      color: #2563eb;
    }

    .plan-features {
      padding: 1.5rem;
      background: #f9fafb;
    }

    .features-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 1rem 0;
    }

    .features-grid {
      display: grid;
      gap: 0.75rem;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #374151;
    }

    .feature-item svg {
      color: #10b981;
      flex-shrink: 0;
    }

    .feature-item.disabled {
      color: #9ca3af;
    }

    .feature-item.disabled svg {
      color: #d1d5db;
    }

    .subscription-info {
      padding: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      font-size: 0.875rem;
    }

    .info-label {
      color: #6b7280;
    }

    .info-value {
      color: #111827;
      font-weight: 500;
    }

    .payments-section {
      margin-top: 2rem;
    }

    .section-subtitle {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 1rem 0;
    }

    .table-container {
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .payments-table {
      width: 100%;
      border-collapse: collapse;
    }

    .payments-table th,
    .payments-table td {
      padding: 0.75rem 1rem;
      text-align: left;
      font-size: 0.875rem;
    }

    .payments-table th {
      background: #f9fafb;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
    }

    .payments-table td {
      border-top: 1px solid #e5e7eb;
      color: #374151;
    }

    .amount {
      font-weight: 600;
      color: #111827;
    }

    .payment-status {
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      background: #fee2e2;
      color: #dc2626;
    }

    .payment-status.success {
      background: #d1fae5;
      color: #059669;
    }

    .alert {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border-radius: 0.5rem;
      margin-top: 1.5rem;
    }

    .alert-warning {
      background: #fef3c7;
      border: 1px solid #fbbf24;
    }

    .alert svg {
      color: #f59e0b;
      flex-shrink: 0;
    }

    .alert strong {
      display: block;
      color: #92400e;
      margin-bottom: 0.25rem;
    }

    .alert p {
      color: #92400e;
      font-size: 0.875rem;
      margin: 0;
    }
  `]
})
export class SettingsSubscriptionComponent implements OnInit {
  private subscriptionsService = inject(SubscriptionsService);
  private toastService = inject(ToastService);

  subscription = signal<Subscription | null>(null);
  payments = signal<any[]>([]);
  currentPlan = signal<string>('FREE');
  isLoading = signal(true);

  ngOnInit(): void {
    this.loadSubscription();
  }

  private loadSubscription(): void {
    this.subscriptionsService.getCurrentSubscription().subscribe({
      next: (response) => {
        if (response) {
          this.subscription.set(response);
          this.currentPlan.set(response.plan?.name || 'FREE');
          this.payments.set(response.payments || []);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error', 'No se pudo cargar la información de suscripción');
        this.isLoading.set(false);
      },
    });
  }

  getStatusLabel(status: string | undefined): string {
    const labels: Record<string, string> = {
      'ACTIVE': 'Activa',
      'PAST_DUE': 'Pago vencido',
      'CANCELED': 'Cancelada',
      'TRIALING': 'Prueba',
    };
    return labels[status || ''] || status || 'Inactiva';
  }

  upgradePlan(): void {
    this.subscriptionsService.createCheckout('PRO').subscribe({
      next: (response: { url: string }) => {
        if (response.url) {
          window.location.href = response.url;
        }
      },
      error: (error: any) => {
        this.toastService.error('Error', error.error?.message || 'No se pudo iniciar el proceso de actualización');
      },
    });
  }
}
