import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from '../../shared/components/toast/toast.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToastComponent],
  template: `
    <div class="auth-layout" [class.dark]="isDarkMode()">
      <!-- Left Panel - Form -->
      <div class="auth-container">
        <!-- Theme Toggle -->
        <button class="theme-toggle" (click)="toggleTheme()">
          <svg *ngIf="!isDarkMode()" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
          <svg *ngIf="isDarkMode()" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        </button>

        <div class="auth-content">
          <!-- Brand -->
          <div class="auth-brand">
            <div class="brand-row">
              <img src="assets/logo.png" alt="Turnify" class="brand-logo" />
              <span class="brand-title">Turnify</span>
              <span class="brand-badge">SaaS</span>
            </div>
          </div>

          <!-- Router Outlet for Login/Register/etc -->
          <div class="auth-card">
            <router-outlet />
          </div>

          <!-- Footer -->
          <div class="auth-footer">
            <div class="footer-info">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>Plataforma de Reservas</span>
              <span class="dot">•</span>
              <span>Gestión en Tiempo Real</span>
            </div>
            <p class="copyright">© {{ currentYear }} Turnify. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>

      <!-- Right Panel - Decorative -->
      <div class="auth-showcase">
        <div class="showcase-overlay"></div>
        <div class="showcase-pattern"></div>
        <div class="showcase-gradient-1"></div>
        <div class="showcase-gradient-2"></div>
        
        <div class="showcase-content">
          <div class="showcase-header">
            <h2>
              Optimiza tus<br/>
              <span class="highlight">citas y reservas</span>.
            </h2>
            <p>Gestiona agendas en tiempo real, automatiza recordatorios y elimina el ausentismo en tu negocio de servicios.</p>
          </div>

          <div class="features-grid">
            <div class="feature-card primary">
              <div class="feature-image">
                <img src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=300&fit=crop" alt="Office" />
                <div class="feature-overlay"></div>
                <div class="feature-badge">
                  <div class="badge-header">PRÓXIMA CITA</div>
                  <div class="badge-title">Confirmación Auto</div>
                  <div class="badge-time">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    09:30 AM
                  </div>
                </div>
                <div class="feature-label">Vista de Agenda Diaria</div>
              </div>
            </div>

            <div class="feature-card small">
              <div class="feature-icon blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <h3>Agenda Inteligente</h3>
              <p>Visualiza y gestiona huecos libres al instante.</p>
            </div>

            <div class="feature-card small">
              <div class="feature-icon green">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </div>
              <h3>Recordatorios Auto</h3>
              <p>Reduce el ausentismo con alertas automáticas.</p>
            </div>

            <div class="feature-card primary">
              <div class="feature-image">
                <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop" alt="Gym" />
                <div class="feature-overlay"></div>
                <div class="cupos-badge">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  18/20 CUPOS
                </div>
                <div class="feature-bottom">
                  <span class="feature-label-white">Clases Grupales</span>
                  <div class="live-indicator">
                    <span class="pulse"></span>
                    Reserva en vivo
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="showcase-footer">
            <div class="users-section">
              <div class="avatars">
                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="User" />
                <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" />
                <div class="avatar-count">+2k</div>
              </div>
              <span>Empresas gestionan sus citas con <strong>Turnify</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <app-toast />
  `,
  styles: [`
    :host {
      display: block;
    }

    .auth-layout {
      --primary: #0d47a1;
      --primary-hover: #1565c0;
      --primary-light: #e3f2fd;
      --bg-light: #ffffff;
      --bg-dark: #0f172a;
      --surface-light: #f8fafc;
      --surface-dark: #1e293b;
      --text-light: #334155;
      --text-dark: #e2e8f0;
      --border-light: #e2e8f0;
      --border-dark: #334155;
      
      min-height: 100vh;
      display: flex;
      background: var(--bg-light);
      color: var(--text-light);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      transition: all 0.3s ease;
      
      /* Force default colors for auth pages */
      --primary-color: #0d47a1 !important;
      --primary-color-dark: #1565c0 !important;
      --primary-color-light: #e3f2fd !important;
    }

    .auth-layout.dark {
      background: var(--bg-dark);
      color: var(--text-dark);
    }

    /* Left Panel */
    .auth-container {
      width: 100%;
      height: 100vh;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      position: relative;
      overflow-y: auto;
      z-index: 10;
    }

    /* Custom scrollbar for the form panel */
    .auth-container::-webkit-scrollbar {
      width: 6px;
    }

    .auth-container::-webkit-scrollbar-track {
      background: transparent;
    }

    .auth-container::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 3px;
    }

    .auth-container::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }

    .auth-layout.dark .auth-container::-webkit-scrollbar-thumb {
      background: #475569;
    }

    .auth-layout.dark .auth-container::-webkit-scrollbar-thumb:hover {
      background: #64748b;
    }

    @media (min-width: 1024px) {
      .auth-container {
        width: 50%;
        padding: 3rem 4rem;
        border-right: 1px solid var(--border-light);
        margin-right: 50%;
      }
      
      .auth-layout.dark .auth-container {
        border-right-color: var(--border-dark);
      }
    }

    .auth-content {
      width: 100%;
      max-width: 400px;
      margin: auto;
    }

    /* Theme Toggle */
    .theme-toggle {
      position: absolute;
      top: 2rem;
      left: 2rem;
      padding: 0.5rem;
      border-radius: 50%;
      background: transparent;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      transition: all 0.2s;
    }

    .theme-toggle:hover {
      background: var(--surface-light);
      color: var(--text-light);
    }

    .auth-layout.dark .theme-toggle:hover {
      background: var(--surface-dark);
      color: var(--text-dark);
    }

    /* Brand */
    .auth-brand {
      margin-bottom: 2.5rem;
    }

    .brand-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-logo {
      width: 32px;
      height: 32px;
      object-fit: contain;
    }

    .brand-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--primary);
      letter-spacing: -0.025em;
    }

    .auth-layout.dark .brand-title {
      color: white;
    }

    .brand-badge {
      background: rgba(13, 71, 161, 0.1);
      color: var(--primary);
      font-size: 0.625rem;
      font-weight: 700;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border: 1px solid rgba(13, 71, 161, 0.2);
    }

    .auth-layout.dark .brand-badge {
      background: rgba(59, 130, 246, 0.2);
      color: #93c5fd;
      border-color: rgba(59, 130, 246, 0.3);
    }

    /* Auth Card */
    .auth-card {
      margin-bottom: 3rem;
    }

    /* Footer */
    .auth-footer {
      text-align: center;
    }

    .footer-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: #9ca3af;
      margin-bottom: 0.5rem;
    }

    .footer-info .dot {
      margin: 0 0.25rem;
    }

    .copyright {
      font-size: 0.625rem;
      color: #9ca3af;
      margin: 0;
    }

    .auth-layout.dark .footer-info,
    .auth-layout.dark .copyright {
      color: #6b7280;
    }

    /* Right Panel - Showcase (Fixed) */
    .auth-showcase {
      display: none;
      position: fixed;
      top: 0;
      right: 0;
      width: 50%;
      height: 100vh;
      background: var(--surface-light);
      overflow: hidden;
    }

    .auth-layout.dark .auth-showcase {
      background: var(--surface-dark);
    }

    @media (min-width: 1024px) {
      .auth-showcase {
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .showcase-overlay {
      position: absolute;
      inset: 0;
      background: var(--primary);
      opacity: 0.03;
    }

    .auth-layout.dark .showcase-overlay {
      opacity: 0.05;
    }

    .showcase-pattern {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
      background-size: 30px 30px;
      opacity: 0.3;
    }

    .auth-layout.dark .showcase-pattern {
      background-image: radial-gradient(#475569 1px, transparent 1px);
      opacity: 0.2;
    }

    .showcase-gradient-1 {
      position: absolute;
      top: 0;
      right: 0;
      width: 800px;
      height: 800px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
      transform: translate(30%, -25%);
      filter: blur(100px);
    }

    .showcase-gradient-2 {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%);
      transform: translate(-25%, 25%);
      filter: blur(100px);
    }

    .showcase-content {
      position: relative;
      z-index: 10;
      max-width: 580px;
      padding: 3rem;
      width: 100%;
    }

    .showcase-header {
      margin-bottom: 2.5rem;
    }

    .showcase-header h2 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #111827;
      line-height: 1.2;
      letter-spacing: -0.025em;
      margin-bottom: 1.5rem;
    }

    .auth-layout.dark .showcase-header h2 {
      color: white;
    }

    .showcase-header .highlight {
      color: var(--primary);
      position: relative;
    }

    .showcase-header p {
      font-size: 1.125rem;
      color: #6b7280;
      line-height: 1.6;
      font-weight: 300;
    }

    .auth-layout.dark .showcase-header p {
      color: #9ca3af;
    }

    /* Features Grid */
    .features-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .feature-card {
      border-radius: 1rem;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .feature-card:hover {
      transform: translateY(-4px);
    }

    .feature-card.primary {
      height: 180px;
      position: relative;
    }

    .feature-card.small {
      background: white;
      padding: 1.25rem;
      border: 1px solid #e5e7eb;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
    }

    .auth-layout.dark .feature-card.small {
      background: #1e293b;
      border-color: #334155;
    }

    .feature-image {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .feature-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.7s ease;
    }

    .feature-card:hover .feature-image img {
      transform: scale(1.1);
    }

    .feature-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.1), transparent);
    }

    .feature-badge {
      position: absolute;
      top: 1rem;
      left: 1rem;
      right: 3rem;
      background: rgba(255,255,255,0.95);
      padding: 0.75rem;
      border-radius: 0.5rem;
      border-left: 4px solid var(--primary);
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .auth-layout.dark .feature-badge {
      background: rgba(30, 41, 59, 0.95);
    }

    .badge-header {
      font-size: 0.625rem;
      color: #6b7280;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }

    .badge-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: #111827;
    }

    .auth-layout.dark .badge-title {
      color: white;
    }

    .badge-time {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.25rem;
    }

    .feature-label {
      position: absolute;
      bottom: 1rem;
      left: 1rem;
      color: white;
      font-size: 0.75rem;
      font-weight: 500;
      opacity: 0.9;
    }

    .cupos-badge {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      background: rgba(255,255,255,0.95);
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.625rem;
      font-weight: 700;
      color: #111827;
      letter-spacing: 0.025em;
    }

    .cupos-badge svg {
      color: var(--primary);
    }

    .auth-layout.dark .cupos-badge {
      background: rgba(15, 23, 42, 0.95);
      color: white;
    }

    .feature-bottom {
      position: absolute;
      bottom: 1rem;
      left: 1rem;
      right: 1rem;
    }

    .feature-label-white {
      color: white;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .live-indicator {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      color: #d1d5db;
      font-size: 0.625rem;
      margin-top: 0.25rem;
    }

    .pulse {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #4ade80;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .feature-icon {
      width: 40px;
      height: 40px;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.75rem;
    }

    .feature-icon.blue {
      background: rgba(13, 71, 161, 0.1);
      color: var(--primary);
    }

    .feature-icon.green {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    .feature-card.small h3 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.25rem;
    }

    .auth-layout.dark .feature-card.small h3 {
      color: white;
    }

    .feature-card.small p {
      font-size: 0.75rem;
      color: #6b7280;
      line-height: 1.4;
      margin: 0;
    }

    /* Showcase Footer */
    .showcase-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .auth-layout.dark .showcase-footer {
      border-top-color: #334155;
    }

    .users-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .avatars {
      display: flex;
    }

    .avatars img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid white;
      margin-left: -8px;
      object-fit: cover;
    }

    .avatars img:first-child {
      margin-left: 0;
    }

    .auth-layout.dark .avatars img {
      border-color: #1e293b;
    }

    .avatar-count {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #f3f4f6;
      border: 2px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.625rem;
      font-weight: 700;
      color: #6b7280;
      margin-left: -8px;
    }

    .auth-layout.dark .avatar-count {
      background: #334155;
      border-color: #1e293b;
      color: #9ca3af;
    }

    .users-section > span {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .users-section strong {
      color: #111827;
      font-weight: 700;
    }

    .auth-layout.dark .users-section strong {
      color: white;
    }

    /* Animations */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes floatSlow {
      0%, 100% { transform: translate(30%, -25%); }
      50% { transform: translate(35%, -20%); }
    }

    @keyframes floatSlow2 {
      0%, 100% { transform: translate(-25%, 25%); }
      50% { transform: translate(-20%, 30%); }
    }

    .showcase-header {
      animation: fadeInUp 0.8s ease-out forwards;
    }

    .features-grid {
      animation: fadeInUp 0.8s ease-out 0.2s forwards;
      opacity: 0;
    }

    .feature-card:nth-child(1) {
      animation: fadeInUp 0.6s ease-out 0.3s forwards;
      opacity: 0;
    }

    .feature-card:nth-child(2) {
      animation: fadeInUp 0.6s ease-out 0.4s forwards;
      opacity: 0;
    }

    .feature-card:nth-child(3) {
      animation: fadeInUp 0.6s ease-out 0.5s forwards;
      opacity: 0;
    }

    .feature-card:nth-child(4) {
      animation: fadeInUp 0.6s ease-out 0.6s forwards;
      opacity: 0;
    }

    .showcase-footer {
      animation: fadeInUp 0.8s ease-out 0.7s forwards;
      opacity: 0;
    }

    .showcase-gradient-1 {
      animation: floatSlow 8s ease-in-out infinite;
    }

    .showcase-gradient-2 {
      animation: floatSlow2 10s ease-in-out infinite;
    }

    .feature-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    }
  `]
})
export class AuthLayoutComponent {
  currentYear = new Date().getFullYear();
  isDarkMode = signal(false);

  toggleTheme(): void {
    this.isDarkMode.update(v => !v);
  }
}
