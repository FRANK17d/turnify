import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class TenantThrottlerGuard extends ThrottlerGuard {
    protected async getTracker(req: Record<string, any>): Promise<string> {
        // Si el usuario está autenticado, usar su tenantId
        if (req.user && req.user.tenantId) {
            return `tenant-${req.user.tenantId}`;
        }

        // Si no, usar la IP (fallback para endpoints públicos/auth)
        return req.ips.length ? req.ips[0] : req.ip;
    }

    // Opcional: Personalizar el mensaje de error si se desea
    protected errorMessage = 'Has excedido el límite de peticiones para tu empresa. Por favor intenta más tarde.';
}
