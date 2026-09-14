using InteriorInventory.Maui.Models;
using SQLite;

namespace InteriorInventory.Maui.Services;

public class InventoryDatabase
{
    readonly SQLiteAsyncConnection connection = new(Path.Combine(FileSystem.AppDataDirectory, "interior-inventory.db3"));

    public async Task InitializeAsync()
    {
        await connection.CreateTableAsync<InventoryItem>();
        if (await connection.Table<InventoryItem>().CountAsync() == 0)
        {
            await connection.InsertAllAsync(new[]
            {
                new InventoryItem { Name = "Oak veneer panels", Category = "Woodwork", Unit = "sheets", Quantity = 18, ReorderLevel = 8, Supplier = "Northwood Supplies", Location = "Warehouse A", ProjectCode = "RES-104" },
                new InventoryItem { Name = "Brass cabinet handles", Category = "Hardware", Unit = "pieces", Quantity = 42, ReorderLevel = 24, Supplier = "Studio Hardware Co.", Location = "Hardware rack 2", ProjectCode = "RES-101" },
                new InventoryItem { Name = "Linen upholstery fabric", Category = "Fabrics", Unit = "metres", Quantity = 6.5, ReorderLevel = 10, Supplier = "Textile House", Location = "Fabric room", ProjectCode = "COM-208" }
            });
        }
    }

    public Task<List<InventoryItem>> GetItemsAsync() => connection.Table<InventoryItem>().OrderBy(x => x.Name).ToListAsync();
    public Task<int> SaveItemAsync(InventoryItem item) => item.Id == 0 ? connection.InsertAsync(item) : connection.UpdateAsync(item);
}
