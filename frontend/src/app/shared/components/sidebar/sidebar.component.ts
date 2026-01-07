import { Component, inject, computed, Input, Output, EventEmitter, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../../core/services/auth.service';
import { BrandingService } from '../../../core/services/branding.service';

interface NavItem {
  label: string;
  icon: SafeHtml;
  route: string;
  permissions?: string[];
  roles?: string[];
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()" [class.mobile-open]="mobileOpen" [style.--brand-color]="brandingService.branding().primaryColor">
      <div class="sidebar-header">
        <img src="assets/logo.png" alt="Turnify" class="sidebar-logo" />
        <span class="sidebar-title">Turnify</span>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section">
          <span class="nav-section-title">Principal</span>
          @for (item of mainNavItems(); track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
              class="nav-item"
              (click)="onNavClick()"
            >
              <span class="nav-icon" [innerHTML]="item.icon"></span>
              <span class="nav-label">{{ item.label }}</span>
              @if (item.badge && item.badge > 0) {
                <span class="nav-badge">{{ item.badge }}</span>
              }
            </a>
          }
        </div>

        @if (managementNavItems().length > 0) {
          <div class="nav-section">
            <span class="nav-section-title">Gestión</span>
            @for (item of managementNavItems(); track item.route) {
              <a
                [routerLink]="item.route"
                routerLinkActive="active"
                class="nav-item"
                (click)="onNavClick()"
              >
                <span class="nav-icon" [innerHTML]="item.icon"></span>
                <span class="nav-label">{{ item.label }}</span>
              </a>
            }
          </div>
        }

        @if (adminNavItems().length > 0) {
          <div class="nav-section">
            <span class="nav-section-title">Administración</span>
            @for (item of adminNavItems(); track item.route) {
              <a
                [routerLink]="item.route"
                routerLinkActive="active"
                class="nav-item"
                (click)="onNavClick()"
              >
                <span class="nav-icon" [innerHTML]="item.icon"></span>
                <span class="nav-label">{{ item.label }}</span>
              </a>
            }
          </div>
        }

        @if (isSuperAdmin()) {
          <div class="nav-section">
            <span class="nav-section-title">Super Admin</span>
            @for (item of superAdminNavItems(); track item.route) {
              <a
                [routerLink]="item.route"
                routerLinkActive="active"
                class="nav-item"
                (click)="onNavClick()"
              >
                <span class="nav-icon" [innerHTML]="item.icon"></span>
                <span class="nav-label">{{ item.label }}</span>
              </a>
            }
          </div>
        }
      </nav>

      <!-- Plan info -->
      @if (isAdmin()) {
        <div class="sidebar-footer">
          <div class="plan-info" [class]="'plan-' + currentPlan().toLowerCase()">
            <span class="plan-badge">{{ currentPlan() }}</span>
            @if (currentPlan() === 'FREE') {
              <a routerLink="/settings/subscription" class="upgrade-link">
                Actualizar plan
              </a>
            }
          </div>
        </div>
      }

      <!-- Collapse button (desktop) -->
      <button class="collapse-btn" (click)="toggleCollapse()">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          @if (collapsed()) {
            <polyline points="9 18 15 12 9 6"></polyline>
          } @else {
            <polyline points="15 18 9 12 15 6"></polyline>
          }
        </svg>
      </button>
    </aside>

    @if (mobileOpen) {
      <div class="sidebar-overlay" (click)="closeMobile.emit()"></div>
    }
  `,
  styles: [`
    .sidebar {
      width: 260px;
      height: 100%;
      background: white;
      border-right: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      position: relative;
      transition: width 0.2s ease;
    }

    .sidebar-header {
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .sidebar-logo {
      width: 36px;
      height: auto;
    }

    .sidebar-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--brand-color, #3b82f6);
    }

    .sidebar.collapsed {
      width: 72px;
    }

    .sidebar.collapsed .nav-label,
    .sidebar.collapsed .nav-section-title,
    .sidebar.collapsed .nav-badge,
    .sidebar.collapsed .plan-info,
    .sidebar.collapsed .sidebar-footer,
    .sidebar.collapsed .sidebar-title {
      display: none;
    }

    .sidebar.collapsed .sidebar-header {
      justify-content: center;
      padding: 1rem;
    }

    .sidebar.collapsed .nav-item {
      justify-content: center;
      padding: 0.75rem;
    }

    .sidebar.collapsed .nav-icon {
      margin: 0;
    }

    @media (max-width: 768px) {
      .sidebar {
        position: fixed;
        left: 0;
        top: 64px;
        height: calc(100% - 64px);
        z-index: 200;
        transform: translateX(-100%);
      }

      .sidebar.mobile-open {
        transform: translateX(0);
      }

      .sidebar.collapsed {
        width: 260px;
      }

      .collapse-btn {
        display: none;
      }
    }

    .sidebar-overlay {
      position: fixed;
      inset: 0;
      top: 64px;
      background: rgba(0, 0, 0, 0.5);
      z-index: 199;
    }

    .sidebar-nav {
      flex: 1;
      padding: 1rem 0;
      overflow-y: auto;
    }

    .nav-section {
      margin-bottom: 1.5rem;
    }

    .nav-section-title {
      display: block;
      padding: 0 1.25rem;
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #9ca3af;
      margin-bottom: 0.5rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 1.25rem;
      color: #6b7280;
      text-decoration: none;
      font-size: 0.875rem;
      transition: all 0.15s;
      margin: 0.125rem 0.5rem;
      border-radius: 0.5rem;
    }

    .nav-item:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .nav-item.active {
      background: color-mix(in srgb, var(--brand-color, #3b82f6) 15%, transparent);
      color: var(--brand-color, #3b82f6);
    }

    .nav-icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav-icon :global(svg) {
      width: 100%;
      height: 100%;
    }

    .nav-label {
      flex: 1;
    }

    .nav-badge {
      background: #ef4444;
      color: white;
      font-size: 0.625rem;
      font-weight: 600;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
    }

    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    .plan-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: center;
      padding: 0.75rem;
      border-radius: 0.5rem;
      background: #f9fafb;
    }

    .plan-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
    }

    .plan-free .plan-badge {
      background: #e5e7eb;
      color: #4b5563;
    }

    .plan-pro .plan-badge {
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      color: white;
    }

    .plan-enterprise .plan-badge {
      background: linear-gradient(135deg, #f59e0b, #ea580c);
      color: white;
    }

    .upgrade-link {
      font-size: 0.75rem;
      color: #3b82f6;
      text-decoration: none;
    }

    .upgrade-link:hover {
      text-decoration: underline;
    }

    .collapse-btn {
      position: absolute;
      right: -12px;
      top: 50%;
      transform: translateY(-50%);
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: white;
      border: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #6b7280;
      transition: all 0.15s;
      z-index: 10;
    }

    .collapse-btn:hover {
      background: #f3f4f6;
      color: #374151;
    }
  `]
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  brandingService = inject(BrandingService);

  // Convert currentUser$ observable to signal for reactive change detection
  private currentUser = toSignal(this.authService.currentUser$, { initialValue: null });

  @Input() mobileOpen = false;
  @Output() closeMobile = new EventEmitter<void>();

  collapsed = signal(false);

  // Use computed signal for isSuperAdmin to prevent NG0100 errors
  isSuperAdmin = computed(() => {
    const user = this.currentUser();
    return user?.roles?.includes('SUPER_ADMIN') ?? false;
  });

  // Iconos SVG raw strings
  private iconStrings = {
    dashboard: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>`,
    calendar: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
    services: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>`,
    users: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
    reports: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
    settings: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
    audit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    tenants: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
    plans: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>`,
    notifications: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`,
  };

  // Método para sanitizar iconos
  private safeIcon(key: keyof typeof this.iconStrings): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.iconStrings[key]);
  }

  // Navegación principal (todos los usuarios autenticados)
  mainNavItems = computed<NavItem[]>(() => {
    const items: NavItem[] = [
      { label: 'Dashboard', icon: this.safeIcon('dashboard'), route: '/dashboard' },
      { label: 'Reservas', icon: this.safeIcon('calendar'), route: '/bookings' },
      { label: 'Notificaciones', icon: this.safeIcon('notifications'), route: '/notifications' },
    ];
    return items;
  });

  // Gestión (requiere permisos específicos)
  managementNavItems = computed<NavItem[]>(() => {
    const items: NavItem[] = [];
    const user = this.currentUser();

    if (user?.permissions?.includes('MANAGE_SERVICES') || user?.permissions?.includes('VIEW_SERVICES')) {
      items.push({ label: 'Servicios', icon: this.safeIcon('services'), route: '/services' });
    }

    if (user?.permissions?.includes('MANAGE_USERS')) {
      items.push({ label: 'Usuarios', icon: this.safeIcon('users'), route: '/users' });
    }

    if (user?.permissions?.includes('VIEW_REPORTS')) {
      items.push({ label: 'Reportes', icon: this.safeIcon('reports'), route: '/reports' });
    }

    return items;
  });

  // Administración (ADMIN_EMPRESA)
  adminNavItems = computed<NavItem[]>(() => {
    const items: NavItem[] = [];
    const user = this.currentUser();
    const isAdmin = user?.roles?.includes('ADMIN_EMPRESA') || user?.roles?.includes('SUPER_ADMIN');

    if (isAdmin) {
      items.push({ label: 'Configuración', icon: this.safeIcon('settings'), route: '/settings' });
      items.push({ label: 'Auditoría', icon: this.safeIcon('audit'), route: '/audit' });
    }

    return items;
  });

  // Super Admin
  superAdminNavItems = computed<NavItem[]>(() => [
    { label: 'Tenants', icon: this.safeIcon('tenants'), route: '/admin/tenants' },
    { label: 'Planes', icon: this.safeIcon('plans'), route: '/admin/plans' },
    { label: 'Reportes Globales', icon: this.safeIcon('reports'), route: '/admin/reports' },
  ]);

  currentPlan = computed(() => {
    const user = this.currentUser();
    // Super Admin always has Enterprise plan
    if (user?.roles?.includes('SUPER_ADMIN')) {
      return 'ENTERPRISE';
    }
    // TODO: For other users, fetch from subscription service
    return 'FREE';
  });

  isAdmin = computed(() => {
    const user = this.currentUser();
    return user?.roles?.includes('ADMIN_EMPRESA') || user?.roles?.includes('SUPER_ADMIN');
  });

  // isSuperAdmin is now a computed signal defined above

  hasRole(role: string): boolean {
    const user = this.currentUser();
    return user?.roles?.includes(role) ?? false;
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUser();
    return user?.permissions?.includes(permission) ?? false;
  }

  toggleCollapse(): void {
    this.collapsed.update(v => !v);
  }

  onNavClick(): void {
    // Cerrar menú móvil al navegar
    if (this.mobileOpen) {
      this.closeMobile.emit();
    }
  }
}
