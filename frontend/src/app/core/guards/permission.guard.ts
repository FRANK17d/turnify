import { inject } from '@angular/core';
import { Router, type CanActivateFn, type ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredPermissions = route.data['permissions'] as string[] | undefined;
  
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  const hasPermission = requiredPermissions.some(permission => 
    authService.hasPermission(permission)
  );

  if (hasPermission) {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};
