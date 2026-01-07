import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'tenants',
    loadComponent: () => import('./tenants-list/tenants-list.component')
      .then(m => m.TenantsListComponent),
    data: { roles: ['SUPER_ADMIN'] },
    canActivate: [permissionGuard],
  },
  {
    path: 'tenants/:id',
    loadComponent: () => import('./tenant-detail/tenant-detail.component')
      .then(m => m.TenantDetailComponent),
    data: { roles: ['SUPER_ADMIN'] },
    canActivate: [permissionGuard],
  },
  {
    path: 'plans',
    loadComponent: () => import('./plans/plans.component')
      .then(m => m.PlansComponent),
    data: { roles: ['SUPER_ADMIN'] },
    canActivate: [permissionGuard],
  },
  {
    path: 'reports',
    loadComponent: () => import('./reports/reports.component')
      .then(m => m.ReportsComponent),
    data: { roles: ['SUPER_ADMIN'] },
    canActivate: [permissionGuard],
  },
];
