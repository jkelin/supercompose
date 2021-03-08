using Microsoft.EntityFrameworkCore.Migrations;

namespace supercompose.Migrations
{
  public partial class AddDefers : Migration
  {
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql(
        "ALTER TABLE \"Composes\" ALTER CONSTRAINT \"FK_Composes_ComposeVersions_CurrentId\" DEFERRABLE INITIALLY DEFERRED;");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.Sql(
        "ALTER TABLE \"Composes\" ALTER CONSTRAINT \"FK_Composes_ComposeVersions_CurrentId\" DEFERRABLE INITIALLY IMMEDIATE;");
    }
  }
}