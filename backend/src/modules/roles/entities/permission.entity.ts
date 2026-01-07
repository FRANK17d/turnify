import { Entity, Column, ManyToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/base.entity';
import { Role } from './role.entity';

@Entity('permissions')
export class Permission extends AbstractEntity {
  @Column({ length: 50, unique: true })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ length: 50 })
  module: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
