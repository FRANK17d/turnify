import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService, Session, SessionDisplay } from '../../../core/services/profile.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-settings-security',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConfirmDialogComponent],
  template: `
    <div class="settings-section">
      <h2 class="section-title">Seguridad</h2>
      <p class="section-description">Gestiona la seguridad de tu cuenta</p>

      <!-- Cambio de contraseña -->
      <div class="security-card">
        <h3 class="card-title">Cambiar contraseña</h3>
        <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="password-form">
          <div class="form-group">
            <label for="currentPassword" class="form-label">Contraseña actual *</label>
            <div class="password-input">
              <input
                [type]="showCurrentPassword() ? 'text' : 'password'"
                id="currentPassword"
                formControlName="currentPassword"
                class="form-input"
                [class.error]="showError('currentPassword')"
              />
              <button type="button" class="toggle-password" (click)="showCurrentPassword.set(!showCurrentPassword())">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  @if (showCurrentPassword()) {
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  } @else {
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  }
                </svg>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="newPassword" class="form-label">Nueva contraseña *</label>
            <div class="password-input">
              <input
                [type]="showNewPassword() ? 'text' : 'password'"
                id="newPassword"
                formControlName="newPassword"
                class="form-input"
                [class.error]="showError('newPassword')"
              />
              <button type="button" class="toggle-password" (click)="showNewPassword.set(!showNewPassword())">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  @if (showNewPassword()) {
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  } @else {
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  }
                </svg>
              </button>
            </div>
            @if (showError('newPassword')) {
              <span class="form-error">La contraseña debe tener al menos 6 caracteres</span>
            }
          </div>

          <div class="form-group">
            <label for="confirmPassword" class="form-label">Confirmar nueva contraseña *</label>
            <input
              type="password"
              id="confirmPassword"
              formControlName="confirmPassword"
              class="form-input"
              [class.error]="showError('confirmPassword')"
            />
            @if (passwordForm.hasError('passwordMismatch') && passwordForm.get('confirmPassword')?.touched) {
              <span class="form-error">Las contraseñas no coinciden</span>
            }
          </div>

          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="passwordForm.invalid || isChangingPassword()"
          >
            @if (isChangingPassword()) {
              <span class="spinner"></span>
              Cambiando...
            } @else {
              Cambiar contraseña
            }
          </button>
        </form>
      </div>

      <!-- Sesiones activas -->
      <div class="security-card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Sesiones activas</h3>
            <p class="card-description">Dispositivos donde has iniciado sesión</p>
          </div>
          <button class="btn btn-danger-outline btn-sm" (click)="showLogoutAllDialog.set(true)">
            Cerrar todas las sesiones
          </button>
        </div>

        @if (isLoadingSessions()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando sesiones...</p>
          </div>
        } @else if (sessions().length === 0) {
          <div class="empty-state">
            <p>No hay sesiones activas</p>
          </div>
        } @else {
          <div class="sessions-list">
            @for (session of sessions(); track session.id) {
              <div class="session-item" [class.current]="session.isCurrent">
                <div class="session-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                </div>
                <div class="session-info">
                  <div class="session-device">
                    {{ session.device }}
                    @if (session.isCurrent) {
                      <span class="current-badge">Actual</span>
                    }
                  </div>
                  <div class="session-details">
                    <span>IP: {{ session.ip }}</span>
                    <span>Última actividad: {{ session.lastUsed | date:'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                </div>
                @if (!session.isCurrent) {
                  <button
                    class="btn btn-ghost btn-sm"
                    (click)="revokeSession(session)"
                  >
                    Cerrar sesión
                  </button>
                }
              </div>
            }
          </div>
        }
      </div>

      <app-confirm-dialog
        [isOpen]="showLogoutAllDialog()"
        title="Cerrar todas las sesiones"
        message="¿Estás seguro de que deseas cerrar sesión en todos los dispositivos? Deberás iniciar sesión nuevamente."
        confirmText="Sí, cerrar todas"
        cancelText="Cancelar"
        type="danger"
        (confirm)="logoutAllDevices()"
        (cancel)="showLogoutAllDialog.set(false)"
      />
    </div>
  `,
  styles: [`
    .settings-section {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .section-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 0.25rem 0;
    }

    .section-description {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0;
    }

    .security-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      padding: 1.5rem;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .card-title {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 0.25rem 0;
    }

    .card-description {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0;
    }

    .password-form {
      max-width: 400px;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.375rem;
    }

    .password-input {
      position: relative;
    }

    .form-input {
      width: 100%;
      padding: 0.625rem 2.5rem 0.625rem 0.875rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .form-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-input.error {
      border-color: #ef4444;
    }

    .toggle-password {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      padding: 0;
    }

    .form-error {
      font-size: 0.75rem;
      color: #ef4444;
      margin-top: 0.25rem;
      display: block;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.75rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-danger-outline {
      background: white;
      border: 1px solid #ef4444;
      color: #ef4444;
    }

    .btn-ghost {
      background: transparent;
      color: #6b7280;
    }

    .btn-ghost:hover {
      background: #f3f4f6;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 2rem;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .sessions-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .session-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
    }

    .session-item.current {
      background: #eff6ff;
      border-color: #3b82f6;
    }

    .session-icon {
      color: #6b7280;
    }

    .session-info {
      flex: 1;
    }

    .session-device {
      font-size: 0.875rem;
      font-weight: 500;
      color: #111827;
      margin-bottom: 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .current-badge {
      font-size: 0.625rem;
      font-weight: 600;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      background: #3b82f6;
      color: white;
    }

    .session-details {
      font-size: 0.75rem;
      color: #6b7280;
      display: flex;
      gap: 1rem;
    }
  `]
})
export class SettingsSecurityComponent {
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  passwordForm: FormGroup;
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  isChangingPassword = signal(false);

