import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1730000000000 implements MigrationInterface {
  name = 'InitialSchema1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "users_role_enum" AS ENUM('admin', 'user');
      CREATE TYPE "users_status_enum" AS ENUM('active', 'inactive');
      CREATE TYPE "transactions_type_enum" AS ENUM('deposit', 'withdraw', 'trade');
      CREATE TYPE "trades_type_enum" AS ENUM('buy', 'sell');
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(255) NOT NULL,
        "email" character varying(255) NOT NULL,
        "password" character varying(255) NOT NULL,
        "role" "users_role_enum" NOT NULL DEFAULT 'user',
        "status" "users_status_enum" NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`CREATE INDEX "idx_users_email" ON "users" ("email");`);
    await queryRunner.query(`CREATE INDEX "idx_users_status" ON "users" ("status");`);

    await queryRunner.query(`
      CREATE TABLE "wallets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "balance" numeric(20,8) NOT NULL DEFAULT 0,
        "currency" character varying(10) NOT NULL DEFAULT 'LAK',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_wallets_user_id" UNIQUE ("user_id"),
        CONSTRAINT "CHK_wallets_balance_nonneg" CHECK ("balance" >= 0),
        CONSTRAINT "PK_wallets" PRIMARY KEY ("id"),
        CONSTRAINT "FK_wallets_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_wallets_user_id" ON "wallets" ("user_id");`);

    await queryRunner.query(`
      CREATE TABLE "gold_holdings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "gold_amount" numeric(20,8) NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_gold_holdings_user_id" UNIQUE ("user_id"),
        CONSTRAINT "CHK_gold_holdings_amount_nonneg" CHECK ("gold_amount" >= 0),
        CONSTRAINT "PK_gold_holdings" PRIMARY KEY ("id"),
        CONSTRAINT "FK_gold_holdings_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_gold_holdings_user_id" ON "gold_holdings" ("user_id");`,
    );

    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "type" "transactions_type_enum" NOT NULL,
        "amount" numeric(20,8) NOT NULL,
        "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL,
        "reference_id" uuid,
        "description" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transactions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_transactions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX "idx_transactions_user_id" ON "transactions" ("user_id");`);
    await queryRunner.query(`CREATE INDEX "idx_transactions_type" ON "transactions" ("type");`);
    await queryRunner.query(`CREATE INDEX "idx_transactions_timestamp" ON "transactions" ("timestamp");`);
    await queryRunner.query(
      `CREATE INDEX "idx_transactions_user_type_ts" ON "transactions" ("user_id", "type", "timestamp");`,
    );

    await queryRunner.query(`
      CREATE TABLE "trades" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "type" "trades_type_enum" NOT NULL,
        "gold_amount" numeric(20,8) NOT NULL,
        "price_per_gram" numeric(20,8) NOT NULL,
        "total_cost" numeric(20,8) NOT NULL,
        "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_trades" PRIMARY KEY ("id"),
        CONSTRAINT "FK_trades_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX "idx_trades_user_id" ON "trades" ("user_id");`);
    await queryRunner.query(`CREATE INDEX "idx_trades_type" ON "trades" ("type");`);
    await queryRunner.query(`CREATE INDEX "idx_trades_timestamp" ON "trades" ("timestamp");`);
    await queryRunner.query(
      `CREATE INDEX "idx_trades_user_type_ts" ON "trades" ("user_id", "type", "timestamp");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "trades"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "gold_holdings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wallets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "trades_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "transactions_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
  }
}
