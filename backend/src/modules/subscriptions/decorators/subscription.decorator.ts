import { SetMetadata } from '@nestjs/common';

export const SUBSCRIPTION_KEY = 'subscription';

export type ResourceType = 'users' | 'services' | 'bookings';

export interface SubscriptionRequirement {
  plans?: string[];          // Planes permitidos (FREE, PRO)
  feature?: string;          // Feature específico requerido
  checkLimits?: boolean;     // Verificar límites del plan
  resource?: ResourceType;   // Tipo de recurso para verificar límite
}

// Decorador para requerir suscripción activa
export const RequireSubscription = (requirement?: SubscriptionRequirement) =>
  SetMetadata(SUBSCRIPTION_KEY, requirement || { checkLimits: false });

// Decorador para requerir plan PRO
export const RequirePro = () =>
  SetMetadata(SUBSCRIPTION_KEY, { plans: ['PRO'] });

// Decorador para verificar límites según el tipo de recurso
export const CheckPlanLimits = (resource: ResourceType) =>
  SetMetadata(SUBSCRIPTION_KEY, { checkLimits: true, resource });