  sessions = signal<SessionDisplay[]>([]);
  isLoadingSessions = signal(false);
  showLogoutAllDialog = signal(false);

  // Store current token for comparison
  private currentRefreshToken = localStorage.getItem('refreshToken');

  constructor() {
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });

    this.loadSessions();
  }

  private passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { passwordMismatch: true };
  }

  showError(field: string): boolean {
    const control = this.passwordForm.get(field);
    return !!(control?.invalid && control?.touched);
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isChangingPassword.set(true);

    const data = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword,
    };

    this.profileService.changePassword(data).subscribe({
      next: () => {
        this.toastService.success('Contraseña cambiada', 'Tu contraseña ha sido actualizada exitosamente');
        this.passwordForm.reset();
        this.isChangingPassword.set(false);
      },
      error: (error: any) => {
        this.isChangingPassword.set(false);
        this.toastService.error('Error', error.error?.message || 'No se pudo cambiar la contraseña');
      },
    });
  }

  private mapSessionToDisplay(session: Session, index: number): SessionDisplay {
    return {
      id: session.id,
      device: session.deviceInfo || 'Dispositivo desconocido',
      ip: session.ipAddress || 'IP desconocida',
      lastUsed: session.createdAt,
      createdAt: session.createdAt,
      isCurrent: index === 0, // First session is most recent (current)
    };
  }

  loadSessions(): void {
    this.isLoadingSessions.set(true);
    this.profileService.getSessions().subscribe({
      next: (sessions) => {
        const displaySessions = sessions.map((s, i) => this.mapSessionToDisplay(s, i));
        this.sessions.set(displaySessions);
        this.isLoadingSessions.set(false);
      },
      error: () => {
        // Mock data for demo - usando formato legible del dispositivo
        this.sessions.set([
          {
            id: '1',
            device: 'Chrome en Windows 10/11',
            ip: '192.168.1.1',
            lastUsed: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            isCurrent: true,
          },
        ]);
        this.isLoadingSessions.set(false);
      },
    });
  }

  revokeSession(session: SessionDisplay): void {
    this.profileService.revokeSession(session.id).subscribe({
      next: () => {
        this.toastService.success('Sesión cerrada', 'La sesión ha sido revocada');
        this.loadSessions();
      },
      error: () => {
        this.toastService.error('Error', 'No se pudo cerrar la sesión');
      },
    });
  }

  logoutAllDevices(): void {
    this.showLogoutAllDialog.set(false);

    this.profileService.revokeAllSessions().subscribe({
      next: () => {
        // Use setTimeout to defer logout after Angular's change detection completes
        // This prevents the NG0100 ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.authService.logout();
          this.router.navigate(['/login']);
        }, 0);
      },
      error: () => {
        this.toastService.error('Error', 'No se pudieron cerrar las sesiones');
      },
    });
  }
}
