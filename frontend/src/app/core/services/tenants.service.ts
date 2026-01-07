import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  primaryColor?: string;
  isActive: boolean;
  status: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  usersCount?: number;
  bookingsCount?: number;
  servicesCount?: number;
  subscription?: {
    plan: string;
    status: string;
  };
  _count?: {
    users: number;
    services: number;
    bookings: number;
  };
}

export interface TenantDetail extends Tenant {
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  users: any[];
  services: any[];
  bookings: any[];
  settings?: {
    timezone?: string;
  };
  subscriptionDetail?: {
    id: string;
    plan: { name: string };
    status: string;
    startDate: string;
    endDate?: string;
  };
}

export interface UpdateTenantDto {
  name?: string;
  logo?: string;
  primaryColor?: string;
  timezone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TenantsService {
  private readonly apiUrl = `${environment.apiUrl}/tenants`;

  constructor(private http: HttpClient) {}

  // Obtener tenant actual
  getMyTenant(): Observable<Tenant> {
    return this.http.get<Tenant>(`${this.apiUrl}/me`);
  }

  // Actualizar tenant actual
  updateMyTenant(tenant: UpdateTenantDto): Observable<Tenant> {
    return this.http.put<Tenant>(`${this.apiUrl}/me`, tenant);
  }

  // Super Admin: listar todos
  findAll(): Observable<Tenant[]> {
    return this.http.get<Tenant[]>(this.apiUrl);
  }

  findOne(id: string): Observable<TenantDetail> {
    return this.http.get<TenantDetail>(`${this.apiUrl}/${id}`);
  }

  updateStatus(id: string, status: string): Observable<Tenant> {
    return this.http.put<Tenant>(`${this.apiUrl}/${id}/status`, { status });
  }

  // Obtener tenant actual para settings
  getCurrentTenant(): Observable<Tenant> {
    return this.http.get<Tenant>(`${this.apiUrl}/me`);
  }

  // Actualizar configuración del tenant
  updateSettings(data: Partial<Tenant>): Observable<Tenant> {
    return this.http.put<Tenant>(`${this.apiUrl}/me/settings`, data);
  }
}
