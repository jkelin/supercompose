using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

#nullable disable

namespace backend2
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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.HasPostgresExtension("uuid-ossp")
                .HasAnnotation("Relational:Collation", "en_US.UTF-8");

            modelBuilder.Entity<Compose>(entity =>
            {
                entity.ToTable("compose");

                entity.HasIndex(e => e.CurrentId, "REL_29d45d9b900ed30b14a8c98ecf")
                    .IsUnique();

                entity.Property(e => e.Id)
                    .HasColumnName("id")
                    .HasDefaultValueSql("uuid_generate_v4()");

                entity.Property(e => e.CurrentId).HasColumnName("currentId");

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(255)
                    .HasColumnName("name");

                entity.Property(e => e.PendingDelete).HasColumnName("pendingDelete");

                entity.Property(e => e.TenantId).HasColumnName("tenantId");

                entity.HasOne(d => d.Current)
                    .WithOne(p => p.Compose)
                    .HasForeignKey<Compose>(d => d.CurrentId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_29d45d9b900ed30b14a8c98ecf6");

                entity.HasOne(d => d.Tenant)
                    .WithMany(p => p.Composes)
                    .HasForeignKey(d => d.TenantId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_55a3819659ddb9f787d0b223883");
            });

            modelBuilder.Entity<ComposeVersion>(entity =>
            {
                entity.ToTable("compose_version");

                entity.Property(e => e.Id)
                    .HasColumnName("id")
                    .HasDefaultValueSql("uuid_generate_v4()");

                entity.Property(e => e.ComposeId).HasColumnName("composeId");

                entity.Property(e => e.Content)
                    .IsRequired()
                    .HasColumnName("content");

                entity.Property(e => e.Directory)
                    .IsRequired()
                    .HasMaxLength(255)
                    .HasColumnName("directory");

                entity.Property(e => e.ServiceEnabled).HasColumnName("serviceEnabled");

                entity.Property(e => e.ServiceName)
                    .HasMaxLength(255)
                    .HasColumnName("serviceName");

                entity.HasOne(d => d.ComposeNavigation)
                    .WithMany(p => p.ComposeVersions)
                    .HasForeignKey(d => d.ComposeId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_c4133a06c218eb1b92c7bc82544");
            });

            modelBuilder.Entity<Deployment>(entity =>
            {
                entity.ToTable("deployment");

                entity.HasIndex(e => new { e.ComposeId, e.NodeId }, "UQ_c301327e93da46010d5b0c6cddd")
                    .IsUnique();

                entity.Property(e => e.Id)
                    .HasColumnName("id")
                    .HasDefaultValueSql("uuid_generate_v4()");

                entity.Property(e => e.ComposeId).HasColumnName("composeId");

                entity.Property(e => e.Enabled).HasColumnName("enabled");

                entity.Property(e => e.LastDeployedVersionId).HasColumnName("lastDeployedVersionId");

                entity.Property(e => e.NodeId).HasColumnName("nodeId");

                entity.HasOne(d => d.Compose)
                    .WithMany(p => p.Deployments)
                    .HasForeignKey(d => d.ComposeId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_96cb6fa0be2b53a7db9e32d3501");

                entity.HasOne(d => d.LastDeployedVersion)
                    .WithMany(p => p.Deployments)
                    .HasForeignKey(d => d.LastDeployedVersionId)
                    .HasConstraintName("FK_67c5aa9e5e842e24d70c3854a86");

                entity.HasOne(d => d.Node)
                    .WithMany(p => p.Deployments)
                    .HasForeignKey(d => d.NodeId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_105e7ccd19aa0ca376551a96c2a");
            });

            modelBuilder.Entity<Node>(entity =>
            {
                entity.ToTable("node");

                entity.Property(e => e.Id)
                    .HasColumnName("id")
                    .HasDefaultValueSql("uuid_generate_v4()");

                entity.Property(e => e.Enabled).HasColumnName("enabled");

                entity.Property(e => e.Host)
                    .IsRequired()
                    .HasMaxLength(255)
                    .HasColumnName("host");

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(255)
                    .HasColumnName("name");

                entity.Property(e => e.Password).HasColumnName("password");

                entity.Property(e => e.Port).HasColumnName("port");

                entity.Property(e => e.PrivateKey).HasColumnName("privateKey");

                entity.Property(e => e.TenantId).HasColumnName("tenantId");

                entity.Property(e => e.Username)
                    .IsRequired()
                    .HasColumnName("username");

                entity.HasOne(d => d.Tenant)
                    .WithMany(p => p.Nodes)
                    .HasForeignKey(d => d.TenantId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_a92995d1d191fcd6b94e3bbb07e");
            });

            modelBuilder.Entity<Tenant>(entity =>
            {
                entity.ToTable("tenant");

                entity.Property(e => e.Id)
                    .HasColumnName("id")
                    .HasDefaultValueSql("uuid_generate_v4()");
            });

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}
