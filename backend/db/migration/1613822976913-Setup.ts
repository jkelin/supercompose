import {MigrationInterface, QueryRunner} from "typeorm";

export class Setup1613822976913 implements MigrationInterface {
    name = 'Setup1613822976913'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "compose_version" DROP CONSTRAINT "fk_c4133a06c218eb1b92c7bc82544"`);
        await queryRunner.query(`ALTER TABLE "compose" DROP CONSTRAINT "fk_29d45d9b900ed30b14a8c98ecf6"`);
        await queryRunner.query(`ALTER TABLE "deployment" DROP CONSTRAINT "FK_67c5aa9e5e842e24d70c3854a86"`);
        await queryRunner.query(`COMMENT ON COLUMN "compose_version"."id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "compose" DROP CONSTRAINT "FK_55a3819659ddb9f787d0b223883"`);
        await queryRunner.query(`ALTER TABLE "node" DROP CONSTRAINT "FK_a92995d1d191fcd6b94e3bbb07e"`);
        await queryRunner.query(`COMMENT ON COLUMN "tenant"."id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "deployment" DROP CONSTRAINT "FK_105e7ccd19aa0ca376551a96c2a"`);
        await queryRunner.query(`COMMENT ON COLUMN "node"."id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "deployment" DROP CONSTRAINT "FK_96cb6fa0be2b53a7db9e32d3501"`);
        await queryRunner.query(`ALTER TABLE "deployment" DROP CONSTRAINT "UQ_c301327e93da46010d5b0c6cddd"`);
        await queryRunner.query(`COMMENT ON COLUMN "deployment"."id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "deployment" ALTER COLUMN "composeId" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "deployment"."composeId" IS NULL`);
        await queryRunner.query(`ALTER TABLE "deployment" ALTER COLUMN "nodeId" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "deployment"."nodeId" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "compose"."id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "compose" ALTER COLUMN "currentId" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "compose"."currentId" IS NULL`);
        await queryRunner.query(`ALTER TABLE "deployment" ADD CONSTRAINT "UQ_c301327e93da46010d5b0c6cddd" UNIQUE ("composeId", "nodeId")`);
        await queryRunner.query(`ALTER TABLE "compose_version" ADD CONSTRAINT "FK_c4133a06c218eb1b92c7bc82544" FOREIGN KEY ("composeId") REFERENCES "compose"("id") ON DELETE CASCADE ON UPDATE NO ACTION DEFERRABLE INITIALLY DEFERRED`);
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
        await queryRunner.query(`ALTER TABLE "deployment" DROP CONSTRAINT "UQ_c301327e93da46010d5b0c6cddd"`);
        await queryRunner.query(`COMMENT ON COLUMN "compose"."currentId" IS NULL`);
        await queryRunner.query(`ALTER TABLE "compose" ALTER COLUMN "currentId" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "compose"."id" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "deployment"."nodeId" IS NULL`);
        await queryRunner.query(`ALTER TABLE "deployment" ALTER COLUMN "nodeId" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "deployment"."composeId" IS NULL`);
        await queryRunner.query(`ALTER TABLE "deployment" ALTER COLUMN "composeId" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "deployment"."id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "deployment" ADD CONSTRAINT "UQ_c301327e93da46010d5b0c6cddd" UNIQUE ("composeId", "nodeId")`);
        await queryRunner.query(`ALTER TABLE "deployment" ADD CONSTRAINT "FK_96cb6fa0be2b53a7db9e32d3501" FOREIGN KEY ("composeId") REFERENCES "compose"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`COMMENT ON COLUMN "node"."id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "deployment" ADD CONSTRAINT "FK_105e7ccd19aa0ca376551a96c2a" FOREIGN KEY ("nodeId") REFERENCES "node"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`COMMENT ON COLUMN "tenant"."id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "node" ADD CONSTRAINT "FK_a92995d1d191fcd6b94e3bbb07e" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "compose" ADD CONSTRAINT "FK_55a3819659ddb9f787d0b223883" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`COMMENT ON COLUMN "compose_version"."id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "deployment" ADD CONSTRAINT "FK_67c5aa9e5e842e24d70c3854a86" FOREIGN KEY ("lastDeployedVersionId") REFERENCES "compose_version"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "compose" ADD CONSTRAINT "fk_29d45d9b900ed30b14a8c98ecf6" FOREIGN KEY ("currentId") REFERENCES "compose_version"("id") ON DELETE NO ACTION ON UPDATE NO ACTION DEFERRABLE INITIALLY DEFERRED`);
        await queryRunner.query(`ALTER TABLE "compose_version" ADD CONSTRAINT "fk_c4133a06c218eb1b92c7bc82544" FOREIGN KEY ("composeId") REFERENCES "compose"("id") ON DELETE CASCADE ON UPDATE NO ACTION DEFERRABLE INITIALLY DEFERRED`);
    }

}
