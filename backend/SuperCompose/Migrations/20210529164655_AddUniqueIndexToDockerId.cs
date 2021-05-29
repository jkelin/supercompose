using Microsoft.EntityFrameworkCore.Migrations;

namespace SuperCompose.Migrations
{
    public partial class AddUniqueIndexToDockerId : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Containers_DockerId",
                table: "Containers");

            migrationBuilder.CreateIndex(
                name: "IX_Containers_DockerId",
                table: "Containers",
                column: "DockerId",
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Containers_DockerId",
                table: "Containers");

            migrationBuilder.CreateIndex(
                name: "IX_Containers_DockerId",
                table: "Containers",
                column: "DockerId");
        }
    }
}
