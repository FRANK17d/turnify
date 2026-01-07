import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserPreferences1704470400000 implements MigrationInterface {
  name = 'AddUserPreferences1704470400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna preferences a la tabla users si no existe
    const table = await queryRunner.getTable('users');
    const hasPreferences = table?.columns.find(col => col.name === 'preferences');
    
    if (!hasPreferences) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'preferences',
          type: 'jsonb',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'preferences');
  }
}
