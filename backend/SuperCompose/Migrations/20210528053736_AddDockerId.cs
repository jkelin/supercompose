using Microsoft.EntityFrameworkCore.Migrations;

namespace SuperCompose.Migrations
{
    public partial class AddDockerId : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DockerId",
                table: "Containers",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Containers_DockerId",
                table: "Containers",
                column: "DockerId");

            migrationBuilder.CreateIndex(
                name: "IX_Containers_Id",
                table: "Containers",
                column: "Id");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Containers_DockerId",
                table: "Containers");

            migrationBuilder.DropIndex(
                name: "IX_Containers_Id",
                table: "Containers");

            migrationBuilder.DropColumn(
                name: "DockerId",
                table: "Containers");
        }
    }
}
