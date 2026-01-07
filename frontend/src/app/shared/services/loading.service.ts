import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingCountSignal = signal(0);

  isLoading = computed(() => this.loadingCountSignal() > 0);

  show(): void {
    this.loadingCountSignal.update(count => count + 1);
  }

  hide(): void {
    this.loadingCountSignal.update(count => Math.max(0, count - 1));
  }

  reset(): void {
    this.loadingCountSignal.set(0);
  }
}
