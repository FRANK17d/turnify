import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceDto {
  name: string;
  description?: string;
  price: number;
  duration: number;
  isActive?: boolean;
}

export interface UpdateServiceDto {
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ServicesService {
  private readonly apiUrl = `${environment.apiUrl}/services`;

  constructor(private http: HttpClient) {}

  // Servicios públicos (para clientes)
  findAllPublic(): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.apiUrl}/public`);
  }

  // Todos los servicios (admin)
  findAll(): Observable<Service[]> {
    return this.http.get<Service[]>(this.apiUrl);
  }

  findOne(id: string): Observable<Service> {
    return this.http.get<Service>(`${this.apiUrl}/${id}`);
  }

  create(service: CreateServiceDto): Observable<Service> {
    return this.http.post<Service>(this.apiUrl, service);
  }

  update(id: string, service: UpdateServiceDto): Observable<Service> {
    return this.http.put<Service>(`${this.apiUrl}/${id}`, service);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
