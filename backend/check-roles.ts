import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from './src/modules/roles/entities/role.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const roleRepo = app.get<Repository<Role>>(getRepositoryToken(Role));
    const roles = await roleRepo.find();
    console.log('TOTAL_ROLES:', roles.length);
    console.log('ROLES_LIST:', JSON.stringify(roles, null, 2));
    await app.close();
}
bootstrap();
