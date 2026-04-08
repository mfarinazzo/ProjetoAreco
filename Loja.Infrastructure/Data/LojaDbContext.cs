using Loja.Domain.Entities;
using Loja.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace Loja.Infrastructure.Data;

public sealed class LojaDbContext : DbContext
{
    public LojaDbContext(DbContextOptions<LojaDbContext> options)
        : base(options)
    {
    }

    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("Products");

            entity.HasKey(product => product.Id);

            entity.Property(product => product.Id)
                .ValueGeneratedNever();

            // The SKU is modeled as a Value Object in the domain, but persisted as TEXT in SQLite.
            entity.Property(product => product.Sku)
                .HasConversion(
                    sku => sku.Value,
                    databaseValue => Sku.Parse(databaseValue))
                .HasMaxLength(64)
                .IsRequired();

            entity.HasIndex(product => product.Sku)
                .IsUnique();

            entity.Property(product => product.Name)
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(product => product.Category)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(product => product.Price)
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(product => product.StockQuantity)
                .IsRequired();
        });
    }
}
