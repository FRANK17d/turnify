import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="register-page">
      <div class="page-header">
        <h1 class="page-title">Crear Cuenta</h1>
        <p class="page-subtitle">Registra tu empresa y comienza a gestionar tus reservas.</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="register-form">
        <!-- Company Section -->
        <div class="form-section">
          <h3 class="section-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Datos de la Empresa
          </h3>

          <div class="form-group">
            <label for="companyName" class="form-label">NOMBRE DE LA EMPRESA</label>
            <div class="input-wrapper">
              <div class="input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <input
                type="text"
                id="companyName"
                formControlName="companyName"
                class="form-input"
                [class.error]="showError('companyName')"
                placeholder="Mi Empresa S.A."
              />
            </div>
            @if (showError('companyName')) {
              <span class="form-error">El nombre de la empresa es requerido</span>
            }
          </div>
        </div>

        <!-- Admin Section -->
        <div class="form-section">
          <h3 class="section-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Datos del Administrador
          </h3>

          <div class="form-row">
            <div class="form-group">
              <label for="firstName" class="form-label">NOMBRE</label>
              <div class="input-wrapper">
                <input
                  type="text"
                  id="firstName"
                  formControlName="firstName"
                  class="form-input no-icon"
                  [class.error]="showError('firstName')"
                  placeholder="Juan"
                />
              </div>
              @if (showError('firstName')) {
                <span class="form-error">El nombre es requerido</span>
              }
            </div>

            <div class="form-group">
              <label for="lastName" class="form-label">APELLIDO</label>
              <div class="input-wrapper">
                <input
                  type="text"
                  id="lastName"
                  formControlName="lastName"
                  class="form-input no-icon"
                  [class.error]="showError('lastName')"
                  placeholder="Pérez"
                />
              </div>
              @if (showError('lastName')) {
                <span class="form-error">El apellido es requerido</span>
              }
            </div>
          </div>

          <div class="form-group">
            <label for="email" class="form-label">CORREO ELECTRÓNICO</label>
            <div class="input-wrapper">
              <div class="input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <input
                type="email"
                id="email"
                formControlName="email"
                class="form-input"
                [class.error]="showError('email')"
                placeholder="juan@miempresa.com"
                autocomplete="email"
              />
            </div>
            @if (showError('email')) {
              <span class="form-error">
                @if (form.get('email')?.errors?.['required']) {
                  El correo es requerido
                } @else if (form.get('email')?.errors?.['email']) {
                  Ingresa un correo válido
                }
              </span>
            }
          </div>

          <div class="form-group">
            <label for="password" class="form-label">CONTRASEÑA</label>
            <div class="input-wrapper">
              <div class="input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <input
                [type]="showPassword() ? 'text' : 'password'"
                id="password"
                formControlName="password"
                class="form-input"
                [class.error]="showError('password')"
                placeholder="••••••••"
                autocomplete="new-password"
              />
              <button
                type="button"
                class="password-toggle"
                (click)="togglePassword()"
              >
                @if (showPassword()) {
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                }
              </button>
            </div>
            @if (showError('password')) {
              <span class="form-error">
                @if (form.get('password')?.errors?.['required']) {
                  La contraseña es requerida
                } @else if (form.get('password')?.errors?.['minlength']) {
                  Mínimo 8 caracteres
                } @else if (form.get('password')?.errors?.['pattern']) {
                  Debe incluir mayúscula, minúscula, número y símbolo
                }
              </span>
            }
            <div class="password-strength">
              <div class="strength-bar" [style.width]="passwordStrength() + '%'" [class]="strengthClass()"></div>
            </div>
            <span class="password-hint">Usa mayúsculas, minúsculas, números y símbolos (@$!%*?&)</span>
          </div>

          <div class="form-group">
            <label for="confirmPassword" class="form-label">CONFIRMAR CONTRASEÑA</label>
            <div class="input-wrapper">
              <div class="input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <input
                [type]="showPassword() ? 'text' : 'password'"
                id="confirmPassword"
                formControlName="confirmPassword"
                class="form-input"
                [class.error]="showError('confirmPassword')"
                placeholder="••••••••"
                autocomplete="new-password"
              />
            </div>
            @if (showError('confirmPassword')) {
              <span class="form-error">
                @if (form.get('confirmPassword')?.errors?.['required']) {
                  Confirma tu contraseña
                } @else if (form.get('confirmPassword')?.errors?.['passwordMismatch']) {
                  Las contraseñas no coinciden
                }
              </span>
            }
          </div>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" formControlName="acceptTerms" />
            <span>
              Acepto los <a href="/terms" target="_blank">Términos y Condiciones</a>
              y la <a href="/privacy" target="_blank">Política de Privacidad</a>
            </span>
          </label>
          @if (showError('acceptTerms')) {
            <span class="form-error">Debes aceptar los términos</span>
          }
        </div>

        @if (errorMessage()) {
          <div class="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {{ errorMessage() }}
          </div>
        }

        <button
          type="submit"
          class="btn btn-primary"
          [disabled]="form.invalid || isLoading()"
        >
          @if (isLoading()) {
            <span class="spinner"></span>
            Creando cuenta...
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            Crear Cuenta Gratis
          }
        </button>
      </form>

      <p class="login-link">
        ¿Ya tienes cuenta?
        <a routerLink="/auth/login">Inicia sesión</a>
      </p>
    </div>
  `,
  styles: [`
    .register-page {
      width: 100%;
    }

    .page-header {
      margin-bottom: 1.5rem;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 0.5rem 0;
      letter-spacing: -0.025em;
    }

    :host-context(.dark) .page-title {
      color: white;
    }

    .page-subtitle {
      color: #6b7280;
      font-size: 0.875rem;
      line-height: 1.5;
      margin: 0;
    }

    .register-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #0d47a1;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e5e7eb;
      margin: 0;
    }

    :host-context(.dark) .section-title {
      color: #60a5fa;
      border-bottom-color: #334155;
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
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .form-label {
      font-size: 0.6875rem;
      font-weight: 500;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    :host-context(.dark) .form-label {
      color: #9ca3af;
    }

    .input-wrapper {
      position: relative;
    }

    .input-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: #9ca3af;
      display: flex;
      align-items: center;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem 0.75rem 0.75rem 2.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      background: white;
      color: #111827;
      transition: all 0.2s;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
    }

    .form-input.no-icon {
      padding-left: 0.75rem;
    }

    :host-context(.dark) .form-input {
      background: #1e293b;
      border-color: #334155;
      color: white;
    }

    .form-input::placeholder {
      color: #9ca3af;
    }

    .form-input:focus {
      outline: none;
      border-color: #0d47a1;
      box-shadow: 0 0 0 3px rgba(13, 71, 161, 0.1);
    }

    .form-input.error {
      border-color: #ef4444;
    }

    .form-error {
      font-size: 0.75rem;
      color: #ef4444;
    }

    .password-toggle {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      padding: 0.25rem;
      display: flex;
      transition: color 0.2s;
    }

    .password-toggle:hover {
      color: #6b7280;
    }

    .password-strength {
      height: 4px;
      background: #e5e7eb;
      border-radius: 2px;
      margin-top: 0.5rem;
      overflow: hidden;
    }

    :host-context(.dark) .password-strength {
      background: #334155;
    }

    .strength-bar {
      height: 100%;
      border-radius: 2px;
      transition: all 0.3s;
    }

    .strength-bar.weak { background: #ef4444; }
    .strength-bar.fair { background: #f59e0b; }
    .strength-bar.good { background: #10b981; }
    .strength-bar.strong { background: #059669; }

    .password-hint {
      font-size: 0.6875rem;
      color: #9ca3af;
      margin-top: 0.25rem;
    }

    .checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #6b7280;
      cursor: pointer;
      line-height: 1.4;
    }

    .checkbox-label input {
      margin-top: 0.125rem;
      width: 1rem;
      height: 1rem;
      accent-color: #0d47a1;
      flex-shrink: 0;
    }

    .checkbox-label a {
      color: #0d47a1;
      text-decoration: none;
    }

    .checkbox-label a:hover {
      text-decoration: underline;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .alert-error {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      width: 100%;
    }

    .btn-primary {
      background: #0d47a1;
      color: white;
      box-shadow: 0 1px 3px rgba(13, 71, 161, 0.3);
    }

    .btn-primary:hover:not(:disabled) {
      background: #1565c0;
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

    .login-link {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .login-link a {
      color: #0d47a1;
      text-decoration: none;
      font-weight: 600;
      margin-left: 0.25rem;
    }

    .login-link a:hover {
      color: #1565c0;
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  form: FormGroup;
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  passwordStrength = signal(0);
  strengthClass = signal('');

  constructor() {
    this.form = this.fb.group({
      companyName: ['', [Validators.required]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]],
    }, { validators: this.passwordMatchValidator });

    this.form.get('password')?.valueChanges.subscribe(password => {
      this.calculatePasswordStrength(password);
    });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  private calculatePasswordStrength(password: string): void {
    let strength = 0;

    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 15;
    if (/[@$!%*?&]/.test(password)) strength += 10;

    this.passwordStrength.set(Math.min(100, strength));

    if (strength < 50) this.strengthClass.set('weak');
    else if (strength < 75) this.strengthClass.set('fair');
    else if (strength < 100) this.strengthClass.set('good');
    else this.strengthClass.set('strong');
  }

  showError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control?.touched);
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { companyName, firstName, lastName, email, password } = this.form.value;

    this.authService.register({
      tenantName: companyName,
      firstName,
      lastName,
      email,
      password,
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toastService.success('¡Cuenta creada!', 'Ahora puedes iniciar sesión');
        this.router.navigate(['/auth/login']);
      },
      error: (error: any) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Error al crear la cuenta');
      },
    });
  }
}
