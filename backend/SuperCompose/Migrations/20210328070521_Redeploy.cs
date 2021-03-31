using Microsoft.EntityFrameworkCore.Migrations;
using System;

namespace SuperCompose.Migrations
{
  public partial class Redeploy : Migration
  {
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.AddColumn<DateTime>(
        "RedeploymentRequestedAt",
        "Nodes",
        "timestamp without time zone",
        nullable: true);

      migrationBuilder.AddColumn<DateTime>(
        "RedeploymentRequestedAt",
        "Deployments",
        "timestamp without time zone",
        nullable: true);

      migrationBuilder.AddColumn<DateTime>(
        "RedeploymentRequestedAt",
        "ComposeVersions",
        "timestamp without time zone",
        nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropColumn(
        "RedeploymentRequestedAt",
        "Nodes");

      migrationBuilder.DropColumn(
        "RedeploymentRequestedAt",
        "Deployments");

      migrationBuilder.DropColumn(
        "RedeploymentRequestedAt",
        "ComposeVersions");
    }
  }
}