import {MigrationInterface, QueryRunner} from "typeorm";

export class InitialCreate1613836037397 implements MigrationInterface {
    name = 'InitialCreate1613836037397'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "compose_version" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "directory" character varying(255) NOT NULL, "serviceName" character varying(255), "serviceEnabled" boolean NOT NULL, "composeId" uuid, CONSTRAINT "PK_333279ee6f87f72849ff55d6061" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tenant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), CONSTRAINT "PK_da8c6efd67bb301e810e56ac139" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "node" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "enabled" boolean NOT NULL, "name" character varying(255) NOT NULL, "host" character varying(255) NOT NULL, "port" integer NOT NULL, "username" text NOT NULL, "password" bytea, "privateKey" bytea, "tenantId" uuid, CONSTRAINT "CHK_07942fba19395d032b50321343" CHECK (("password" IS NOT NULL AND "privateKey" is NULL) OR ("privateKey" IS NOT NULL AND "password" is NULL)), CONSTRAINT "PK_8c8caf5f29d25264abe9eaf94dd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "deployment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "enabled" boolean NOT NULL, "composeId" uuid, "lastDeployedVersionId" uuid, "nodeId" uuid, CONSTRAINT "UQ_c301327e93da46010d5b0c6cddd" UNIQUE ("composeId", "nodeId"), CONSTRAINT "PK_ee1f952fc81f37c6fea69c2e248" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "compose" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "pendingDelete" boolean NOT NULL DEFAULT false, "currentId" uuid NOT NULL, "tenantId" uuid, CONSTRAINT "REL_29d45d9b900ed30b14a8c98ecf" UNIQUE ("currentId"), CONSTRAINT "PK_abb31c992bc7dd346cd651d61a3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "compose_version" ADD CONSTRAINT "FK_c4133a06c218eb1b92c7bc82544" FOREIGN KEY ("composeId") REFERENCES "compose"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "node" ADD CONSTRAINT "FK_a92995d1d191fcd6b94e3bbb07e" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "deployment" ADD CONSTRAINT "FK_96cb6fa0be2b53a7db9e32d3501" FOREIGN KEY ("composeId") REFERENCES "compose"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "deployment" ADD CONSTRAINT "FK_67c5aa9e5e842e24d70c3854a86" FOREIGN KEY ("lastDeployedVersionId") REFERENCES "compose_version"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "deployment" ADD CONSTRAINT "FK_105e7ccd19aa0ca376551a96c2a" FOREIGN KEY ("nodeId") REFERENCES "node"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "compose" ADD CONSTRAINT "FK_55a3819659ddb9f787d0b223883" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "compose" ADD CONSTRAINT "FK_29d45d9b900ed30b14a8c98ecf6" FOREIGN KEY ("currentId") REFERENCES "compose_version"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY DEFERRED`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "compose" DROP CONSTRAINT "FK_29d45d9b900ed30b14a8c98ecf6"`);
        await queryRunner.query(`ALTER TABLE "compose" DROP CONSTRAINT "FK_55a3819659ddb9f787d0b223883"`);
        await queryRunner.query(`ALTER TABLE "deployment" DROP CONSTRAINT "FK_105e7ccd19aa0ca376551a96c2a"`);
        await queryRunner.query(`ALTER TABLE "deployment" DROP CONSTRAINT "FK_67c5aa9e5e842e24d70c3854a86"`);
        await queryRunner.query(`ALTER TABLE "deployment" DROP CONSTRAINT "FK_96cb6fa0be2b53a7db9e32d3501"`);
        await queryRunner.query(`ALTER TABLE "node" DROP CONSTRAINT "FK_a92995d1d191fcd6b94e3bbb07e"`);
        await queryRunner.query(`ALTER TABLE "compose_version" DROP CONSTRAINT "FK_c4133a06c218eb1b92c7bc82544"`);
        await queryRunner.query(`DROP TABLE "compose"`);
        await queryRunner.query(`DROP TABLE "deployment"`);
        await queryRunner.query(`DROP TABLE "node"`);
        await queryRunner.query(`DROP TABLE "tenant"`);
        await queryRunner.query(`DROP TABLE "compose_version"`);
    }

}
