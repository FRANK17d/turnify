import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="plans-page">
      <header class="page-header">
        <h1 class="page-title">Gestión de Planes</h1>
        <p class="page-subtitle">Configuración de planes de suscripción</p>
      </header>

      <div class="plans-grid">
        <!-- Plan FREE -->
        <div class="plan-card">
          <div class="plan-header free">
            <h2 class="plan-name">FREE</h2>
            <div class="plan-price">
              <span class="price">$0</span>
              <span class="period">/mes</span>
            </div>
          </div>
          <div class="plan-body">
            <ul class="features-list">
              <li class="feature-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Hasta 50 reservas/mes
              </li>
              <li class="feature-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Hasta 3 servicios
              </li>
              <li class="feature-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Gestión básica
              </li>
              <li class="feature-item disabled">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Notificaciones por email
              </li>
              <li class="feature-item disabled">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Reportes avanzados
              </li>
            </ul>
          </div>
          <div class="plan-footer">
            <span class="plan-status active">Activo</span>
          </div>
        </div>

        <!-- Plan PRO -->
        <div class="plan-card featured">
          <div class="plan-badge">Popular</div>
          <div class="plan-header pro">
            <h2 class="plan-name">PRO</h2>
            <div class="plan-price">
              <span class="price">$29</span>
              <span class="period">/mes</span>
            </div>
          </div>
          <div class="plan-body">
            <ul class="features-list">
              <li class="feature-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Reservas ilimitadas
              </li>
              <li class="feature-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Servicios ilimitados
              </li>
              <li class="feature-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Notificaciones por email
              </li>
              <li class="feature-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Reportes avanzados
              </li>
              <li class="feature-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Soporte prioritario
              </li>
              <li class="feature-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                White-label personalizado
              </li>
            </ul>
          </div>
          <div class="plan-footer">
            <span class="plan-status active">Activo</span>
          </div>
        </div>
      </div>

      <!-- Información adicional -->
      <div class="info-card">
        <h3 class="info-title">Información sobre Planes</h3>
        <div class="info-content">
          <p><strong>Plan FREE:</strong> Ideal para empezar y probar el sistema. Incluye funcionalidades básicas con límites de uso.</p>
          <p><strong>Plan PRO:</strong> Para negocios que requieren funcionalidades avanzadas sin límites. Incluye todas las características premium.</p>
          <p class="info-note">💡 Los planes se gestionan mediante Stripe en modo sandbox para desarrollo.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .plans-page {
      max-width: 1000px;
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

    .plans-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .plan-card {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 1rem;
      overflow: hidden;
      position: relative;
    }

    .plan-card.featured {
      border-color: #3b82f6;
      box-shadow: 0 10px 40px rgba(59, 130, 246, 0.15);
    }

    .plan-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.375rem 0.875rem;
      border-radius: 9999px;
    }

    .plan-header {
      padding: 2rem;
      text-align: center;
    }

    .plan-header.free {
      background: linear-gradient(135deg, #6b7280, #4b5563);
      color: white;
    }

    .plan-header.pro {
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      color: white;
    }

    .plan-name {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 1rem 0;
    }

    .plan-price {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 0.25rem;
    }

    .price {
      font-size: 3rem;
      font-weight: 700;
    }

    .period {
      font-size: 1rem;
      opacity: 0.8;
    }

    .plan-body {
      padding: 2rem;
    }

    .features-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
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

    .plan-footer {
      padding: 1.5rem 2rem;
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }

    .plan-status {
      font-size: 0.875rem;
      font-weight: 600;
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      background: #d1fae5;
      color: #059669;
    }

    .info-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      padding: 1.5rem;
    }

    .info-title {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 1rem 0;
    }

    .info-content p {
      font-size: 0.875rem;
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 0.75rem;
    }

    .info-note {
      background: #eff6ff;
      border-left: 3px solid #3b82f6;
      padding: 0.75rem 1rem;
      border-radius: 0.25rem;
      color: #1e40af !important;
    }

    @media (max-width: 768px) {
      .plans-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PlansComponent {}
