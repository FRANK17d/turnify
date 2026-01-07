import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Tenant, TenantStatus } from '../modules/tenants/entities/tenant.entity';
import { User } from '../modules/users/entities/user.entity';
import { Role } from '../modules/roles/entities/role.entity';
import { Permission } from '../modules/roles/entities/permission.entity';
import { Plan } from '../modules/subscriptions/entities/plan.entity';
import { Subscription, SubscriptionStatus } from '../modules/subscriptions/entities/subscription.entity';
import { Service } from '../modules/services/entities/service.entity';

export async function seedDatabase(dataSource: DataSource) {
  console.log('🌱 Starting database seed...');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ==================== PERMISSIONS ====================
    const permissionsData = [
      { name: 'SUPER_ADMIN', description: 'Permiso de Super Administrador', module: 'admin' },
      { name: 'MANAGE_USERS', description: 'Gestionar usuarios', module: 'users' },
      { name: 'VIEW_USERS', description: 'Ver usuarios', module: 'users' },
      { name: 'MANAGE_SERVICES', description: 'Gestionar servicios', module: 'services' },
      { name: 'VIEW_SERVICES', description: 'Ver servicios', module: 'services' },
      { name: 'MANAGE_BOOKINGS', description: 'Gestionar reservas', module: 'bookings' },
      { name: 'CREATE_BOOKING', description: 'Crear reservas', module: 'bookings' },
      { name: 'VIEW_BOOKINGS', description: 'Ver reservas', module: 'bookings' },
      { name: 'VIEW_REPORTS', description: 'Ver reportes', module: 'reports' },
      { name: 'MANAGE_SETTINGS', description: 'Gestionar configuración', module: 'settings' },
      { name: 'MANAGE_BRANDING', description: 'Gestionar branding', module: 'settings' },
      { name: 'MANAGE_ROLES', description: 'Gestionar roles', module: 'roles' },
      { name: 'MANAGE_TENANTS', description: 'Gestionar tenants (Super Admin)', module: 'admin' },
      { name: 'VIEW_AUDIT', description: 'Ver auditoría', module: 'audit' },
    ];

    const permissions: Permission[] = [];
    for (const perm of permissionsData) {
      const existing = await queryRunner.manager.findOne(Permission, {
        where: { name: perm.name },
      });
      if (!existing) {
        const permission = queryRunner.manager.create(Permission, perm);
        permissions.push(await queryRunner.manager.save(permission));
      } else {
        permissions.push(existing);
      }
    }
    console.log('✅ Permissions created');

    // ==================== ROLES ====================
    const rolesData = [
      {
        name: 'SUPER_ADMIN',
        description: 'Super Administrador del sistema',
        isSystem: true,
        isGlobal: true,
        permissions: permissions, // Todos los permisos
      },
      {
        name: 'ADMIN_EMPRESA',
        description: 'Administrador de empresa',
        isSystem: true,
        isGlobal: true,
        permissions: permissions.filter((p) =>
          ['MANAGE_USERS', 'VIEW_USERS', 'MANAGE_SERVICES', 'VIEW_SERVICES',
            'MANAGE_BOOKINGS', 'VIEW_BOOKINGS', 'VIEW_REPORTS', 'MANAGE_SETTINGS',
            'MANAGE_BRANDING', 'MANAGE_ROLES', 'VIEW_AUDIT'].includes(p.name),
        ),
      },
      {
        name: 'CLIENTE',
        description: 'Cliente de la empresa',
        isSystem: true,
        isGlobal: true,
        permissions: permissions.filter((p) =>
          ['VIEW_SERVICES', 'CREATE_BOOKING', 'VIEW_BOOKINGS'].includes(p.name),
        ),
      },
    ];

    const roles: Role[] = [];
    for (const roleData of rolesData) {
      let role = await queryRunner.manager.findOne(Role, {
        where: { name: roleData.name },
        relations: ['permissions'],
      });
      if (!role) {
        role = queryRunner.manager.create(Role, {
          name: roleData.name,
          description: roleData.description,
          isSystem: roleData.isSystem,
          isGlobal: roleData.isGlobal,
          permissions: roleData.permissions,
        });
      } else {
        // Update existing role to ensure it's global/system
        role.description = roleData.description;
        role.isSystem = roleData.isSystem;
        role.isGlobal = roleData.isGlobal;
        role.permissions = roleData.permissions;
      }
      role = await queryRunner.manager.save(role);
      roles.push(role);
    }
    console.log('✅ Roles created');

    // ==================== PLANS ====================
    const plansData = [
      {
        name: 'FREE',
        description: 'Plan gratuito con funcionalidades limitadas',
        price: 0,
        billingPeriod: 'monthly',
        maxUsers: 2,
        maxBookingsPerMonth: 50,
        maxServices: 3,
        features: {
          analytics: false,
          customBranding: false,
          prioritySupport: false,
          apiAccess: false,
        },
      },
      {
        name: 'PRO',
        description: 'Plan profesional sin límites',
        price: 29.99,
        billingPeriod: 'monthly',
        maxUsers: -1,
        maxBookingsPerMonth: -1,
        maxServices: -1,
        features: {
          analytics: true,
          customBranding: true,
          prioritySupport: true,
          apiAccess: true,
        },
      },
      {
        name: 'ENTERPRISE',
        description: 'Plan interno ilimitado para administración del sistema',
        price: 0,
        billingPeriod: 'yearly',
        maxUsers: -1,
        maxBookingsPerMonth: -1,
        maxServices: -1,
        isActive: false, // Plan interno oculto
        features: {
          analytics: true,
          customBranding: true,
          prioritySupport: true,
          apiAccess: true,
          whiteLabel: true,
        },
      },
    ];

    for (const planData of plansData) {
      const existing = await queryRunner.manager.findOne(Plan, {
        where: { name: planData.name },
      });
      if (!existing) {
        const plan = queryRunner.manager.create(Plan, planData);
        await queryRunner.manager.save(plan);
      }
    }
    console.log('✅ Plans created');

    // ==================== SUPER ADMIN TENANT & USER ====================
    let superTenant: Tenant | null = await queryRunner.manager.findOne(Tenant, {
      where: { slug: 'turnify-admin' },
    });
    if (!superTenant) {
      const newTenant = queryRunner.manager.create(Tenant, {
        name: 'Turnify Admin',
        slug: 'turnify-admin',
        status: TenantStatus.ACTIVE,
        primaryColor: '#3B82F6',
      });
      superTenant = await queryRunner.manager.save(newTenant);
    }

    const superAdminRole = roles.find((r) => r.name === 'SUPER_ADMIN')!;
    let superAdmin = await queryRunner.manager.findOne(User, {
      where: { email: 'admin@turnify.com' },
    });
    if (!superAdmin && superTenant) {
      const hashedPassword = await bcrypt.hash('Admin123!', 12);
      superAdmin = queryRunner.manager.create(User, {
        email: 'admin@turnify.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        tenantId: superTenant.id,
        isActive: true,
        emailVerified: true,
        roles: [superAdminRole],
      });
      await queryRunner.manager.save(superAdmin);
    }
    console.log('✅ Super Admin created');

    // ==================== DEMO TENANT ====================
    let demoTenant: Tenant | null = await queryRunner.manager.findOne(Tenant, {
      where: { slug: 'demo-empresa' },
    });
    if (!demoTenant) {
      const newDemoTenant = queryRunner.manager.create(Tenant, {
        name: 'Demo Empresa',
        slug: 'demo-empresa',
        status: TenantStatus.ACTIVE,
        primaryColor: '#10B981',
      });
      demoTenant = await queryRunner.manager.save(newDemoTenant);
    }

    const adminEmpresaRole = roles.find((r) => r.name === 'ADMIN_EMPRESA')!;
    const clienteRole = roles.find((r) => r.name === 'CLIENTE')!;

    let demoAdmin = await queryRunner.manager.findOne(User, {
      where: { email: 'admin@demo.com' },
    });
    if (!demoAdmin && demoTenant) {
      const hashedPassword = await bcrypt.hash('Demo123!', 12);
      demoAdmin = queryRunner.manager.create(User, {
        email: 'admin@demo.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Demo',
        tenantId: demoTenant.id,
        isActive: true,
        emailVerified: true,
        roles: [adminEmpresaRole],
      });
      await queryRunner.manager.save(demoAdmin);
    }

    let demoClient = await queryRunner.manager.findOne(User, {
      where: { email: 'cliente@demo.com' },
    });
    if (!demoClient && demoTenant) {
      const hashedPassword = await bcrypt.hash('Cliente123!', 12);
      demoClient = queryRunner.manager.create(User, {
        email: 'cliente@demo.com',
        password: hashedPassword,
        firstName: 'Cliente',
        lastName: 'Demo',
        tenantId: demoTenant.id,
        isActive: true,
        emailVerified: true,
        roles: [clienteRole],
      });
      await queryRunner.manager.save(demoClient);
    }
    console.log('✅ Demo Tenant and Users created');

    // ==================== SUBSCRIPTIONS ====================
    const freePlan = await queryRunner.manager.findOne(Plan, { where: { name: 'FREE' } });
    const enterprisePlan = await queryRunner.manager.findOne(Plan, { where: { name: 'ENTERPRISE' } });

    // Suscripción ENTERPRISE para Super Admin Tenant
    if (superTenant && enterprisePlan) {
      const existingSub = await queryRunner.manager.findOne(Subscription, {
        where: { tenantId: superTenant.id },
      });
      if (!existingSub) {
        const subscription = queryRunner.manager.create(Subscription, {
          tenantId: superTenant.id,
          planId: enterprisePlan.id,
          status: SubscriptionStatus.ACTIVE,
        });
        await queryRunner.manager.save(subscription);
      } else {
        // Force update to Enterprise if it exists but is wrong
        existingSub.planId = enterprisePlan.id;
        await queryRunner.manager.save(existingSub);
      }
    }

    // Suscripción FREE para Demo Tenant
    if (demoTenant && freePlan) {
      const existingSub = await queryRunner.manager.findOne(Subscription, {
        where: { tenantId: demoTenant.id },
      });
      if (!existingSub) {
        const subscription = queryRunner.manager.create(Subscription, {
          tenantId: demoTenant.id,
          planId: freePlan.id,
          status: SubscriptionStatus.ACTIVE,
        });
        await queryRunner.manager.save(subscription);
      }
    }
    console.log('✅ Subscriptions created');

    // ==================== DEMO SERVICES ====================
    if (demoTenant) {
      const existingServices = await queryRunner.manager.count(Service, {
        where: { tenantId: demoTenant.id },
      });
      if (existingServices === 0) {
        const servicesData = [
          { name: 'Corte de Cabello', description: 'Corte profesional para hombres', price: 25.00, duration: 30, isActive: true, tenantId: demoTenant.id },
          { name: 'Corte + Barba', description: 'Corte de cabello y arreglo de barba', price: 40.00, duration: 45, isActive: true, tenantId: demoTenant.id },
          { name: 'Tinte', description: 'Coloración profesional', price: 50.00, duration: 60, isActive: true, tenantId: demoTenant.id },
        ];
        for (const serviceData of servicesData) {
          const service = queryRunner.manager.create(Service, serviceData);
          await queryRunner.manager.save(service);
        }
      }
    }
    console.log('✅ Demo Services created');

    await queryRunner.commitTransaction();
    console.log('🎉 Database seed completed successfully!');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
