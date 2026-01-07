import { Entity, Column, ManyToOne, JoinColumn, ManyToMany, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Role } from '../../roles/entities/role.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';

export interface UserPreferences {
  emailNotifications?: boolean;
  inAppNotifications?: boolean;
  bookingReminders?: boolean;
  subscriptionAlerts?: boolean;
}

@Entity('users')
export class User extends AbstractEntity {
  @Column({ length: 255 })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'email_notifications', default: true })
  emailNotifications: boolean;

  @Column({ name: 'in_app_notifications', default: true })
  inAppNotifications: boolean;

  @Column({ type: 'jsonb', nullable: true })
  preferences: UserPreferences;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.users)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToMany(() => Role, (role) => role.users)
  roles: Role[];

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];
}
