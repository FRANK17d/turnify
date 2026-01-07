import { Injectable, signal, computed } from '@angular/core';

export interface Toast {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSignal = signal<Toast[]>([]);

  toasts = computed(() => this.toastsSignal());

  show(message: string, type: Toast['type'] = 'info', duration = 5000, title?: string): void {
    const id = crypto.randomUUID();
    const toast: Toast = { id, message, type, duration, title };

    this.toastsSignal.update(toasts => [...toasts, toast]);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  success(titleOrMessage: string, message?: string, duration = 5000): void {
    if (message) {
      this.show(message, 'success', duration, titleOrMessage);
    } else {
      this.show(titleOrMessage, 'success', duration);
    }
  }

  error(titleOrMessage: string, message?: string, duration = 7000): void {
    if (message) {
      this.show(message, 'error', duration, titleOrMessage);
    } else {
      this.show(titleOrMessage, 'error', duration);
    }
  }

  warning(titleOrMessage: string, message?: string, duration = 5000): void {
    if (message) {
      this.show(message, 'warning', duration, titleOrMessage);
    } else {
      this.show(titleOrMessage, 'warning', duration);
    }
  }

  info(titleOrMessage: string, message?: string, duration = 5000): void {
    if (message) {
      this.show(message, 'info', duration, titleOrMessage);
    } else {
      this.show(titleOrMessage, 'info', duration);
    }
  }

  remove(id: string): void {
    this.toastsSignal.update(toasts => toasts.filter(t => t.id !== id));
  }

  clear(): void {
    this.toastsSignal.set([]);
  }
}
