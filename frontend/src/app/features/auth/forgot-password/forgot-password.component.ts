import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="forgot-page">
      @if (!emailSent()) {
        <div class="page-header">
          <h1 class="page-title">Recuperar Contraseña</h1>
          <p class="page-subtitle">
            Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
          </p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="forgot-form">
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

          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="form.invalid || isLoading()"
          >
            @if (isLoading()) {
              <span class="spinner"></span>
              Enviando...
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
              Enviar Instrucciones
            }
          </button>
        </form>
      } @else {
        <div class="success-state">
          <div class="success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h1 class="page-title centered">¡Correo Enviado!</h1>
          <p class="page-subtitle centered">
            Si el correo <strong>{{ submittedEmail() }}</strong> está registrado en nuestro sistema,
            recibirás las instrucciones para restablecer tu contraseña.
          </p>
          <div class="info-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            El enlace expirará en 30 minutos. Si no recibes el correo, revisa tu carpeta de spam.
          </div>
        </div>
      }

      <p class="back-link">
        <a routerLink="/auth/login">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Volver a iniciar sesión
        </a>
      </p>
    </div>
  `,
  styles: [`
    .forgot-page {
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

    .page-title.centered {
      text-align: center;
    }

    :host-context(.dark) .page-title {
      color: white;
    }

    .page-subtitle {
      color: #6b7280;
      font-size: 0.875rem;
      line-height: 1.6;
      margin: 0;
    }

    .page-subtitle.centered {
      text-align: center;
    }

    .page-subtitle strong {
      color: #111827;
    }

    :host-context(.dark) .page-subtitle strong {
      color: white;
    }

    .forgot-form {
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

    .form-error {
      font-size: 0.75rem;
      color: #ef4444;
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

    .success-state {
      text-align: center;
    }

    .success-icon {
      width: 64px;
      height: 64px;
      background: rgba(16, 185, 129, 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      color: #10b981;
    }

    .info-box {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1.5rem;
      padding: 0.75rem 1rem;
      background: rgba(59, 130, 246, 0.05);
      border: 1px solid rgba(59, 130, 246, 0.1);
      border-radius: 0.5rem;
      font-size: 0.8125rem;
      color: #6b7280;
    }

    :host-context(.dark) .info-box {
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.2);
    }

    .back-link {
      text-align: center;
      margin-top: 2rem;
    }

    .back-link a {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: #6b7280;
      text-decoration: none;
      font-size: 0.875rem;
      transition: color 0.2s;
    }

    .back-link a:hover {
      color: #0d47a1;
    }
  `]
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  form: FormGroup;
  isLoading = signal(false);
  emailSent = signal(false);
  submittedEmail = signal('');

  constructor() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
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

    this.isLoading.set(true);
    const email = this.form.value.email;

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.submittedEmail.set(email);
        this.emailSent.set(true);
      },
      error: () => {
        // Siempre mostramos éxito por seguridad
        this.isLoading.set(false);
        this.submittedEmail.set(email);
        this.emailSent.set(true);
      },
    });
  }
}
