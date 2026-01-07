import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Permission } from './permission.entity';

@Entity('roles')
export class Role extends AbstractEntity {
  @Column({ length: 50 })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ name: 'tenant_id', nullable: true })
  tenantId: string;

  @Column({ name: 'is_system', default: false })
  isSystem: boolean;

  @Column({ name: 'is_global', default: false })
  isGlobal: boolean;

  @ManyToMany(() => User, (user) => user.roles)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  users: User[];

  @ManyToMany(() => Permission, (permission) => permission.roles)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];
}
