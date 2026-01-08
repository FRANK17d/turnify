import { Module, Global, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import * as PgBossImport from 'pg-boss';

// Handle both CommonJS and ESM imports
const PgBoss = (PgBossImport as any).default || PgBossImport;

export const PG_BOSS = 'PG_BOSS';

@Global()
@Module({
    providers: [
        {
            provide: PG_BOSS,
            useFactory: async (configService: ConfigService) => {
                const host = configService.get<string>('database.host');
                const port = configService.get<number>('database.port');
                const username = configService.get<string>('database.username');
                const password = configService.get<string>('database.password');
                const database = configService.get<string>('database.database');
                const ssl = configService.get<boolean>('database.ssl');

                const connectionString = `postgres://${username}:${password}@${host}:${port}/${database}${ssl ? '?sslmode=require' : ''}`;

                console.log(`[PgBoss] Connecting to PostgreSQL: ${host}:${port}/${database}`);

                const boss = new PgBoss({
                    connectionString,
                    retryLimit: 3,
                    retryDelay: 5000,
                    retryBackoff: true,
                    expireInHours: 24,
                    archiveCompletedAfterSeconds: 3600,
                    deleteAfterDays: 7,
                });

                boss.on('error', (error) => {
                    console.error('[PgBoss] Error:', error.message);
                });

                await boss.start();
                console.log('[PgBoss] Started successfully ✅');

                return boss;
            },
            inject: [ConfigService],
        },
    ],
    exports: [PG_BOSS],
})
export class PgBossModule implements OnModuleDestroy {
    private readonly logger = new Logger(PgBossModule.name);

    constructor() { }

    async onModuleDestroy() {
        // La instancia se detendrá automáticamente
        this.logger.log('PgBoss module destroyed');
    }
}
