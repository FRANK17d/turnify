import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ServicesService } from '../../../core/services/services.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="service-form-page">
      <header class="page-header">
        <a routerLink="/services" class="back-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Volver
        </a>
        <h1 class="page-title">{{ isEditMode() ? 'Editar Servicio' : 'Nuevo Servicio' }}</h1>
      </header>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-card">
        <div class="form-group">
          <label for="name" class="form-label">Nombre del servicio *</label>
          <input
            type="text"
            id="name"
            formControlName="name"
            class="form-input"
            [class.error]="showError('name')"
            placeholder="Ej: Corte de cabello"
          />
          @if (showError('name')) {
            <span class="form-error">El nombre es requerido</span>
          }
        </div>

        <div class="form-group">
          <label for="description" class="form-label">Descripción</label>
          <textarea
            id="description"
            formControlName="description"
            class="form-textarea"
            rows="3"
            placeholder="Descripción del servicio..."
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="duration" class="form-label">Duración (minutos) *</label>
            <input
              type="number"
              id="duration"
              formControlName="duration"
              class="form-input"
              [class.error]="showError('duration')"
              min="5"
              step="5"
            />
            @if (showError('duration')) {
              <span class="form-error">La duración debe ser al menos 5 minutos</span>
            }
          </div>

          <div class="form-group">
            <label for="price" class="form-label">Precio (USD) *</label>
            <input
              type="number"
              id="price"
              formControlName="price"
              class="form-input"
              [class.error]="showError('price')"
              min="0"
              step="0.01"
            />
            @if (showError('price')) {
              <span class="form-error">El precio debe ser mayor o igual a 0</span>
            }
          </div>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" formControlName="isActive" />
            <span>Servicio activo</span>
          </label>
          <p class="form-hint">Los servicios inactivos no aparecerán para reservas</p>
        </div>

        <div class="form-actions">
          <a routerLink="/services" class="btn btn-outline">Cancelar</a>
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="form.invalid || isSubmitting()"
          >
            @if (isSubmitting()) {
              <span class="spinner"></span>
              Guardando...
            } @else {
              {{ isEditMode() ? 'Actualizar' : 'Crear Servicio' }}
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .service-form-page {
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

    .form-input, .form-textarea {
      width: 100%;
      padding: 0.625rem 0.875rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .form-input:focus, .form-textarea:focus {
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
export class ServiceFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private servicesService = inject(ServicesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);

  form!: FormGroup;
  isEditMode = signal(false);
  isSubmitting = signal(false);
  serviceId = signal<string | null>(null);

  ngOnInit(): void {
    this.initForm();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.serviceId.set(id);
      this.isEditMode.set(true);
      this.loadService(id);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      duration: [60, [Validators.required, Validators.min(5)]],
      price: [0, [Validators.required, Validators.min(0)]],
      isActive: [true],
    });
  }

  private loadService(id: string): void {
    this.servicesService.findOne(id).subscribe({
      next: (service) => {
        this.form.patchValue(service);
      },
      error: () => {
        this.toastService.error('Error', 'No se pudo cargar el servicio');
        this.router.navigate(['/services']);
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

    const data = this.form.value;
    const request = this.isEditMode()
      ? this.servicesService.update(this.serviceId()!, data)
      : this.servicesService.create(data);

    request.subscribe({
      next: () => {
        this.toastService.success(
          this.isEditMode() ? 'Servicio actualizado' : 'Servicio creado',
          this.isEditMode() ? 'El servicio ha sido actualizado' : 'El servicio ha sido creado exitosamente'
        );
        this.router.navigate(['/services']);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.toastService.error('Error', error.error?.message || 'No se pudo guardar el servicio');
      },
    });
  }
}
