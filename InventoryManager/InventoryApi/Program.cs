using InventoryApi.Data;
using InventoryApi.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("Inventory")
    ?? throw new InvalidOperationException("ConnectionStrings:Inventory is missing.");

builder.Services.AddDbContext<InventoryDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
app.UseCors();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<InventoryDbContext>();
    await db.Database.EnsureCreatedAsync();
    if (!await db.InventoryItems.AnyAsync())
    {
        db.InventoryItems.AddRange(
            new InventoryItem { Name = "Oak veneer panels", Category = "Woodwork", Unit = "sheets", Quantity = 18, ReorderLevel = 8, Supplier = "Northwood Supplies", Location = "Warehouse A", ProjectCode = "RES-104" },
            new InventoryItem { Name = "Brass cabinet handles", Category = "Hardware", Unit = "pieces", Quantity = 42, ReorderLevel = 24, Supplier = "Studio Hardware Co.", Location = "Hardware rack 2", ProjectCode = "RES-101" },
            new InventoryItem { Name = "Linen upholstery fabric", Category = "Fabrics", Unit = "metres", Quantity = 6.5m, ReorderLevel = 10, Supplier = "Textile House", Location = "Fabric room", ProjectCode = "COM-208" });
        await db.SaveChangesAsync();
    }
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.MapGet("/api/inventory", async (InventoryDbContext db, string? search, bool lowStockOnly = false) =>
{
    var query = db.InventoryItems.AsNoTracking().AsQueryable();
    if (!string.IsNullOrWhiteSpace(search))
    {
        var term = search.Trim().ToLower();
        query = query.Where(item => item.Name.ToLower().Contains(term) || item.Category.ToLower().Contains(term) || item.Supplier.ToLower().Contains(term) || item.ProjectCode.ToLower().Contains(term));
    }
    if (lowStockOnly) query = query.Where(item => item.Quantity <= item.ReorderLevel);
    return Results.Ok(await query.OrderBy(item => item.Name).ToListAsync());
});

app.MapPost("/api/inventory", async (InventoryItem item, InventoryDbContext db) =>
{
    item.Id = 0;
    item.UpdatedAtUtc = DateTime.UtcNow;
    db.InventoryItems.Add(item);
    await db.SaveChangesAsync();
    return Results.Created($"/api/inventory/{item.Id}", item);
});

app.MapPatch("/api/inventory/{id:int}/stock", async (int id, StockAdjustment request, InventoryDbContext db) =>
{
    var item = await db.InventoryItems.FindAsync(id);
    if (item is null) return Results.NotFound();
    var newQuantity = item.Quantity + request.Change;
    if (newQuantity < 0) return Results.BadRequest(new { error = "Stock cannot be negative." });
    item.Quantity = newQuantity;
    item.UpdatedAtUtc = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(item);
});

app.Run();

public record StockAdjustment(decimal Change, string? Reason);
