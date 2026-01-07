import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TenantsService, Tenant } from '../../../core/services/tenants.service';
import { BrandingService } from '../../../core/services/branding.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-settings-general',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="settings-section">
      <h2 class="section-title">Configuración General</h2>
      <p class="section-description">Administra la información básica de tu empresa</p>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-card">
        <div class="form-group">
          <label for="name" class="form-label">Nombre de la empresa *</label>
          <input
            type="text"
            id="name"
            formControlName="name"
            class="form-input"
            [class.error]="showError('name')"
            placeholder="Mi Empresa"
          />
          @if (showError('name')) {
            <span class="form-error">El nombre es requerido</span>
          }
        </div>

        <div class="form-group">
          <label for="slug" class="form-label">Identificador único (slug)</label>
          <input
            type="text"
            id="slug"
            formControlName="slug"
            class="form-input"
            placeholder="mi-empresa"
          />
          <p class="form-hint">Este valor se genera automáticamente y no se puede modificar</p>
        </div>

        <div class="form-group">
          <label class="form-label">Estado del tenant</label>
          <div class="status-display">
            <span class="status-badge" [class.active]="tenantStatus() === 'ACTIVE'">
              {{ tenantStatus() === 'ACTIVE' ? 'Activo' : 'Inactivo' }}
            </span>
            <span class="status-info">Solo visible - no se puede modificar</span>
          </div>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="form.invalid || isSubmitting()"
          >
            @if (isSubmitting()) {
              <span class="spinner"></span>
              Guardando...
            } @else {
              Guardar cambios
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .settings-section {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
      margin: 0 0 1.5rem 0;
    }

    .form-card {
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.375rem;
    }

    .form-input, .form-select {
      width: 100%;
      padding: 0.625rem 0.875rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-input.error {
      border-color: #ef4444;
    }

    .form-input:disabled {
      background: #f9fafb;
      color: #9ca3af;
    }

    .form-error {
      font-size: 0.75rem;
      color: #ef4444;
      margin-top: 0.25rem;
      display: block;
    }

    .form-hint {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.25rem;
    }

    .status-display {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .status-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.375rem 0.75rem;
      border-radius: 9999px;
      background: #fee2e2;
      color: #dc2626;
    }

    .status-badge.active {
      background: #d1fae5;
      color: #059669;
    }

    .status-info {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
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
export class SettingsGeneralComponent implements OnInit {
  private fb = inject(FormBuilder);
  private tenantsService = inject(TenantsService);
  private brandingService = inject(BrandingService);
  private toastService = inject(ToastService);

  form!: FormGroup;
  isSubmitting = signal(false);
  tenantStatus = signal<string>('ACTIVE');

  ngOnInit(): void {
    this.initForm();
    this.loadTenantSettings();
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      slug: [{ value: '', disabled: true }],
    });
  }

  private loadTenantSettings(): void {
    this.tenantsService.getCurrentTenant().subscribe({
      next: (tenant: Tenant) => {
        this.form.patchValue({
          name: tenant.name,
          slug: tenant.slug,
        });
        this.tenantStatus.set(tenant.status);
      },
      error: () => {
        this.toastService.error('Error', 'No se pudo cargar la configuración');
      },
    });
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

    const data: Partial<Tenant> = {
      name: this.form.value.name,
    };

    this.tenantsService.updateSettings(data).subscribe({
      next: () => {
        // Actualizar el nombre en tiempo real en el header
        this.brandingService.updateBranding({ name: this.form.value.name });
        this.toastService.success('Configuración actualizada', 'Los cambios han sido guardados');
        this.isSubmitting.set(false);
      },
      error: (error: any) => {
        this.isSubmitting.set(false);
        this.toastService.error('Error', error.error?.message || 'No se pudo guardar la configuración');
      },
    });
  }
}
