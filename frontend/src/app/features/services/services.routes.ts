import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const SERVICES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./services-list/services-list.component')
      .then(m => m.ServicesListComponent),
    data: { permissions: ['VIEW_SERVICES'] },
    canActivate: [permissionGuard],
  },
  {
    path: 'new',
    loadComponent: () => import('./service-form/service-form.component')
      .then(m => m.ServiceFormComponent),
    data: { permissions: ['MANAGE_SERVICES'] },
    canActivate: [permissionGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./service-form/service-form.component')
      .then(m => m.ServiceFormComponent),
    data: { permissions: ['MANAGE_SERVICES'] },
    canActivate: [permissionGuard],
  },
];
