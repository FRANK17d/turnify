import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SUBSCRIPTION_KEY, SubscriptionRequirement, ResourceType } from '../decorators/subscription.decorator';
import { SubscriptionsService } from '../services/subscriptions.service';
import { SubscriptionStatus } from '../entities/subscription.entity';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<SubscriptionRequirement>(
      SUBSCRIPTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay requisito de suscripción, permitir
    if (!requirement) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.tenantId) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Obtener suscripción activa del tenant
    let subscription;
    try {
      subscription = await this.subscriptionsService.getCurrentSubscription(user.tenantId);
    } catch {
      throw new ForbiddenException('No tienes una suscripción activa');
    }

    // Verificar estado de suscripción
    if (subscription.status === SubscriptionStatus.CANCELED) {
      throw new ForbiddenException(
        'Tu suscripción ha sido cancelada. Por favor, renueva tu plan para continuar.',
      );
    }

    if (subscription.status === SubscriptionStatus.PAST_DUE) {
      // En modo PAST_DUE, solo permitir lectura
      const method = request.method;
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        throw new ForbiddenException(
          'Tu suscripción tiene pagos pendientes. Por favor, actualiza tu método de pago para realizar esta acción.',
        );
      }
    }

    // Verificar plan específico requerido
    if (requirement.plans && requirement.plans.length > 0) {
      if (!requirement.plans.includes(subscription.plan.name)) {
        throw new ForbiddenException(
          `Esta función requiere el plan ${requirement.plans.join(' o ')}. Tu plan actual es ${subscription.plan.name}.`,
        );
      }
    }

    // Verificar feature específico
    if (requirement.feature && subscription.plan.features) {
      if (!subscription.plan.features[requirement.feature]) {
        throw new ForbiddenException(
          `Tu plan no incluye la función "${requirement.feature}". Actualiza a un plan superior.`,
        );
      }
    }

    // Verificar límites del plan
    if (requirement.checkLimits && requirement.resource) {
      await this.checkPlanLimits(user.tenantId, requirement.resource);
    }

    // Agregar info de suscripción al request
    request.subscription = subscription;

    return true;
  }

  private async checkPlanLimits(
    tenantId: string,
    resource: ResourceType,
  ): Promise<void> {
    const result = await this.subscriptionsService.checkPlanLimit(tenantId, resource);

    if (!result.allowed) {
      const resourceNames: Record<ResourceType, string> = {
        users: 'usuarios',
        services: 'servicios',
        bookings: 'reservas mensuales',
      };

      throw new ForbiddenException(
        `Has alcanzado el límite de ${result.limit} ${resourceNames[resource]} de tu plan ${result.planName}. Actualiza tu plan para agregar más.`,
      );
    }
  }
}
