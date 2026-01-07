import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="reset-page">
      @if (invalidToken()) {
        <div class="state-container error-state">
          <div class="state-icon error">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h1 class="page-title centered">Enlace Inválido</h1>
          <p class="page-subtitle centered">
            El enlace para restablecer tu contraseña ha expirado o no es válido.
          </p>
          <a routerLink="/auth/forgot-password" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
            </svg>
            Solicitar nuevo enlace
          </a>
        </div>
      } @else if (passwordReset()) {
        <div class="state-container success-state">
          <div class="state-icon success">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h1 class="page-title centered">¡Contraseña Actualizada!</h1>
          <p class="page-subtitle centered">
            Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
          <a routerLink="/auth/login" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            Iniciar Sesión
          </a>
        </div>
      } @else {
        <div class="page-header">
          <h1 class="page-title">Nueva Contraseña</h1>
          <p class="page-subtitle">
            Ingresa tu nueva contraseña para completar el restablecimiento.
          </p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="reset-form">
          <div class="form-group">
            <label for="password" class="form-label">NUEVA CONTRASEÑA</label>
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
              Guardando...
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              Restablecer Contraseña
            }
          </button>
        </form>

        <p class="back-link">
          <a routerLink="/auth/login">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Volver a iniciar sesión
          </a>
        </p>
      }
    </div>
  `,
  styles: [`
    .reset-page {
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
      margin-bottom: 1.5rem;
    }

    .reset-form {
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
      padding: 0.875rem 2.75rem 0.875rem 2.75rem;
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
      text-decoration: none;
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

    .state-container {
      text-align: center;
    }

    .state-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
    }

    .state-icon.success {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    .state-icon.error {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
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
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  form: FormGroup;
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  passwordReset = signal(false);
  invalidToken = signal(false);
  passwordStrength = signal(0);
  strengthClass = signal('');

  private token = '';

  constructor() {
    this.form = this.fb.group({
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: this.passwordMatchValidator });

    this.form.get('password')?.valueChanges.subscribe(password => {
      this.calculatePasswordStrength(password);
    });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    if (!this.token) {
      this.invalidToken.set(true);
    }
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

    const { password } = this.form.value;

    this.authService.resetPassword(this.token, password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.passwordReset.set(true);
        this.toastService.success('¡Éxito!', 'Tu contraseña ha sido actualizada');
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error.status === 400 || error.status === 404) {
          this.invalidToken.set(true);
        } else {
          this.errorMessage.set(error.error?.message || 'Error al restablecer la contraseña');
        }
      },
    });
  }
}
