using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace backend2.Migrations
{
    public partial class Redeploy : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "RedeploymentRequestedAt",
                table: "Nodes",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RedeploymentRequestedAt",
                table: "Deployments",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RedeploymentRequestedAt",
                table: "ComposeVersions",
                type: "timestamp without time zone",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RedeploymentRequestedAt",
                table: "Nodes");

            migrationBuilder.DropColumn(
                name: "RedeploymentRequestedAt",
                table: "Deployments");

            migrationBuilder.DropColumn(
                name: "RedeploymentRequestedAt",
                table: "ComposeVersions");
        }
    }
}
