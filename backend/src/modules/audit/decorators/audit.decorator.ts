import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';

export interface AuditOptions {
  entity: string;
  action?: string;
  skip?: boolean;
}

/**
 * Decorador para marcar endpoints que deben ser auditados automáticamente
 * @param entity Nombre de la entidad a auditar
 * @param action Acción opcional (se infiere del método HTTP si no se especifica)
 *               Puede ser cualquier string descriptivo de la acción
 */
export const Auditable = (entity: string, action?: string) =>
  SetMetadata(AUDIT_KEY, { entity, action } as AuditOptions);

/**
 * Decorador para excluir un endpoint de la auditoría automática
 */
export const NoAudit = () => SetMetadata(AUDIT_KEY, { skip: true });
