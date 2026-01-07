import { Injectable, inject, signal } from '@angular/core';
import { TenantsService, Tenant } from './tenants.service';

export interface BrandingConfig {
    name: string;
    logo: string | null;
    primaryColor: string;
    primaryColorDark: string;
    primaryColorLight: string;
}

@Injectable({
    providedIn: 'root'
})
export class BrandingService {
    private tenantsService = inject(TenantsService);

    // Default branding
    private defaultBranding: BrandingConfig = {
        name: 'Turnify',
        logo: null,
        primaryColor: '#3b82f6',
        primaryColorDark: '#2563eb',
        primaryColorLight: '#dbeafe',
    };

    // Current branding as signal for reactive updates
    branding = signal<BrandingConfig>(this.defaultBranding);
    isLoaded = signal(false);

    /**
     * Load branding from the current tenant
     */
    loadBranding(): void {
        this.tenantsService.getCurrentTenant().subscribe({
            next: (tenant: Tenant) => {
                this.applyBranding({
                    name: tenant.name || this.defaultBranding.name,
                    logo: tenant.logo || null,
                    primaryColor: tenant.primaryColor || this.defaultBranding.primaryColor,
                    primaryColorDark: this.darkenColor(tenant.primaryColor || this.defaultBranding.primaryColor, 15),
                    primaryColorLight: this.lightenColor(tenant.primaryColor || this.defaultBranding.primaryColor, 40),
                });
                this.isLoaded.set(true);
            },
            error: () => {
                // Use defaults if can't load tenant
                this.applyBranding(this.defaultBranding);
                this.isLoaded.set(true);
            },
        });
    }

    /**
     * Apply branding to the app by setting CSS custom properties
     */
    applyBranding(config: BrandingConfig): void {
        this.branding.set(config);

        // Apply CSS custom properties to :root
        const root = document.documentElement;
        root.style.setProperty('--primary-color', config.primaryColor);
        root.style.setProperty('--primary-color-dark', config.primaryColorDark);
        root.style.setProperty('--primary-color-light', config.primaryColorLight);

        // Update document title
        document.title = config.name;
    }

    /**
     * Update branding when tenant settings change
     */
    updateBranding(updates: Partial<BrandingConfig>): void {
        const current = this.branding();
        const newConfig = { ...current, ...updates };

        // Recalculate derived colors if primary changed
        if (updates.primaryColor) {
            newConfig.primaryColorDark = this.darkenColor(updates.primaryColor, 15);
            newConfig.primaryColorLight = this.lightenColor(updates.primaryColor, 40);
        }

        this.applyBranding(newConfig);
    }

    /**
     * Darken a hex color by a percentage
     */
    private darkenColor(hex: string, percent: number): string {
        return this.adjustColor(hex, -percent);
    }

    /**
     * Lighten a hex color by a percentage
     */
    private lightenColor(hex: string, percent: number): string {
        return this.adjustColor(hex, percent);
    }

    /**
     * Adjust a hex color brightness
     */
    private adjustColor(hex: string, percent: number): string {
        // Remove # if present
        hex = hex.replace('#', '');

        // Parse RGB
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);

        // Adjust
        r = Math.min(255, Math.max(0, r + (r * percent) / 100));
        g = Math.min(255, Math.max(0, g + (g * percent) / 100));
        b = Math.min(255, Math.max(0, b + (b * percent) / 100));

        // Convert back to hex
        return '#' +
            Math.round(r).toString(16).padStart(2, '0') +
            Math.round(g).toString(16).padStart(2, '0') +
            Math.round(b).toString(16).padStart(2, '0');
    }

    /**
     * Get contrast color (black or white) for a given background
     */
    getContrastColor(hex: string): string {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#000000' : '#ffffff';
    }
}
