import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  roles: string[];
  permissions: string[];
  tenant: {
    id: string;
    name: string;
    logo?: string;
    primaryColor?: string;
    plan?: string;
  };
  preferences: NotificationPreferences;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  bookingReminders: boolean;
  subscriptionAlerts: boolean;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface Session {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  createdAt: string;
  expiresAt: string;
}

// Mapped session for frontend display
export interface SessionDisplay {
  id: string;
  device: string;
  ip: string;
  lastUsed: string;
  createdAt: string;
  isCurrent: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly apiUrl = `${environment.apiUrl}/profile`;
  private readonly authUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) { }

  // Perfil
  getProfile(): Observable<Profile> {
    return this.http.get<Profile>(this.apiUrl);
  }

  updateProfile(data: UpdateProfileDto): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(this.apiUrl, data);
  }

  // Contraseña
  changePassword(data: ChangePasswordDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/change-password`, data);
  }

  // Preferencias de notificación
  getNotificationPreferences(): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>(`${this.apiUrl}/notification-preferences`);
  }

  updateNotificationPreferences(
    prefs: Partial<NotificationPreferences>
  ): Observable<{ message: string; preferences: NotificationPreferences }> {
    return this.http.put<{ message: string; preferences: NotificationPreferences }>(
      `${this.apiUrl}/notification-preferences`,
      prefs
    );
  }

  // Sesiones
  getSessions(): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.authUrl}/sessions`);
  }

  revokeSession(sessionId: string): Observable<void> {
    return this.http.delete<void>(`${this.authUrl}/sessions/${sessionId}`);
  }

  revokeAllSessions(): Observable<void> {
    return this.http.post<void>(`${this.authUrl}/logout-all`, {});
  }
}
