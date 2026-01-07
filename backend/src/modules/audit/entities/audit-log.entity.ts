import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  // Tenant actions
  UPDATE_BRANDING = 'UPDATE_BRANDING',
  UPDATE_STATUS = 'UPDATE_STATUS',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
  // Subscription actions
  CREATE_CHECKOUT = 'CREATE_CHECKOUT',
  ACCESS_BILLING_PORTAL = 'ACCESS_BILLING_PORTAL',
  CANCEL = 'CANCEL',
  RESUME = 'RESUME',
  CHANGE_PLAN = 'CHANGE_PLAN',
}

@Entity('audit_logs')
export class AuditLog extends AbstractEntity {
  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'tenant_id', nullable: true })
  tenantId?: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({ length: 100 })
  entity: string;

  @Column({ name: 'entity_id', nullable: true })
  entityId?: string;

  @Column({ name: 'old_value', type: 'jsonb', nullable: true })
  oldValue?: Record<string, any>;

  @Column({ name: 'new_value', type: 'jsonb', nullable: true })
  newValue?: Record<string, any>;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;
}
