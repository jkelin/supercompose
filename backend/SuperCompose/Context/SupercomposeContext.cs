using System;
using Microsoft.EntityFrameworkCore;

#nullable disable

namespace SuperCompose.Context
{
  public partial class SuperComposeContext : DbContext
  {
    public SuperComposeContext(DbContextOptions<SuperComposeContext> options)
      : base(options)
    {
    }

    public virtual DbSet<Compose> Composes { get; set; }
    public virtual DbSet<ComposeVersion> ComposeVersions { get; set; }
    public virtual DbSet<Deployment> Deployments { get; set; }
    public virtual DbSet<Node> Nodes { get; set; }
    public virtual DbSet<Tenant> Tenants { get; set; }
    public virtual DbSet<User> Users { get; set; }
    public virtual DbSet<ConnectionLog> ConnectionLogs { get; set; }
    public virtual DbSet<Container> Containers { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
     
      modelBuilder.HasPostgresEnum<ConnectionLogSeverity>();

      modelBuilder.HasPostgresExtension("uuid-ossp")
        .HasAnnotation("Relational:Collation", "en_US.UTF-8");

      modelBuilder.Entity<ConnectionLog>(entity =>
      {
        entity.HasOne(d => d.Compose)
          .WithMany(p => p.ConnectionLogs)
          .HasForeignKey(d => d.ComposeId)
          .OnDelete(DeleteBehavior.SetNull);

        entity.HasOne(d => d.Deployment)
          .WithMany(p => p.ConnectionLogs)
          .HasForeignKey(d => d.DeploymentId)
          .OnDelete(DeleteBehavior.SetNull);

        entity.HasOne(d => d.Tenant)
          .WithMany(p => p.ConnectionLogs)
          .HasForeignKey(d => d.TenantId)
          .OnDelete(DeleteBehavior.SetNull);

        entity.HasOne(d => d.Node)
          .WithMany(p => p.ConnectionLogs)
          .HasForeignKey(d => d.NodeId)
          .OnDelete(DeleteBehavior.SetNull);
      });

      modelBuilder.Entity<Compose>(entity =>
      {
        entity.HasOne(d => d.Current)
          .WithMany()
          .HasForeignKey(d => d.CurrentId)
          .OnDelete(DeleteBehavior.Restrict);

        entity.HasMany(d => d.ComposeVersions)
          .WithOne(p => p.Compose);
        
        entity.HasOne(d => d.Tenant)
          .WithMany(p => p.Composes)
          .HasForeignKey(d => d.TenantId)
          .OnDelete(DeleteBehavior.Cascade);
      });

      modelBuilder.Entity<ComposeVersion>(entity =>
      {
        entity.HasOne(d => d.Compose)
          .WithMany(p => p.ComposeVersions)
          .HasForeignKey(d => d.ComposeId)
          .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(d => d.Tenant)
          .WithMany(p => p.ComposeVersions)
          .HasForeignKey(d => d.TenantId)
          .OnDelete(DeleteBehavior.Cascade);
      });

      modelBuilder.Entity<Deployment>(entity =>
      {
        entity.HasIndex(e => new {e.ComposeId, e.NodeId})
          .IsUnique();

        entity.HasOne(d => d.Compose)
          .WithMany(p => p.Deployments)
          .HasForeignKey(d => d.ComposeId)
          .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(d => d.LastDeployedComposeVersion)
          .WithMany(p => p.Deployments)
          .HasForeignKey(d => d.LastDeployedComposeVersionId);

        entity.HasOne(d => d.Node)
          .WithMany(p => p.Deployments)
          .HasForeignKey(d => d.NodeId)
          .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(d => d.Tenant)
          .WithMany(p => p.Deployments)
          .HasForeignKey(d => d.TenantId)
          .OnDelete(DeleteBehavior.Cascade);
      });

      modelBuilder.Entity<Node>(entity =>
      {
        entity.HasOne(d => d.Tenant)
          .WithMany(p => p.Nodes)
          .HasForeignKey(d => d.TenantId)
          .OnDelete(DeleteBehavior.Cascade);
      });

      modelBuilder.Entity<Tenant>(entity =>
      {
        entity.HasOne(d => d.User)
          .WithMany(p => p.Tenants)
          .HasForeignKey(d => d.UserId)
          .OnDelete(DeleteBehavior.Cascade);
      });

      modelBuilder.Entity<Container>(entity =>
      {
        entity.HasOne(d => d.Deployment)
          .WithMany(p => p.Containers)
          .HasForeignKey(d => d.DeploymentId)
          .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(d => d.Tenant)
          .WithMany(p => p.Containers)
          .HasForeignKey(d => d.TenantId)
          .OnDelete(DeleteBehavior.Cascade);
      });

      modelBuilder.Entity<User>(entity => { });

      foreach (var entityType in modelBuilder.Model.GetEntityTypes())
      {
        foreach (var property in entityType.GetProperties())
        {
          if (property.ClrType == typeof(DateTime))
          {
            modelBuilder.Entity(entityType.ClrType)
              .Property<DateTime>(property.Name)
              .HasConversion(
                v => v.ToUniversalTime(),
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
          }
          else if (property.ClrType == typeof(DateTime?))
          {
            modelBuilder.Entity(entityType.ClrType)
              .Property<DateTime?>(property.Name)
              .HasConversion(
                v => v.HasValue ? v.Value.ToUniversalTime() : v,
                v => v.HasValue
                  ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc)
                  : v);
          }
        }
      }

      OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
  }
}