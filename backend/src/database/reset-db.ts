import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { join } from 'path';

// Cargar variables de entorno
config({ path: join(__dirname, '../../.env') });

async function resetDatabase() {
    console.log('🗑️  Eliminando todas las tablas de la base de datos...');

    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'turnify',
        synchronize: false,
    });

    try {
        await dataSource.initialize();
        console.log('✅ Conectado a la base de datos');

        // Eliminar schema public y recrearlo
        await dataSource.query('DROP SCHEMA public CASCADE');
        await dataSource.query('CREATE SCHEMA public');
        await dataSource.query('GRANT ALL ON SCHEMA public TO postgres');
        await dataSource.query('GRANT ALL ON SCHEMA public TO public');

        console.log('✅ Base de datos eliminada y recreada');
        console.log('🔄 Reinicia el backend para que se creen las tablas y se ejecute el seed');

        await dataSource.destroy();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

resetDatabase();
