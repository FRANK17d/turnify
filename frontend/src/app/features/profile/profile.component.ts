import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService, Profile } from '../../core/services/profile.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="profile-page">
      <header class="page-header">
        <h1 class="page-title">Mi Perfil</h1>
        <p class="page-subtitle">Administra tu información personal</p>
      </header>

      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando perfil...</p>
        </div>
      } @else {
        <div class="profile-grid">
          <!-- Información personal -->
          <div class="profile-card">
            <h2 class="card-title">Información Personal</h2>
            <form [formGroup]="profileForm" (ngSubmit)="updateProfile()">
              <div class="form-row">
                <div class="form-group">
                  <label for="firstName" class="form-label">Nombre *</label>
                  <input
                    type="text"
                    id="firstName"
                    formControlName="firstName"
                    class="form-input"
                    [class.error]="showError('firstName')"
                  />
                </div>
                <div class="form-group">
                  <label for="lastName" class="form-label">Apellido *</label>
                  <input
                    type="text"
                    id="lastName"
                    formControlName="lastName"
                    class="form-input"
                    [class.error]="showError('lastName')"
                  />
                </div>
              </div>

              <div class="form-group">
                <label for="email" class="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  formControlName="email"
                  class="form-input readonly"
                  readonly
                />
                <span class="form-hint">El email no puede ser modificado</span>
              </div>

              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="profileForm.invalid || isUpdating()"
              >
                @if (isUpdating()) {
                  <span class="spinner-sm"></span>
                  Guardando...
                } @else {
                  Guardar cambios
                }
              </button>
            </form>
          </div>

          <!-- Información de la cuenta -->
          <div class="profile-card">
            <h2 class="card-title">Información de la Cuenta</h2>

            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Empresa</span>
                <span class="info-value">{{ currentUser()?.tenant?.name }}</span>
              </div>

              <div class="info-item">
                <span class="info-label">Roles</span>
                <div class="roles-list">
                  @for (role of currentUser()?.roles; track role) {
                    <span class="role-badge">{{ getRoleLabel(role) }}</span>
                  }
                </div>
              </div>

              @if (isAdmin()) {
                <div class="info-item">
                  <span class="info-label">Plan actual</span>
                  <span class="plan-badge" [class.pro]="currentUser()?.tenant?.plan === 'PRO'" [class.enterprise]="currentUser()?.tenant?.plan === 'ENTERPRISE'">
                    {{ currentUser()?.tenant?.plan || 'FREE' }}
                  </span>
                </div>
              }

              <div class="info-item">
                <span class="info-label">Miembro desde</span>
                <span class="info-value">{{ currentUser()?.createdAt | date:'dd/MM/yyyy' }}</span>
              </div>

              <div class="info-item">
                <span class="info-label">Estado</span>
                <span class="status-badge" [class.active]="currentUser()?.isActive">
                  {{ currentUser()?.isActive ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Preferencias de notificaciones -->
          <div class="profile-card">
            <h2 class="card-title">Preferencias de Notificaciones</h2>
            <form [formGroup]="notificationsForm" (ngSubmit)="updateNotifications()">
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="emailNotifications" />
                  <div>
                    <span class="checkbox-title">Notificaciones por email</span>
                    <p class="checkbox-description">Recibir notificaciones importantes por correo electrónico</p>
                  </div>
                </label>
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="inAppNotifications" />
                  <div>
                    <span class="checkbox-title">Notificaciones en la aplicación</span>
                    <p class="checkbox-description">Mostrar notificaciones en tiempo real en la plataforma</p>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="isUpdatingNotifications()"
              >
                @if (isUpdatingNotifications()) {
                  <span class="spinner-sm"></span>
                  Guardando...
                } @else {
                  Guardar preferencias
                }
              </button>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .profile-page {
      max-width: 900px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 1.5rem;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .page-subtitle {
      color: #6b7280;
      margin-top: 0.25rem;
    }

    .loading-state {
      background: white;
      border-radius: 0.75rem;
      padding: 4rem 2rem;
      text-align: center;
      color: #6b7280;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .profile-grid {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .profile-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .card-title {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 1.5rem 0;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
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

    .form-input {
      width: 100%;
      padding: 0.625rem 0.875rem;
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

    .form-input.readonly {
      background: #f9fafb;
      color: #6b7280;
      cursor: not-allowed;
    }

    .form-hint {
      font-size: 0.75rem;
      color: #9ca3af;
      margin-top: 0.25rem;
    }

    .info-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .info-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .info-label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .info-value {
      font-size: 0.875rem;
      font-weight: 500;
      color: #111827;
    }

    .roles-list {
      display: flex;
      gap: 0.5rem;
    }

    .role-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      background: #dbeafe;
      color: #1d4ed8;
    }

    .plan-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.375rem 0.75rem;
      border-radius: 9999px;
      background: #e5e7eb;
      color: #374151;
    }

    .plan-badge.pro {
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      color: white;
    }

    .plan-badge.enterprise {
      background: linear-gradient(135deg, #f59e0b, #ea580c);
      color: white;
    }

    .status-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      background: #fee2e2;
      color: #dc2626;
    }

    .status-badge.active {
      background: #d1fae5;
      color: #059669;
    }

    .checkbox-label {
      display: flex;
      gap: 0.75rem;
      cursor: pointer;
    }

    .checkbox-title {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #111827;
    }

    .checkbox-description {
      font-size: 0.75rem;
      color: #6b7280;
      margin: 0.25rem 0 0 0;
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
    }

    .btn-primary {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner-sm {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  `]
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private toastService = inject(ToastService);

  profileForm!: FormGroup;
  notificationsForm!: FormGroup;
  currentUser = signal<Profile | null>(null);
  isLoading = signal(true);
  isUpdating = signal(false);
  isUpdatingNotifications = signal(false);

  isAdmin = computed(() => {
    const user = this.currentUser();
    return user?.roles?.includes('ADMIN_EMPRESA') || user?.roles?.includes('SUPER_ADMIN');
  });

  ngOnInit(): void {
    this.initForms();
    this.loadProfile();
  }

  private initForms(): void {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: [''], // Readonly - no validation needed
    });

    this.notificationsForm = this.fb.group({
      emailNotifications: [true],
      inAppNotifications: [true],
    });
  }

  private loadProfile(): void {
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.currentUser.set(profile);
        this.profileForm.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
        });
        this.notificationsForm.patchValue({
          emailNotifications: profile.preferences?.emailNotifications ?? true,
          inAppNotifications: profile.preferences?.inAppNotifications ?? true,
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error', 'No se pudo cargar el perfil');
        this.isLoading.set(false);
      },
    });
  }

  showError(field: string): boolean {
    const control = this.profileForm.get(field);
    return !!(control?.invalid && control?.touched);
  }

  getRoleLabel(roleName: string): string {
    const labels: Record<string, string> = {
      'SUPER_ADMIN': 'Super Admin',
      'ADMIN_EMPRESA': 'Admin',
      'CLIENTE': 'Cliente',
    };
    return labels[roleName] || roleName;
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isUpdating.set(true);

    const { firstName, lastName } = this.profileForm.value;

    this.profileService.updateProfile({ firstName, lastName }).subscribe({
      next: () => {
        // Actualizar el nombre en tiempo real en el header
        this.authService.updateCurrentUser({ firstName, lastName });
        this.toastService.success('Perfil actualizado', 'Tus datos han sido actualizados');
        this.isUpdating.set(false);
      },
      error: (error: any) => {
        this.isUpdating.set(false);
        this.toastService.error('Error', error.error?.message || 'No se pudo actualizar el perfil');
      },
    });
  }

  updateNotifications(): void {
    this.isUpdatingNotifications.set(true);

    this.profileService.updateNotificationPreferences(this.notificationsForm.value).subscribe({
      next: () => {
        this.toastService.success('Preferencias actualizadas', 'Tus preferencias han sido guardadas');
        this.isUpdatingNotifications.set(false);
      },
      error: () => {
        this.isUpdatingNotifications.set(false);
        this.toastService.error('Error', 'No se pudieron actualizar las preferencias');
      },
    });
  }
}
