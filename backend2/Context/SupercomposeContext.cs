using System;
using backend2.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

#nullable disable

namespace supercompose
{
  public partial class SupercomposeContext : DbContext
  {
    public SupercomposeContext()
    {
    }

    public SupercomposeContext(DbContextOptions<SupercomposeContext> options)
      : base(options)
    {
    }

    public virtual DbSet<Compose> Composes { get; set; }
    public virtual DbSet<ComposeVersion> ComposeVersions { get; set; }
    public virtual DbSet<Deployment> Deployments { get; set; }
    public virtual DbSet<Node> Nodes { get; set; }
    public virtual DbSet<Tenant> Tenants { get; set; }
    public virtual DbSet<ConnectionLog> ConnectionLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
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
          .WithOne(p => p.Compose)
          .HasForeignKey<Compose>(d => d.CurrentId)
          .OnDelete(DeleteBehavior.ClientSetNull);

        entity.HasOne(d => d.Tenant)
          .WithMany(p => p.Composes)
          .HasForeignKey(d => d.TenantId)
          .OnDelete(DeleteBehavior.Cascade);
      });

      modelBuilder.Entity<ComposeVersion>(entity =>
      {
        entity.HasOne(d => d.ComposeNavigation)
          .WithMany(p => p.ComposeVersions)
          .HasForeignKey(d => d.ComposeId)
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

        entity.HasOne(d => d.LastDeployedVersion)
          .WithMany(p => p.Deployments)
          .HasForeignKey(d => d.LastDeployedVersionId);

        entity.HasOne(d => d.Node)
          .WithMany(p => p.Deployments)
          .HasForeignKey(d => d.NodeId)
          .OnDelete(DeleteBehavior.Cascade);
      });

      modelBuilder.Entity<Node>(entity =>
      {
        entity.HasOne(d => d.Tenant)
          .WithMany(p => p.Nodes)
          .HasForeignKey(d => d.TenantId)
          .OnDelete(DeleteBehavior.Cascade);
      });

      modelBuilder.Entity<Tenant>(entity => { });

      OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
  }
}