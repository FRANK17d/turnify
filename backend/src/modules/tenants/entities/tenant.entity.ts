import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Service } from '../../services/entities/service.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { Booking } from '../../bookings/entities/booking.entity';

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  SUSPENDED = 'SUSPENDED',
}

@Entity('tenants')
export class Tenant extends AbstractEntity {
  @Column({ length: 255 })
  name: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  logo: string;

  @Column({ name: 'primary_color', length: 7, default: '#3B82F6' })
  primaryColor: string;

  @Column({ length: 50, nullable: true })
  timezone: string;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.ACTIVE,
  })
  status: TenantStatus;

  @Column({ name: 'stripe_customer_id', nullable: true })
  stripeCustomerId: string;

  @Column({
    type: 'jsonb',
    default: {},
    comment: 'Feature flags enabled for this tenant',
  })
  features: Record<string, boolean>;

  @OneToMany(() => User, (user) => user.tenant)
  users: User[];

  @OneToMany(() => Service, (service) => service.tenant)
  services: Service[];

  @OneToMany(() => Subscription, (subscription) => subscription.tenant)
  subscriptions: Subscription[];

  @OneToMany(() => Booking, (booking) => booking.tenant)
  bookings: Booking[];
}
