import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { BrandingService } from '../../core/services/branding.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    ToastComponent,
    LoadingComponent
  ],
  template: `
    <div class="layout">
      <app-header (toggleSidebar)="toggleSidebar()" />
      <div class="layout-body">
        <app-sidebar
          [mobileOpen]="sidebarMobileOpen()"
          (closeMobile)="closeSidebar()"
        />
        <main class="main-content">
          <router-outlet />
        </main>
      </div>
    </div>
    <app-toast />
    <app-loading />
  `,
  styles: [`
    .layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--bg-secondary, #f9fafb);
    }

    .layout-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }

    @media (max-width: 768px) {
      .main-content {
        padding: 1rem;
      }
    }
  `]
})
export class MainLayoutComponent implements OnInit {
  private brandingService = inject(BrandingService);

  sidebarMobileOpen = signal(false);

  ngOnInit(): void {
    // Load tenant branding (colors, logo) on layout init
    this.brandingService.loadBranding();
  }

  toggleSidebar(): void {
    this.sidebarMobileOpen.update(v => !v);
  }

  closeSidebar(): void {
    this.sidebarMobileOpen.set(false);
  }
}
