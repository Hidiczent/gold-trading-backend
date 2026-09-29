import { MigrationInterface, QueryRunner } from 'typeorm';

export class BroadcastsTable1730000000001 implements MigrationInterface {
  name = 'BroadcastsTable1730000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "broadcasts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" character varying(255) NOT NULL,
        "message" text NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "expires_at" TIMESTAMP WITH TIME ZONE,
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_broadcasts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_broadcasts_admin" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX "idx_broadcasts_active" ON "broadcasts" ("is_active");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "broadcasts"`);
  }
}
