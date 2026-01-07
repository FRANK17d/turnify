import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Booking {
  id: string;
  userId: string;
  serviceId: string;
  tenantId: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  notes?: string;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
  service?: BookingServiceInfo;
  user?: any;
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

export interface BookingServiceInfo {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  isActive: boolean;
  tenantId: string;
}

export interface CreateBookingDto {
  serviceId: string;
  startTime: string;
  notes?: string;
}

export interface UpdateBookingDto {
  startTime?: string;
  status?: BookingStatus;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingsService {
  private readonly apiUrl = `${environment.apiUrl}/bookings`;

  constructor(private http: HttpClient) {}

  // Admin: todas las reservas del tenant
  findAll(): Observable<Booking[]> {
    return this.http.get<Booking[]>(this.apiUrl);
  }

  // Cliente: mis reservas
  findMyBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/my`);
  }

  // Reservas por rango de fechas
  findByDateRange(start: Date, end: Date): Observable<Booking[]> {
    const params = new HttpParams()
      .set('start', start.toISOString())
      .set('end', end.toISOString());
    return this.http.get<Booking[]>(`${this.apiUrl}/date-range`, { params });
  }

  findOne(id: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.apiUrl}/${id}`);
  }

  create(booking: CreateBookingDto): Observable<Booking> {
    return this.http.post<Booking>(this.apiUrl, booking);
  }

  update(id: string, booking: UpdateBookingDto): Observable<Booking> {
    return this.http.put<Booking>(`${this.apiUrl}/${id}`, booking);
  }

  cancel(id: string): Observable<Booking> {
    return this.http.put<Booking>(`${this.apiUrl}/${id}/cancel`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
