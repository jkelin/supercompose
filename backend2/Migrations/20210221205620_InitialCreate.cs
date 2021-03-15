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
        "Tenants",
        table => new
        {
          Id = table.Column<Guid>("uuid", nullable: false)
        },
        constraints: table => { table.PrimaryKey("PK_Tenants", x => x.Id); });

      migrationBuilder.CreateTable(
        "Nodes",
        table => new
        {
          Id = table.Column<Guid>("uuid", nullable: false),
          Enabled = table.Column<bool>("boolean", nullable: false),
          Name = table.Column<string>("character varying(255)", maxLength: 255, nullable: false),
          Host = table.Column<string>("character varying(255)", maxLength: 255, nullable: false),
          Port = table.Column<int>("integer", nullable: false),
          Username = table.Column<string>("character varying(255)", maxLength: 255, nullable: false),
          Password = table.Column<byte[]>("bytea", nullable: true),
          PrivateKey = table.Column<byte[]>("bytea", nullable: true),
          TenantId = table.Column<Guid>("uuid", nullable: true)
        },
        constraints: table =>
        {
          table.PrimaryKey("PK_Nodes", x => x.Id);
          table.ForeignKey(
            "FK_Nodes_Tenants_TenantId",
            x => x.TenantId,
            "Tenants",
            "Id",
            onDelete: ReferentialAction.Cascade);
        });

      migrationBuilder.CreateTable(
        "ComposeVersions",
        table => new
        {
          Id = table.Column<Guid>("uuid", nullable: false),
          Content = table.Column<string>("text", nullable: false),
          Directory = table.Column<string>("text", nullable: false),
          ServiceName = table.Column<string>("character varying(255)", maxLength: 255, nullable: true),
          ServiceEnabled = table.Column<bool>("boolean", nullable: false),
          ComposeId = table.Column<Guid>("uuid", nullable: false)
        },
        constraints: table => { table.PrimaryKey("PK_ComposeVersions", x => x.Id); });

      migrationBuilder.CreateTable(
        "Composes",
        table => new
        {
          Id = table.Column<Guid>("uuid", nullable: false),
          Name = table.Column<string>("character varying(255)", maxLength: 255, nullable: false),
          PendingDelete = table.Column<bool>("boolean", nullable: false),
          CurrentId = table.Column<Guid>("uuid", nullable: false),
          TenantId = table.Column<Guid>("uuid", nullable: true)
        },
        constraints: table =>
        {
          table.PrimaryKey("PK_Composes", x => x.Id);
          table.ForeignKey(
            "FK_Composes_ComposeVersions_CurrentId",
            x => x.CurrentId,
            "ComposeVersions",
            "Id",
            onDelete: ReferentialAction.Restrict);
          table.ForeignKey(
            "FK_Composes_Tenants_TenantId",
            x => x.TenantId,
            "Tenants",
            "Id",
            onDelete: ReferentialAction.Cascade);
        });

      migrationBuilder.CreateTable(
        "Deployments",
        table => new
        {
          Id = table.Column<Guid>("uuid", nullable: false),
          Enabled = table.Column<bool>("boolean", nullable: false),
          ComposeId = table.Column<Guid>("uuid", nullable: false),
          LastDeployedVersionId = table.Column<Guid>("uuid", nullable: false),
          NodeId = table.Column<Guid>("uuid", nullable: false)
        },
        constraints: table =>
        {
          table.PrimaryKey("PK_Deployments", x => x.Id);
          table.ForeignKey(
            "FK_Deployments_Composes_ComposeId",
            x => x.ComposeId,
            "Composes",
            "Id",
            onDelete: ReferentialAction.Cascade);
          table.ForeignKey(
            "FK_Deployments_ComposeVersions_LastDeployedVersionId",
            x => x.LastDeployedVersionId,
            "ComposeVersions",
            "Id",
            onDelete: ReferentialAction.Cascade);
          table.ForeignKey(
            "FK_Deployments_Nodes_NodeId",
            x => x.NodeId,
            "Nodes",
            "Id",
            onDelete: ReferentialAction.Cascade);
        });

      migrationBuilder.CreateIndex(
        "IX_Composes_CurrentId",
        "Composes",
        "CurrentId",
        unique: true);

      migrationBuilder.CreateIndex(
        "IX_Composes_TenantId",
        "Composes",
        "TenantId");

      migrationBuilder.CreateIndex(
        "IX_ComposeVersions_ComposeId",
        "ComposeVersions",
        "ComposeId");

      migrationBuilder.CreateIndex(
        "IX_Deployments_ComposeId_NodeId",
        "Deployments",
        new[] {"ComposeId", "NodeId"},
        unique: true);

      migrationBuilder.CreateIndex(
        "IX_Deployments_LastDeployedVersionId",
        "Deployments",
        "LastDeployedComposeVersionId");

      migrationBuilder.CreateIndex(
        "IX_Deployments_NodeId",
        "Deployments",
        "NodeId");

      migrationBuilder.CreateIndex(
        "IX_Nodes_TenantId",
        "Nodes",
        "TenantId");

      migrationBuilder.AddForeignKey(
        "FK_ComposeVersions_Composes_ComposeId",
        "ComposeVersions",
        "ComposeId",
        "Composes",
        principalColumn: "Id",
        onDelete: ReferentialAction.Cascade);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropForeignKey(
        "FK_Composes_ComposeVersions_CurrentId",
        "Composes");

      migrationBuilder.DropTable(
        "Deployments");

      migrationBuilder.DropTable(
        "Nodes");

      migrationBuilder.DropTable(
        "ComposeVersions");

      migrationBuilder.DropTable(
        "Composes");

      migrationBuilder.DropTable(
        "Tenants");
    }
  }
}