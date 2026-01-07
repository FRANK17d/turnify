import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TenantsService, Tenant } from '../../../core/services/tenants.service';
import { BrandingService } from '../../../core/services/branding.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-settings-branding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="settings-section">
      <h2 class="section-title">Marca & Apariencia</h2>
      <p class="section-description">Personaliza la apariencia de tu espacio</p>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-card">
        <div class="form-group">
          <label class="form-label">Logo de la empresa</label>
          <div class="logo-upload">
            @if (logoPreview()) {
              <img [src]="logoPreview()" alt="Logo" class="logo-preview" />
            } @else {
              <div class="logo-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
            }
            <div class="upload-controls">
              <input
                type="file"
                #fileInput
                accept="image/*"
                (change)="onFileSelected($event)"
                style="display: none"
              />
              <button type="button" class="btn btn-outline btn-sm" (click)="fileInput.click()">
                Cambiar logo
              </button>
              @if (logoPreview()) {
                <button type="button" class="btn btn-ghost btn-sm" (click)="removeLogo()">
                  Eliminar
                </button>
              }
            </div>
          </div>
          <p class="form-hint">Formato PNG o JPG. Máximo 2MB.</p>
        </div>

        <div class="form-group">
          <label for="primaryColor" class="form-label">Color principal</label>
          <div class="color-picker">
            <input
              type="color"
              id="primaryColor"
              formControlName="primaryColor"
              class="color-input"
            />
            <input
              type="text"
              formControlName="primaryColor"
              class="form-input color-hex"
              placeholder="#3b82f6"
            />
          </div>
          <p class="form-hint">Este color se usará en botones y elementos destacados</p>
        </div>

        <div class="preview-section">
          <h3 class="preview-title">Vista previa</h3>
          <div class="preview-box">
            <div class="preview-header" [style.background]="form.value.primaryColor">
              <div class="brand-container">
                @if (logoPreview()) {
                  <img [src]="logoPreview()" alt="Logo" class="preview-logo" />
                }
                <div class="preview-text">{{ tenantName() }}</div>
              </div>
            </div>
            <div class="preview-content">
              <button class="preview-button" [style.background]="form.value.primaryColor">
                Botón de ejemplo
              </button>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="isSubmitting()"
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
      margin-bottom: 1.5rem;
    }

    .form-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .form-hint {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.375rem;
    }

    .logo-upload {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .logo-preview, .logo-placeholder {
      width: 80px;
      height: 80px;
      border-radius: 0.5rem;
      object-fit: cover;
    }

    .logo-placeholder {
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9ca3af;
    }

    .upload-controls {
      display: flex;
      gap: 0.5rem;
    }

    .color-picker {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .color-input {
      width: 60px;
      height: 40px;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      cursor: pointer;
    }

    .color-hex {
      width: 140px;
    }

    .form-input {
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

    .preview-section {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .preview-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 0.75rem 0;
    }

    .preview-box {
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .preview-header {
      padding: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 80px;
    }

    .preview-logo {
      max-width: 50px;
      max-height: 40px;
      object-fit: contain;
    }

    .brand-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .preview-text {
      color: white;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .preview-content {
      padding: 1.5rem;
      background: #f9fafb;
      text-align: center;
    }

    .preview-button {
      padding: 0.625rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      color: white;
      font-weight: 500;
      cursor: default;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
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

    .btn-outline {
      background: white;
      border: 1px solid #d1d5db;
      color: #374151;
    }

    .btn-ghost {
      background: transparent;
      color: #ef4444;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
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
export class SettingsBrandingComponent implements OnInit {
  private fb = inject(FormBuilder);
  private tenantsService = inject(TenantsService);
  private brandingService = inject(BrandingService);
  private toastService = inject(ToastService);

  form!: FormGroup;
  isSubmitting = signal(false);
  logoPreview = signal<string | null>(null);
  tenantName = signal<string>('Mi Empresa');

  ngOnInit(): void {
    this.initForm();
    this.loadBrandingSettings();
  }

  private initForm(): void {
    this.form = this.fb.group({
      primaryColor: ['#3b82f6'],
    });
  }

  private loadBrandingSettings(): void {
    this.tenantsService.getCurrentTenant().subscribe({
      next: (tenant: Tenant) => {
        this.tenantName.set(tenant.name);
        this.form.patchValue({
          primaryColor: tenant.primaryColor || '#3b82f6',
        });
        if (tenant.logo) {
          this.logoPreview.set(tenant.logo);
        }
      },
      error: () => {
        this.toastService.error('Error', 'No se pudo cargar la configuración');
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (file.size > 2 * 1024 * 1024) {
      this.toastService.error('Error', 'El archivo debe ser menor a 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreview.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeLogo(): void {
    this.logoPreview.set(null);
  }

  onSubmit(): void {
    this.isSubmitting.set(true);

    const data: Partial<Tenant> = {
      primaryColor: this.form.value.primaryColor,
      logo: this.logoPreview() || undefined,
    };

    this.tenantsService.updateSettings(data).subscribe({
      next: () => {
        // Update global branding
        this.brandingService.updateBranding({
          primaryColor: this.form.value.primaryColor,
          logo: this.logoPreview(),
        });
        this.toastService.success('Marca actualizada', 'Los cambios han sido guardados');
        this.isSubmitting.set(false);
      },
      error: (error: any) => {
        this.isSubmitting.set(false);
        this.toastService.error('Error', error.error?.message || 'No se pudo guardar la configuración');
      },
    });
  }
}
