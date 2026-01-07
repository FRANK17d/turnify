import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./settings.component')
      .then(m => m.SettingsComponent),
    data: { permissions: ['MANAGE_SETTINGS'] },
    canActivate: [permissionGuard],
    children: [
      {
        path: 'general',
        loadComponent: () => import('./settings-general/settings-general.component')
          .then(m => m.SettingsGeneralComponent),
      },
      {
        path: 'branding',
        loadComponent: () => import('./settings-branding/settings-branding.component')
          .then(m => m.SettingsBrandingComponent),
      },
      {
        path: 'subscription',
        loadComponent: () => import('./settings-subscription/settings-subscription.component')
          .then(m => m.SettingsSubscriptionComponent),
      },
      {
        path: 'security',
        loadComponent: () => import('./settings-security/settings-security.component')
          .then(m => m.SettingsSecurityComponent),
      },
      { path: '', redirectTo: 'general', pathMatch: 'full' },
    ],
  },
];
