using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace supercompose.Migrations
{
    public partial class AddConnectionLog : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PendingChange",
                table: "Nodes",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastCheck",
                table: "Deployments",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PendingChange",
                table: "Deployments",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ConnectionLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Severity = table.Column<int>(type: "integer", nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    NodeId = table.Column<Guid>(type: "uuid", nullable: true),
                    DeploymentId = table.Column<Guid>(type: "uuid", nullable: true),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: true),
                    ComposeId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConnectionLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConnectionLogs_Composes_ComposeId",
                        column: x => x.ComposeId,
                        principalTable: "Composes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ConnectionLogs_Deployments_DeploymentId",
                        column: x => x.DeploymentId,
                        principalTable: "Deployments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ConnectionLogs_Nodes_NodeId",
                        column: x => x.NodeId,
                        principalTable: "Nodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ConnectionLogs_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ConnectionLogs_ComposeId",
                table: "ConnectionLogs",
                column: "ComposeId");

            migrationBuilder.CreateIndex(
                name: "IX_ConnectionLogs_DeploymentId",
                table: "ConnectionLogs",
                column: "DeploymentId");

            migrationBuilder.CreateIndex(
                name: "IX_ConnectionLogs_NodeId",
                table: "ConnectionLogs",
                column: "NodeId");

            migrationBuilder.CreateIndex(
                name: "IX_ConnectionLogs_TenantId",
                table: "ConnectionLogs",
                column: "TenantId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ConnectionLogs");

            migrationBuilder.DropColumn(
                name: "PendingChange",
                table: "Nodes");

            migrationBuilder.DropColumn(
                name: "LastCheck",
                table: "Deployments");

            migrationBuilder.DropColumn(
                name: "PendingChange",
                table: "Deployments");
        }
    }
}
