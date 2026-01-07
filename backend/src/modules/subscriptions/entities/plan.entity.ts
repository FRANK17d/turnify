import { Entity, Column } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/base.entity';

@Entity('plans')
export class Plan extends AbstractEntity {
  @Column({ length: 50, unique: true })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'billing_period', length: 20, default: 'monthly' })
  billingPeriod: string;

  @Column({ name: 'max_users', type: 'int', default: -1 })
  maxUsers: number; // -1 = ilimitado

  @Column({ name: 'max_bookings_per_month', type: 'int', default: -1 })
  maxBookingsPerMonth: number; // -1 = ilimitado

  @Column({ name: 'max_services', type: 'int', default: -1 })
  maxServices: number; // -1 = ilimitado

  @Column({ name: 'stripe_price_id', nullable: true })
  stripePriceId: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  features: Record<string, boolean>;
}
