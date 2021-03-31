using Microsoft.EntityFrameworkCore.Migrations;
using System;
using System.Collections.Generic;

namespace SuperCompose.Migrations
{
  public partial class InitialCreate : Migration
  {
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.AlterDatabase()
        .Annotation("Npgsql:Enum:connection_log_severity", "info,error,warning")
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
          ReconciliationFailed = table.Column<bool>("boolean", nullable: true),
          Version = table.Column<Guid>("uuid", nullable: false),
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
          ComposeId = table.Column<Guid>("uuid", nullable: false),
          PendingDelete = table.Column<bool>("boolean", nullable: false)
        },
        constraints: table => { table.PrimaryKey("PK_ComposeVersions", x => x.Id); });

      migrationBuilder.CreateTable(
        "Composes",
        table => new
        {
          Id = table.Column<Guid>("uuid", nullable: false),
          Name = table.Column<string>("character varying(255)", maxLength: 255, nullable: false),
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
          LastDeployedComposeVersionId = table.Column<Guid>("uuid", nullable: true),
          NodeId = table.Column<Guid>("uuid", nullable: false),
          LastCheck = table.Column<DateTime>("timestamp without time zone", nullable: true),
          LastDeployedNodeVersion = table.Column<Guid>("uuid", nullable: true),
          LastDeployedAsEnabled = table.Column<bool>("boolean", nullable: true),
          ReconciliationFailed = table.Column<bool>("boolean", nullable: true)
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
            "FK_Deployments_ComposeVersions_LastDeployedComposeVersionId",
            x => x.LastDeployedComposeVersionId,
            "ComposeVersions",
            "Id",
            onDelete: ReferentialAction.Restrict);
          table.ForeignKey(
            "FK_Deployments_Nodes_NodeId",
            x => x.NodeId,
            "Nodes",
            "Id",
            onDelete: ReferentialAction.Cascade);
        });

      migrationBuilder.CreateTable(
        "ConnectionLogs",
        table => new
        {
          Id = table.Column<Guid>("uuid", nullable: false),
          Severity = table.Column<int>("integer", nullable: false),
          Message = table.Column<string>("text", nullable: false),
          Time = table.Column<DateTime>("timestamp without time zone", nullable: false),
          Error = table.Column<string>("text", nullable: true),
          Metadata = table.Column<Dictionary<string, object>>("jsonb", nullable: true),
          NodeId = table.Column<Guid>("uuid", nullable: true),
          DeploymentId = table.Column<Guid>("uuid", nullable: true),
          TenantId = table.Column<Guid>("uuid", nullable: true),
          ComposeId = table.Column<Guid>("uuid", nullable: true)
        },
        constraints: table =>
        {
          table.PrimaryKey("PK_ConnectionLogs", x => x.Id);
          table.ForeignKey(
            "FK_ConnectionLogs_Composes_ComposeId",
            x => x.ComposeId,
            "Composes",
            "Id",
            onDelete: ReferentialAction.SetNull);
          table.ForeignKey(
            "FK_ConnectionLogs_Deployments_DeploymentId",
            x => x.DeploymentId,
            "Deployments",
            "Id",
            onDelete: ReferentialAction.SetNull);
          table.ForeignKey(
            "FK_ConnectionLogs_Nodes_NodeId",
            x => x.NodeId,
            "Nodes",
            "Id",
            onDelete: ReferentialAction.SetNull);
          table.ForeignKey(
            "FK_ConnectionLogs_Tenants_TenantId",
            x => x.TenantId,
            "Tenants",
            "Id",
            onDelete: ReferentialAction.SetNull);
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
        "IX_ConnectionLogs_ComposeId",
        "ConnectionLogs",
        "ComposeId");

      migrationBuilder.CreateIndex(
        "IX_ConnectionLogs_DeploymentId",
        "ConnectionLogs",
        "DeploymentId");

      migrationBuilder.CreateIndex(
        "IX_ConnectionLogs_NodeId",
        "ConnectionLogs",
        "NodeId");

      migrationBuilder.CreateIndex(
        "IX_ConnectionLogs_TenantId",
        "ConnectionLogs",
        "TenantId");

      migrationBuilder.CreateIndex(
        "IX_Deployments_ComposeId_NodeId",
        "Deployments",
        new[] {"ComposeId", "NodeId"},
        unique: true);

      migrationBuilder.CreateIndex(
        "IX_Deployments_LastDeployedComposeVersionId",
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

      migrationBuilder.Sql(
        "ALTER TABLE \"Composes\" ALTER CONSTRAINT \"FK_Composes_ComposeVersions_CurrentId\" DEFERRABLE INITIALLY DEFERRED;");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropForeignKey(
        "FK_Composes_ComposeVersions_CurrentId",
        "Composes");

      migrationBuilder.DropTable(
        "ConnectionLogs");

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