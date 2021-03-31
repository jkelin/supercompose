using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

namespace SuperCompose.Migrations.Keys
{
  public partial class AddDataProtectionKeys : Migration
  {
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.CreateTable(
        "DataProtectionKeys",
        table => new
        {
          Id = table.Column<int>("integer", nullable: false)
            .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
          FriendlyName = table.Column<string>("text", nullable: true),
          Xml = table.Column<string>("text", nullable: true)
        },
        constraints: table => { table.PrimaryKey("PK_DataProtectionKeys", x => x.Id); });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropTable(
        "DataProtectionKeys");
    }
  }
}