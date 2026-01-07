import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./users-list/users-list.component')
      .then(m => m.UsersListComponent),
    data: { permissions: ['MANAGE_USERS'] },
    canActivate: [permissionGuard],
  },
  {
    path: 'new',
    loadComponent: () => import('./user-form/user-form.component')
      .then(m => m.UserFormComponent),
    data: { permissions: ['MANAGE_USERS'] },
    canActivate: [permissionGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./user-form/user-form.component')
      .then(m => m.UserFormComponent),
    data: { permissions: ['MANAGE_USERS'] },
    canActivate: [permissionGuard],
  },
];
