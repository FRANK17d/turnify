import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Notification {
  id: string;
  userId: string;
  tenantId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export enum NotificationType {
  BOOKING_CREATED = 'BOOKING_CREATED',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_CANCELED = 'BOOKING_CANCELED',
  BOOKING_REMINDER = 'BOOKING_REMINDER',
  SUBSCRIPTION_EXPIRING = 'SUBSCRIPTION_EXPIRING',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
  SUBSCRIPTION_UPDATED = 'SUBSCRIPTION_UPDATED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  SYSTEM = 'SYSTEM',
}

export interface PaginatedNotifications {
  data: Notification[];
  total: number;
  limit: number;
  offset: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  // Eventos para sincronización
  notificationRead$ = new Subject<string>();
  allNotificationsRead$ = new Subject<void>();
  notificationNew$ = new Subject<Notification>(); // Para conectar con WS si se quiere centralizar

  constructor(private http: HttpClient) { }

  findAll(limit = 50, offset = 0): Observable<PaginatedNotifications> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());
    return this.http.get<PaginatedNotifications>(this.apiUrl, { params });
  }

  findUnread(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/unread`);
  }

  countUnread(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/unread/count`);
  }

  findOne(id: string): Observable<Notification> {
    return this.http.get<Notification>(`${this.apiUrl}/${id}`);
  }

  markAsRead(id: string): Observable<Notification> {
    return this.http.put<Notification>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => this.notificationRead$.next(id))
    );
  }

  markMultipleAsRead(ids: string[]): Observable<{ updated: number }> {
    return this.http.post<{ updated: number }>(`${this.apiUrl}/mark-read`, { ids }).pipe(
      tap(() => ids.forEach(id => this.notificationRead$.next(id)))
    );
  }

  markAllAsRead(): Observable<{ updated: number }> {
    return this.http.post<{ updated: number }>(`${this.apiUrl}/mark-all-read`, {}).pipe(
      tap(() => this.allNotificationsRead$.next())
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  clearRead(): Observable<{ deleted: number }> {
    return this.http.delete<{ deleted: number }>(`${this.apiUrl}/clear/read`);
  }

}
