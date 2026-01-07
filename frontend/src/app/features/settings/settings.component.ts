import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  template: `
    <div class="settings-page">
      <header class="page-header">
        <h1 class="page-title">Configuración</h1>
        <p class="page-subtitle">Administra la configuración de tu empresa</p>
      </header>

      <div class="settings-layout">
        <nav class="settings-nav">
          <a routerLink="/settings/general" routerLinkActive="active" class="nav-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6m0-12l-4-4m4 4l4-4m-4 12l-4 4m4-4l4 4"></path>
            </svg>
            General
          </a>
          <a routerLink="/settings/branding" routerLinkActive="active" class="nav-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            Marca & Apariencia
          </a>
          <a routerLink="/settings/subscription" routerLinkActive="active" class="nav-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
            Suscripción
          </a>
          <a routerLink="/settings/security" routerLinkActive="active" class="nav-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            Seguridad
          </a>
        </nav>

        <div class="settings-content">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-page {
      max-width: 1200px;
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

    .settings-layout {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 1.5rem;
    }

    .settings-nav {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      color: #6b7280;
      text-decoration: none;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.15s;
    }

    .nav-item:hover {
      background: #f3f4f6;
      color: #111827;
    }

    .nav-item.active {
      background: #eff6ff;
      color: #2563eb;
    }

    .settings-content {
      min-height: 400px;
    }

    @media (max-width: 768px) {
      .settings-layout {
        grid-template-columns: 1fr;
      }

      .settings-nav {
        flex-direction: row;
        overflow-x: auto;
      }
    }
  `]
})
export class SettingsComponent {}
