import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SubscriptionsService, Subscription } from '../services/subscriptions.service';
import { ToastService } from '../../shared/services/toast.service';
import { map, catchError, of } from 'rxjs';

export const subscriptionGuard: CanActivateFn = (route, state) => {
  const subscriptionsService = inject(SubscriptionsService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  const requiredPlan = route.data['plan'] as string | undefined;

  return subscriptionsService.getCurrentSubscription().pipe(
    map((subscription: Subscription | null) => {
      if (!subscription) {
        toastService.warning('Suscripción requerida', 'Necesitas una suscripción activa');
        router.navigate(['/settings/subscription']);
        return false;
      }

      // Verificar estado de la suscripción
      if (subscription.status === 'PAST_DUE' || subscription.status === 'CANCELED') {
        toastService.error(
          'Suscripción vencida',
          'Tu suscripción ha vencido. Actualiza tu plan para continuar.'
        );
        router.navigate(['/settings/subscription']);
        return false;
      }

      // Verificar plan requerido
      if (requiredPlan && subscription.plan?.code !== requiredPlan) {
        toastService.warning(
          'Plan superior requerido',
          `Esta función requiere el plan ${requiredPlan}`
        );
        router.navigate(['/settings/subscription']);
        return false;
      }

      return true;
    }),
    catchError(() => {
      router.navigate(['/dashboard']);
      return of(false);
    })
  );
};
