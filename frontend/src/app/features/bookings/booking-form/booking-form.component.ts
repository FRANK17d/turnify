import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BookingsService } from '../../../core/services/bookings.service';
import { ServicesService, Service } from '../../../core/services/services.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="booking-form-page">
      <header class="page-header">
        <a routerLink="/bookings" class="back-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Volver
        </a>
        <h1 class="page-title">{{ isEditMode() ? 'Editar Reserva' : 'Nueva Reserva' }}</h1>
      </header>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-card">
        <div class="form-section">
          <h2 class="section-title">Información de la Reserva</h2>

          <div class="form-group">
            <label for="serviceId" class="form-label">Servicio *</label>
            <select
              id="serviceId"
              formControlName="serviceId"
              class="form-select"
              [class.error]="showError('serviceId')"
            >
              <option value="">Selecciona un servicio</option>
              @for (service of services(); track service.id) {
                <option [value]="service.id">
                  {{ service.name }} - {{ service.price | currency:'USD' }} ({{ service.duration }} min)
                </option>
              }
            </select>
            @if (showError('serviceId')) {
              <span class="form-error">Selecciona un servicio</span>
            }
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="date" class="form-label">Fecha *</label>
              <input
                type="date"
                id="date"
                formControlName="date"
                class="form-input"
                [class.error]="showError('date')"
                [min]="minDate"
              />
              @if (showError('date')) {
                <span class="form-error">La fecha es requerida</span>
              }
            </div>

            <div class="form-group">
              <label for="time" class="form-label">Hora *</label>
              <input
                type="time"
                id="time"
                formControlName="time"
                class="form-input"
                [class.error]="showError('time')"
              />
              @if (showError('time')) {
                <span class="form-error">La hora es requerida</span>
              }
            </div>
          </div>

          <div class="form-group">
            <label for="notes" class="form-label">Notas adicionales</label>
            <textarea
              id="notes"
              formControlName="notes"
              class="form-textarea"
              rows="3"
              placeholder="Información adicional para la reserva..."
            ></textarea>
          </div>
        </div>

        <!-- Resumen -->
        @if (selectedService()) {
          <div class="booking-summary">
            <h3 class="summary-title">Resumen de la Reserva</h3>
            <div class="summary-item">
              <span>Servicio:</span>
              <strong>{{ selectedService()?.name }}</strong>
            </div>
            <div class="summary-item">
              <span>Duración:</span>
              <strong>{{ selectedService()?.duration }} minutos</strong>
            </div>
            <div class="summary-item">
              <span>Precio:</span>
              <strong>{{ selectedService()?.price | currency:'USD' }}</strong>
            </div>
          </div>
        }

        <div class="form-actions">
          <a routerLink="/bookings" class="btn btn-outline">Cancelar</a>
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="form.invalid || isSubmitting()"
          >
            @if (isSubmitting()) {
              <span class="spinner"></span>
              Guardando...
            } @else {
              {{ isEditMode() ? 'Actualizar' : 'Crear Reserva' }}
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .booking-form-page {
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

    .back-btn:hover {
      color: #374151;
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

    .form-section {
      margin-bottom: 1.5rem;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 1rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    @media (max-width: 480px) {
      .form-row {
        grid-template-columns: 1fr;
      }
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

    .form-input, .form-select, .form-textarea {
      width: 100%;
      padding: 0.625rem 0.875rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      transition: all 0.15s;
      background: white;
    }

    .form-input:focus, .form-select:focus, .form-textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-input.error, .form-select.error {
      border-color: #ef4444;
    }

    .form-error {
      font-size: 0.75rem;
      color: #ef4444;
      margin-top: 0.25rem;
    }

    .booking-summary {
      background: #f9fafb;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .summary-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 0.75rem 0;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 0.375rem 0;
      font-size: 0.875rem;
    }

    .summary-item span {
      color: #6b7280;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
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
      transition: all 0.15s;
      border: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
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

    .btn-outline:hover {
      background: #f9fafb;
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
export class BookingFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private bookingsService = inject(BookingsService);
  private servicesService = inject(ServicesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);

  form!: FormGroup;
  services = signal<Service[]>([]);
  selectedService = signal<Service | null>(null);
  isEditMode = signal(false);
  isSubmitting = signal(false);
  bookingId = signal<string | null>(null);

  minDate = new Date().toISOString().split('T')[0];

  ngOnInit(): void {
    this.initForm();
    this.loadServices();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.bookingId.set(id);
      this.isEditMode.set(true);
      this.loadBooking(id);
    }

    // Escuchar cambios en el servicio seleccionado
    this.form.get('serviceId')?.valueChanges.subscribe(serviceId => {
      const service = this.services().find(s => s.id === serviceId);
      this.selectedService.set(service || null);
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      serviceId: ['', Validators.required],
      date: ['', Validators.required],
      time: ['', Validators.required],
      notes: [''],
    });
  }

  private loadServices(): void {
    this.servicesService.findAll().subscribe({
      next: (services) => this.services.set(services.filter((s: Service) => s.isActive)),
      error: () => this.toastService.error('Error', 'No se pudieron cargar los servicios'),
    });
  }

  private loadBooking(id: string): void {
    this.bookingsService.findOne(id).subscribe({
      next: (booking) => {
        const startTime = new Date(booking.startTime);
        this.form.patchValue({
          serviceId: booking.service?.id,
          date: startTime.toISOString().split('T')[0],
          time: startTime.toTimeString().slice(0, 5),
          notes: booking.notes,
        });
      },
      error: () => {
        this.toastService.error('Error', 'No se pudo cargar la reserva');
        this.router.navigate(['/bookings']);
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

    const { serviceId, date, time, notes } = this.form.value;
    const startTime = new Date(`${date}T${time}`);

    if (this.isEditMode()) {
      const updateData: any = {
        startTime: startTime.toISOString(),
        notes,
      };

      this.bookingsService.update(this.bookingId()!, updateData).subscribe({
        next: () => this.handleSuccess(true),
        error: (error) => this.handleError(error)
      });
    } else {
      const createData: any = {
        serviceId,
        startTime: startTime.toISOString(),
        notes,
      };

      this.bookingsService.create(createData).subscribe({
        next: () => this.handleSuccess(false),
        error: (error) => this.handleError(error)
      });
    }
  }

  private handleSuccess(isEdit: boolean): void {
    this.toastService.success(
      isEdit ? 'Reserva actualizada' : 'Reserva creada',
      isEdit ? 'La reserva ha sido actualizada' : 'La reserva ha sido creada exitosamente'
    );
    this.router.navigate(['/bookings']);
  }

  private handleError(error: any): void {
    this.isSubmitting.set(false);
    this.toastService.error('Error', error.error?.message || 'No se pudo guardar la reserva');
  }
}
