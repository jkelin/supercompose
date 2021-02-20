import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialCreate1613814157415 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tenant" (
        id uuid NOT NULL PRIMARY KEY
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "compose" (
        "id" uuid NOT NULL PRIMARY KEY,
        "name" varchar(255) NOT NULL,
        "tenantId" uuid NULL,
        "pendingDelete" bool NOT NULL DEFAULT false,
        "currentId" uuid NOT NULL UNIQUE,
        CONSTRAINT "FK_55a3819659ddb9f787d0b223883" FOREIGN KEY ("tenantId") REFERENCES tenant(id) ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "compose_version" (
        "id" uuid NOT NULL PRIMARY KEY,
        "content" text NOT NULL,
        "directory" varchar(255) NOT NULL,
        "serviceName" varchar(255) NULL,
        "serviceEnabled" bool NOT NULL,
        "composeId" uuid NOT NULL
      );
    `);

    await queryRunner.query(`
      ALTER TABLE "compose" 
      ADD CONSTRAINT FK_29d45d9b900ed30b14a8c98ecf6 
      FOREIGN KEY ("currentId") 
      REFERENCES "compose_version" ("id")
      DEFERRABLE INITIALLY DEFERRED;
    `);

    await queryRunner.query(`
      ALTER TABLE "compose_version" 
      ADD CONSTRAINT FK_c4133a06c218eb1b92c7bc82544 
      FOREIGN KEY ("composeId") 
      REFERENCES compose ("id")
      ON DELETE CASCADE
      DEFERRABLE INITIALLY DEFERRED;
    `);

    await queryRunner.query(`
      CREATE TABLE "node" (
        "id" uuid NOT NULL PRIMARY KEY,
        "enabled" bool NOT NULL,
        "name" varchar(255) NOT NULL,
        "host" varchar(255) NOT NULL,
        "port" int4 NOT NULL,
        "username" text NOT NULL,
        "password" bytea NULL,
        "privateKey" bytea NULL,
        "tenantId" uuid NULL,
        CONSTRAINT "CHK_07942fba19395d032b50321343" CHECK ((((password IS NOT NULL) AND ("privateKey" IS NULL)) OR (("privateKey" IS NOT NULL) AND (password IS NULL)))),
        CONSTRAINT "FK_a92995d1d191fcd6b94e3bbb07e" FOREIGN KEY ("tenantId") REFERENCES tenant(id) ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "deployment" (
        "id" uuid NOT NULL PRIMARY KEY,
        "enabled" bool NOT NULL,
        "composeId" uuid NOT NULL,
        "lastDeployedVersionId" uuid NULL,
        "nodeId" uuid NOT NULL,
        CONSTRAINT "UQ_c301327e93da46010d5b0c6cddd" UNIQUE ("composeId", "nodeId"),
        CONSTRAINT "FK_105e7ccd19aa0ca376551a96c2a" FOREIGN KEY ("nodeId") REFERENCES node(id) ON DELETE CASCADE,
        CONSTRAINT "FK_67c5aa9e5e842e24d70c3854a86" FOREIGN KEY ("lastDeployedVersionId") REFERENCES compose_version(id),
        CONSTRAINT "FK_96cb6fa0be2b53a7db9e32d3501" FOREIGN KEY ("composeId") REFERENCES compose(id) ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE public.node');
  }
}
