import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRentalsPaymentFields1739221146000 implements MigrationInterface {
    name = 'AddRentalsPaymentFields1739221146000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Safe to run against Postgres / Supabase
        await queryRunner.query(`ALTER TABLE "washer_rentals" ADD COLUMN IF NOT EXISTS "is_paid" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "washer_rentals" ADD COLUMN IF NOT EXISTS "date_paid" date`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "washer_rentals" DROP COLUMN IF EXISTS "date_paid"`);
        await queryRunner.query(`ALTER TABLE "washer_rentals" DROP COLUMN IF EXISTS "is_paid"`);
    }
}
