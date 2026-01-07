import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { LoadingService } from '../../../shared/services/loading.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="login-page">
      <div class="page-header">
        <h1 class="page-title">Bienvenido a Turnify</h1>
        <p class="page-subtitle">Ingresa tus credenciales para acceder al panel de gestión.</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-form">
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
              placeholder="tu@correo.com"
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
              autocomplete="current-password"
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
              }
            </span>
          }
        </div>

        <div class="form-options">
          <label class="checkbox-label">
            <input type="checkbox" formControlName="rememberMe" />
            <span>Recordar dispositivo</span>
          </label>
          <a routerLink="/auth/forgot-password" class="forgot-link">
            ¿Olvidaste tu contraseña?
          </a>
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

        @if (attemptsWarning()) {
          <div class="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            {{ attemptsWarning() }}
          </div>
        }

        <button
          type="submit"
          class="btn btn-primary"
          [disabled]="form.invalid || isLoading()"
        >
          @if (isLoading()) {
            <span class="spinner"></span>
            Ingresando...
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            Iniciar Sesión Segura
          }
        </button>
      </form>

      <p class="register-link">
        ¿No tienes cuenta?
        <a routerLink="/auth/register">Regístrate aquí</a>
      </p>
    </div>
  `,
  styles: [`
    .login-page {
      width: 100%;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 0.75rem 0;
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

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
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
      padding: 0.875rem 0.875rem 0.875rem 2.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      background: white;
      color: #111827;
      transition: all 0.2s;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
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

    .form-input.error:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
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

    :host-context(.dark) .password-toggle:hover {
      color: #d1d5db;
    }

    .form-options {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #6b7280;
      cursor: pointer;
    }

    .checkbox-label input {
      width: 1rem;
      height: 1rem;
      accent-color: #0d47a1;
    }

    .forgot-link {
      font-size: 0.875rem;
      font-weight: 500;
      color: #0d47a1;
      text-decoration: none;
      transition: color 0.2s;
    }

    .forgot-link:hover {
      color: #1565c0;
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

    :host-context(.dark) .alert-error {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.2);
    }

    .alert-warning {
      background: #fffbeb;
      color: #d97706;
      border: 1px solid #fde68a;
    }

    :host-context(.dark) .alert-warning {
      background: rgba(245, 158, 11, 0.1);
      border-color: rgba(245, 158, 11, 0.2);
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

    .register-link {
      text-align: center;
      margin-top: 2rem;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .register-link a {
      color: #0d47a1;
      text-decoration: none;
      font-weight: 600;
      margin-left: 0.25rem;
    }

    .register-link a:hover {
      color: #1565c0;
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private loadingService = inject(LoadingService);

  form: FormGroup;
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  attemptsWarning = signal('');

  constructor() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false],
    });
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
    this.attemptsWarning.set('');

    const { email, password, rememberMe } = this.form.value;

    this.authService.login({ email, password, rememberMe }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.toastService.success('¡Bienvenido!', 'Inicio de sesión exitoso');
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading.set(false);

        if (error.status === 429) {
          this.errorMessage.set('Demasiados intentos. Por favor espera 15 minutos.');
        } else if (error.error?.remainingAttempts !== undefined) {
          const remaining = error.error.remainingAttempts;
          if (remaining <= 2 && remaining > 0) {
            this.attemptsWarning.set(
              `Te quedan ${remaining} intento${remaining > 1 ? 's' : ''}. ` +
              'Después se bloqueará tu cuenta temporalmente.'
            );
          }
          this.errorMessage.set('Credenciales inválidas');
        } else {
          this.errorMessage.set(error.error?.message || 'Credenciales inválidas');
        }
      },
    });
  }
}
