import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../shared/services/toast.service';
import { ApiService } from '../../../core/services/api.service';

interface Role {
  id: string;
  name: string;
}

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="user-form-page">
      <header class="page-header">
        <a routerLink="/users" class="back-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Volver
        </a>
        <h1 class="page-title">{{ isEditMode() ? 'Editar Usuario' : 'Nuevo Usuario' }}</h1>
      </header>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-card">
        <div class="form-row">
          <div class="form-group">
            <label for="firstName" class="form-label">Nombre *</label>
            <input
              type="text"
              id="firstName"
              formControlName="firstName"
              class="form-input"
              [class.error]="showError('firstName')"
              placeholder="Nombre"
            />
            @if (showError('firstName')) {
              @if (form.get('firstName')?.hasError('required')) {
                <span class="form-error">El nombre es requerido</span>
              } @else if (form.get('firstName')?.hasError('minlength')) {
                <span class="form-error">El nombre debe tener al menos 2 caracteres</span>
              }
            }
          </div>

          <div class="form-group">
            <label for="lastName" class="form-label">Apellido *</label>
            <input
              type="text"
              id="lastName"
              formControlName="lastName"
              class="form-input"
              [class.error]="showError('lastName')"
              placeholder="Apellido"
            />
            @if (showError('lastName')) {
              @if (form.get('lastName')?.hasError('required')) {
                <span class="form-error">El apellido es requerido</span>
              } @else if (form.get('lastName')?.hasError('minlength')) {
                <span class="form-error">El apellido debe tener al menos 2 caracteres</span>
              }
            }
          </div>
        </div>

        <div class="form-group">
          <label for="email" class="form-label">Email *</label>
          <input
            type="email"
            id="email"
            formControlName="email"
            class="form-input"
            [class.error]="showError('email')"
            placeholder="correo@ejemplo.com"
          />
          @if (showError('email')) {
            <span class="form-error">Ingresa un email válido</span>
          }
        </div>

        @if (!isEditMode()) {
          <div class="form-group">
            <label for="password" class="form-label">Contraseña *</label>
            <div class="password-input">
              <input
                [type]="showPassword() ? 'text' : 'password'"
                id="password"
                formControlName="password"
                class="form-input"
                [class.error]="showError('password')"
                placeholder="Mínimo 8 caracteres"
              />
              <button type="button" class="toggle-password" (click)="showPassword.set(!showPassword())">
                @if (showPassword()) {
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                }
              </button>
            </div>
            @if (showError('password')) {
              <span class="form-error">La contraseña debe tener al menos 8 caracteres</span>
            }
          </div>
        }

        <div class="form-group">
          <label class="form-label">Rol *</label>
          <div class="roles-grid">
            @for (role of availableRoles(); track role.id) {
              <label class="role-option" [class.selected]="form.get('roleId')?.value === role.id">
                <input
                  type="radio"
                  formControlName="roleId"
                  [value]="role.id"
                />
                <div class="role-content">
                  <span class="role-name">{{ getRoleLabel(role.name) }}</span>
                  <span class="role-description">{{ getRoleDescription(role.name) }}</span>
                </div>
              </label>
            } @empty {
              <div class="empty-roles">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span>No hay roles cargados. ¿Deseas intentar cargarlos de nuevo?</span>
                <button type="button" class="btn btn-sm btn-outline" (click)="loadRoles()">Reintentar</button>
              </div>
            }
          </div>
          @if (showError('roleId')) {
            <span class="form-error">Selecciona un rol</span>
          }
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" formControlName="isActive" />
            <span>Usuario activo</span>
          </label>
          <p class="form-hint">Los usuarios inactivos no pueden acceder al sistema</p>
        </div>

        <div class="form-actions">
          <a routerLink="/users" class="btn btn-outline">Cancelar</a>
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="form.invalid || isSubmitting()"
          >
            @if (isSubmitting()) {
              <span class="spinner"></span>
              Guardando...
            } @else {
              {{ isEditMode() ? 'Actualizar' : 'Crear Usuario' }}
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .user-form-page {
      max-width: 600px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 1.5rem;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: #6b7280;
      text-decoration: none;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .form-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

    .form-error {
      font-size: 0.75rem;
      color: #ef4444;
      margin-top: 0.25rem;
    }

    .form-hint {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.25rem;
    }

    .password-input {
      position: relative;
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

    .roles-grid {
      display: grid;
      gap: 0.75rem;
    }

    .role-option {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.15s;
    }

    .role-option:hover {
      border-color: #d1d5db;
    }

    .role-option.selected {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .role-option input {
      margin-top: 0.125rem;
    }

    .role-content {
      display: flex;
      flex-direction: column;
    }

    .role-name {
      font-weight: 500;
      color: #111827;
    }

    .role-description {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .empty-roles {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-radius: 0.5rem;
      color: #92400e;
      font-size: 0.875rem;
    }

    .empty-roles svg {
      color: #f59e0b;
      flex-shrink: 0;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      cursor: pointer;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
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

    .btn-outline {
      background: white;
      border: 1px solid #e5e7eb;
      color: #374151;
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
  `]
})
export class UserFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);

  form!: FormGroup;
  isEditMode = signal(false);
  isSubmitting = signal(false);
  showPassword = signal(false);
  userId = signal<string | null>(null);
  availableRoles = signal<Role[]>([]);

  ngOnInit(): void {
    this.initForm();
    this.loadRoles();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userId.set(id);
      this.isEditMode.set(true);
      this.loadUser(id);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.isEditMode() ? [] : [Validators.required, Validators.minLength(8)]],
      roleId: ['', Validators.required],
      isActive: [true],
    });
  }

  public loadRoles(): void {
    this.apiService.get<any>('/roles').subscribe({
      next: (response) => {
        let roles: Role[] = [];
        if (Array.isArray(response)) {
          roles = response;
        } else if (response && Array.isArray(response.data)) {
          roles = response.data;
        }

        // Filter out SUPER_ADMIN role
        const filtered = roles.filter((r: Role) => r.name !== 'SUPER_ADMIN');
        this.availableRoles.set(filtered);

        // Si hay roles y no es edición, pre-seleccionar CLIENTE si existe
        if (filtered.length > 0 && !this.isEditMode() && !this.form.get('roleId')?.value) {
          const clientRole = filtered.find(r => r.name === 'CLIENTE');
          if (clientRole) {
            this.form.patchValue({ roleId: clientRole.id });
          } else {
            this.form.patchValue({ roleId: filtered[0].id });
          }
        }
      },
      error: () => {
        this.toastService.error('Error', 'No se pudieron cargar los roles');
      },
    });
  }

  private loadUser(id: string): void {
    this.apiService.get<any>(`/users/${id}`).subscribe({
      next: (response) => {
        const user = response?.data || response;
        if (!user) return;

        this.form.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          roleId: user.roles?.[0]?.id || '',
          isActive: user.isActive,
        });

        // En edición, password no es requerido
        this.form.get('password')?.clearValidators();
        this.form.get('password')?.updateValueAndValidity();
      },
      error: () => {
        this.toastService.error('Error', 'No se pudo cargar el usuario');
        this.router.navigate(['/users']);
      },
    });
  }

  getRoleLabel(roleName: string): string {
    const labels: Record<string, string> = {
      'ADMIN_EMPRESA': 'Administrador',
      'CLIENTE': 'Cliente',
    };
    return labels[roleName] || roleName;
  }

  getRoleDescription(roleName: string): string {
    const descriptions: Record<string, string> = {
      'ADMIN_EMPRESA': 'Puede gestionar usuarios, servicios y ver reportes',
      'CLIENTE': 'Puede crear y gestionar sus propias reservas',
    };
    return descriptions[roleName] || '';
  }

  showError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control?.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.form.value;
    const data: any = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      isActive: formValue.isActive,
      roleIds: [formValue.roleId], // El backend espera un array
    };

    if (!this.isEditMode()) {
      // Solo enviar email y password al crear
      data.email = formValue.email;
      data.password = formValue.password;
    }

    const request = this.isEditMode()
      ? this.apiService.patch(`/users/${this.userId()}`, data)
      : this.apiService.post('/users', data);

    request.subscribe({
      next: () => {
        this.toastService.success(
          this.isEditMode() ? 'Usuario actualizado' : 'Usuario creado',
          this.isEditMode() ? 'El usuario ha sido actualizado' : 'El usuario ha sido creado exitosamente'
        );
        this.router.navigate(['/users']);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.toastService.error('Error', error.error?.message || 'No se pudo guardar el usuario');
      },
    });
  }
}
