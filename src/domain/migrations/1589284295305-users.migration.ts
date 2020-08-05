import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class Users1589284295305 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true
          },
          {
            name: 'role',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'mobile',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'password',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'is_sms_two_fa',
            type: 'boolean',
            isNullable: true,
          },
          {
            name: 'info',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'is_blocked',
            type: 'boolean',
          },
          {
            name: 'is_email_verified',
            type: 'boolean',
            isNullable: true,
          },
          {
            name: 'is_mobile_verified',
            type: 'boolean',
            isNullable: true,
          },
          {
            name: 'providers',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'updated',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
      }),
      true,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users', true);
  }
}
