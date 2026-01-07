import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Plan {
  id: string;
  name: string;
  code: string;
  price: number;
  interval: 'MONTHLY' | 'YEARLY';
  features: Record<string, any>;
  limits: PlanLimits;
  isActive: boolean;
  stripePriceId?: string;
}

export interface PlanLimits {
  maxUsers: number;
  maxServices: number;
  maxBookingsPerMonth: number;
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  plan?: Plan;
  startDate?: string;
  endDate?: string;
  payments?: Payment[];
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  TRIALING = 'TRIALING',
  INCOMPLETE = 'INCOMPLETE',
}

export interface SubscriptionWithLimits {
  subscription: Subscription;
  usage: {
    users: { current: number; limit: number; percentage: number };
    services: { current: number; limit: number; percentage: number };
    bookings: { current: number; limit: number; percentage: number };
  };
  canCreateBooking: boolean;
  canCreateService: boolean;
  canCreateUser: boolean;
}

export interface Payment {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  invoiceUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionsService {
  private readonly apiUrl = `${environment.apiUrl}/subscriptions`;

  constructor(private http: HttpClient) {}

  // Obtener planes disponibles
  getPlans(): Observable<Plan[]> {
    return this.http.get<Plan[]>(`${this.apiUrl}/plans`);
  }

  // Obtener suscripción actual
  getCurrent(): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.apiUrl}/current`);
  }

  // Alias para getCurrent (usado por guards)
  getCurrentSubscription(): Observable<Subscription | null> {
    return this.http.get<Subscription>(`${this.apiUrl}/current`);
  }

  // Obtener suscripción con límites de uso
  getCurrentWithLimits(): Observable<SubscriptionWithLimits> {
    return this.http.get<SubscriptionWithLimits>(`${this.apiUrl}/current/details`);
  }

  // Crear checkout de Stripe
  createCheckout(planId: string): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.apiUrl}/checkout`, { planId });
  }

  // Crear portal de facturación
  createBillingPortal(): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.apiUrl}/billing-portal`, {});
  }

  // Cancelar suscripción
  cancel(immediately = false): Observable<Subscription> {
    return this.http.post<Subscription>(`${this.apiUrl}/cancel`, { immediately });
  }

  // Reanudar suscripción
  resume(): Observable<Subscription> {
    return this.http.post<Subscription>(`${this.apiUrl}/resume`, {});
  }

  // Cambiar plan
  changePlan(planId: string): Observable<Subscription> {
    return this.http.post<Subscription>(`${this.apiUrl}/change-plan`, { planId });
  }

  // Historial de pagos
  getPaymentHistory(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.apiUrl}/payments`);
  }
}
