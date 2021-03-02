using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace supercompose.Migrations
{
  public partial class InitialCreate : Migration
  {
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.AlterDatabase()
          .Annotation("Npgsql:PostgresExtension:uuid-ossp", ",,");

      migrationBuilder.CreateTable(
          name: "Tenants",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Tenants", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "Nodes",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            Enabled = table.Column<bool>(type: "boolean", nullable: false),
            Name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
            Host = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
            Port = table.Column<int>(type: "integer", nullable: false),
            Username = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
            Password = table.Column<byte[]>(type: "bytea", nullable: true),
            PrivateKey = table.Column<byte[]>(type: "bytea", nullable: true),
            TenantId = table.Column<Guid>(type: "uuid", nullable: true)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Nodes", x => x.Id);
            table.ForeignKey(
                      name: "FK_Nodes_Tenants_TenantId",
                      column: x => x.TenantId,
                      principalTable: "Tenants",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateTable(
          name: "ComposeVersions",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            Content = table.Column<string>(type: "text", nullable: false),
            Directory = table.Column<string>(type: "text", nullable: false),
            ServiceName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
            ServiceEnabled = table.Column<bool>(type: "boolean", nullable: false),
            ComposeId = table.Column<Guid>(type: "uuid", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_ComposeVersions", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "Composes",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            Name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
            PendingDelete = table.Column<bool>(type: "boolean", nullable: false),
            CurrentId = table.Column<Guid>(type: "uuid", nullable: false),
            TenantId = table.Column<Guid>(type: "uuid", nullable: true)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Composes", x => x.Id);
            table.ForeignKey(
                      name: "FK_Composes_ComposeVersions_CurrentId",
                      column: x => x.CurrentId,
                      principalTable: "ComposeVersions",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Restrict);
            table.ForeignKey(
                      name: "FK_Composes_Tenants_TenantId",
                      column: x => x.TenantId,
                      principalTable: "Tenants",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateTable(
          name: "Deployments",
          columns: table => new
          {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            Enabled = table.Column<bool>(type: "boolean", nullable: false),
            ComposeId = table.Column<Guid>(type: "uuid", nullable: false),
            LastDeployedVersionId = table.Column<Guid>(type: "uuid", nullable: false),
            NodeId = table.Column<Guid>(type: "uuid", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Deployments", x => x.Id);
            table.ForeignKey(
                      name: "FK_Deployments_Composes_ComposeId",
                      column: x => x.ComposeId,
                      principalTable: "Composes",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_Deployments_ComposeVersions_LastDeployedVersionId",
                      column: x => x.LastDeployedVersionId,
                      principalTable: "ComposeVersions",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_Deployments_Nodes_NodeId",
                      column: x => x.NodeId,
                      principalTable: "Nodes",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateIndex(
          name: "IX_Composes_CurrentId",
          table: "Composes",
          column: "CurrentId",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Composes_TenantId",
          table: "Composes",
          column: "TenantId");

      migrationBuilder.CreateIndex(
          name: "IX_ComposeVersions_ComposeId",
          table: "ComposeVersions",
          column: "ComposeId");

      migrationBuilder.CreateIndex(
          name: "IX_Deployments_ComposeId_NodeId",
          table: "Deployments",
          columns: new[] { "ComposeId", "NodeId" },
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Deployments_LastDeployedVersionId",
          table: "Deployments",
          column: "LastDeployedVersionId");

      migrationBuilder.CreateIndex(
          name: "IX_Deployments_NodeId",
          table: "Deployments",
          column: "NodeId");

      migrationBuilder.CreateIndex(
          name: "IX_Nodes_TenantId",
          table: "Nodes",
          column: "TenantId");

      migrationBuilder.AddForeignKey(
          name: "FK_ComposeVersions_Composes_ComposeId",
          table: "ComposeVersions",
          column: "ComposeId",
          principalTable: "Composes",
          principalColumn: "Id",
          onDelete: ReferentialAction.Cascade);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropForeignKey(
          name: "FK_Composes_ComposeVersions_CurrentId",
          table: "Composes");

      migrationBuilder.DropTable(
          name: "Deployments");

      migrationBuilder.DropTable(
          name: "Nodes");

      migrationBuilder.DropTable(
          name: "ComposeVersions");

      migrationBuilder.DropTable(
          name: "Composes");

      migrationBuilder.DropTable(
          name: "Tenants");
    }
  }
}
