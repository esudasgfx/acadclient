using InventoryApi.Models;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Data;

public class InventoryDbContext(DbContextOptions<InventoryDbContext> options) : DbContext(options)
{
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<InventoryItem>(entity =>
        {
            entity.Property(item => item.Name).HasMaxLength(200).IsRequired();
            entity.Property(item => item.Category).HasMaxLength(100);
            entity.Property(item => item.Unit).HasMaxLength(30);
            entity.Property(item => item.Quantity).HasPrecision(12, 2);
            entity.Property(item => item.ReorderLevel).HasPrecision(12, 2);
            entity.HasIndex(item => new { item.ProjectCode, item.Name });
        });
    }
}
