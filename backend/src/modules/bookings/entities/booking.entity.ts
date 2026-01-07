import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Service } from '../../services/entities/service.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

@Entity('bookings')
export class Booking extends AbstractEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'service_id' })
  serviceId: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamptz' })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'reminder_sent', default: false })
  reminderSent: boolean;

  @ManyToOne(() => User, (user) => user.bookings)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Service, (service) => service.bookings)
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @ManyToOne(() => Tenant, (tenant) => tenant.bookings)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}

