using Microsoft.EntityFrameworkCore.Migrations;

namespace SuperCompose.Migrations
{
    public partial class FixComposes : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Composes_CurrentId",
                table: "Composes");

            migrationBuilder.DropColumn(
                name: "PendingDelete",
                table: "ComposeVersions");

            migrationBuilder.CreateIndex(
                name: "IX_Composes_CurrentId",
                table: "Composes",
                column: "CurrentId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Composes_CurrentId",
                table: "Composes");

            migrationBuilder.AddColumn<bool>(
                name: "PendingDelete",
                table: "ComposeVersions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Composes_CurrentId",
                table: "Composes",
                column: "CurrentId",
                unique: true);
        }
    }
}
