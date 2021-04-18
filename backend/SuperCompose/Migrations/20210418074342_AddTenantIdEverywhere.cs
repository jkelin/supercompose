using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace SuperCompose.Migrations
{
    public partial class AddTenantIdEverywhere : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
          migrationBuilder.Sql(@"INSERT INTO ""Tenants"" (""Id"") VALUES ('00000000-0000-0000-0000-000000000000')");
          
            migrationBuilder.Sql(@"UPDATE ""ConnectionLogs"" SET ""TenantId"" = 
            '00000000-0000-0000-0000-000000000000' WHERE ""TenantId"" is NULL");

            migrationBuilder.Sql(@"UPDATE ""Composes"" SET ""TenantId"" = 
            '00000000-0000-0000-0000-000000000000' WHERE ""TenantId"" is NULL");

            migrationBuilder.Sql(@"UPDATE ""Nodes"" SET ""TenantId"" = 
            '00000000-0000-0000-0000-000000000000' WHERE ""TenantId"" is NULL");
          
            migrationBuilder.AlterColumn<Guid>(
                name: "TenantId",
                table: "Nodes",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "Deployments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "Containers",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AlterColumn<Guid>(
                name: "TenantId",
                table: "ConnectionLogs",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "ComposeVersions",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AlterColumn<Guid>(
                name: "TenantId",
                table: "Composes",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Deployments_TenantId",
                table: "Deployments",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Containers_TenantId",
                table: "Containers",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_ComposeVersions_TenantId",
                table: "ComposeVersions",
                column: "TenantId");

            migrationBuilder.AddForeignKey(
                name: "FK_ComposeVersions_Tenants_TenantId",
                table: "ComposeVersions",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Containers_Tenants_TenantId",
                table: "Containers",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Deployments_Tenants_TenantId",
                table: "Deployments",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.Sql(@"
                UPDATE ""ComposeVersions"" AS cv
                SET ""TenantId"" = c.""TenantId""
                FROM ""Composes"" AS c
                WHERE cv.""ComposeId"" = c.""Id""
            ");

            migrationBuilder.Sql(@"
                UPDATE ""Deployments"" AS d
                SET ""TenantId"" = n.""TenantId""
                FROM ""Nodes"" AS n
                WHERE d.""NodeId"" = n.""Id""
            ");

            migrationBuilder.Sql(@"
                UPDATE ""Containers"" AS c
                SET ""TenantId"" = d.""TenantId""
                FROM ""Deployments"" AS d
                WHERE c.""DeploymentId"" = d.""Id""
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ComposeVersions_Tenants_TenantId",
                table: "ComposeVersions");

            migrationBuilder.DropForeignKey(
                name: "FK_Containers_Tenants_TenantId",
                table: "Containers");

            migrationBuilder.DropForeignKey(
                name: "FK_Deployments_Tenants_TenantId",
                table: "Deployments");

            migrationBuilder.DropIndex(
                name: "IX_Deployments_TenantId",
                table: "Deployments");

            migrationBuilder.DropIndex(
                name: "IX_Containers_TenantId",
                table: "Containers");

            migrationBuilder.DropIndex(
                name: "IX_ComposeVersions_TenantId",
                table: "ComposeVersions");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "Deployments");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "Containers");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "ComposeVersions");

            migrationBuilder.AlterColumn<Guid>(
                name: "TenantId",
                table: "Nodes",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<Guid>(
                name: "TenantId",
                table: "ConnectionLogs",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<Guid>(
                name: "TenantId",
                table: "Composes",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.CreateIndex(
                name: "IX_ComposeVersions_ComposeId",
                table: "ComposeVersions",
                column: "ComposeId");

            migrationBuilder.AddForeignKey(
                name: "FK_ComposeVersions_Composes_ComposeId",
                table: "ComposeVersions",
                column: "ComposeId",
                principalTable: "Composes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
