import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../audit.service';
import { AUDIT_KEY, AuditOptions } from '../decorators/audit.decorator';
import { AuditAction } from '../entities/audit-log.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditService: AuditService,
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditOptions = this.reflector.getAllAndOverride<AuditOptions & { skip?: boolean }>(
      AUDIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay decorador de auditoría o está marcado para omitir, continuar sin auditar
    if (!auditOptions || auditOptions.skip) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;

    // Determinar la acción basada en el método HTTP o la opción explícita
    // Determinar la acción basada en el método HTTP o la opción explícita
    let action: AuditAction | undefined;

    if (auditOptions.action) {
      if (auditOptions.action in AuditAction) {
        action = AuditAction[auditOptions.action as keyof typeof AuditAction];
      } else {
        action = auditOptions.action as AuditAction;
      }
    }

    if (!action) {
      switch (method) {
        case 'POST':
          action = AuditAction.CREATE;
          break;
        case 'PUT':
        case 'PATCH':
          action = AuditAction.UPDATE;
          break;
        case 'DELETE':
          action = AuditAction.DELETE;
          break;
        default:
          // No auditar GETs automáticamente
          return next.handle();
      }
    }

    if (!action) {
      return next.handle();
    }

    const entityId = request.params?.id;
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'];

    // Capturar el body original para CREATE/UPDATE
    const requestBody = { ...request.body };

    return next.handle().pipe(
      tap({
        next: (response) => {
          // Auditar después de una respuesta exitosa
          this.auditService.log({
            userId: user?.id,
            tenantId: user?.tenantId,
            action,
            entity: auditOptions.entity,
            entityId: entityId || response?.id,
            oldValue: action === AuditAction.UPDATE ? request.oldEntity : undefined,
            newValue: action === AuditAction.DELETE ? undefined : this.extractRelevantData(response, requestBody),
            ipAddress,
            userAgent,
          }).catch(() => {
            // Ignorar errores de auditoría para no afectar el flujo
          });
        },
        error: () => {
          // Opcionalmente auditar errores también
        },
      }),
    );
  }

  private getClientIp(request: any): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return request.ip || request.connection?.remoteAddress || 'unknown';
  }

  private extractRelevantData(response: any, requestBody: any): Record<string, any> {
    // Si la respuesta es un objeto con datos, usarla
    if (response && typeof response === 'object') {
      // Excluir campos sensibles y metadata innecesaria
      const { password, passwordHash, ...safeResponse } = response;
      return safeResponse;
    }
    // Fallback al body de la request
    return requestBody;
  }
}
