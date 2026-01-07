import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const BOOKINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./bookings-list/bookings-list.component')
      .then(m => m.BookingsListComponent),
  },
  {
    path: 'new',
    loadComponent: () => import('./booking-form/booking-form.component')
      .then(m => m.BookingFormComponent),
    data: { permissions: ['CREATE_BOOKING'] },
    canActivate: [permissionGuard],
  },
  {
    path: ':id',
    loadComponent: () => import('./booking-detail/booking-detail.component')
      .then(m => m.BookingDetailComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./booking-form/booking-form.component')
      .then(m => m.BookingFormComponent),
    data: { permissions: ['CREATE_BOOKING'] },
    canActivate: [permissionGuard],
  },
];
