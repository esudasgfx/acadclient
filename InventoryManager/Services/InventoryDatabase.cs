using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using InteriorInventory.Models;
using SQLite;
using Xamarin.Essentials;

namespace InteriorInventory.Services
{
    public class InventoryDatabase
    {
        private readonly SQLiteAsyncConnection connection;
        public InventoryDatabase()
        {
            connection = new SQLiteAsyncConnection(Path.Combine(FileSystem.AppDataDirectory, "interior-inventory.db3"));
        }

        public async Task InitializeAsync()
        {
            await connection.CreateTableAsync<InventoryItem>();
            if (await connection.Table<InventoryItem>().CountAsync() == 0)
            {
                await connection.InsertAllAsync(new List<InventoryItem>
                {
                    new InventoryItem { Name = "Oak veneer panels", Category = "Woodwork", Unit = "sheets", Quantity = 18, ReorderLevel = 8, Supplier = "Northwood Supplies", Location = "Warehouse A", ProjectCode = "RES-104", Notes = "Natural oak, 18 mm" },
                    new InventoryItem { Name = "Brass cabinet handles", Category = "Hardware", Unit = "pieces", Quantity = 42, ReorderLevel = 24, Supplier = "Studio Hardware Co.", Location = "Hardware rack 2", ProjectCode = "RES-101", Notes = "128 mm centre-to-centre" },
                    new InventoryItem { Name = "Linen upholstery fabric", Category = "Fabrics", Unit = "metres", Quantity = 6.5, ReorderLevel = 10, Supplier = "Textile House", Location = "Fabric room", ProjectCode = "COM-208", Notes = "Stone, fire-rated" }
                });
            }
        }

        public Task<List<InventoryItem>> GetItemsAsync() => connection.Table<InventoryItem>().OrderBy(x => x.Name).ToListAsync();
        public Task<int> SaveItemAsync(InventoryItem item) => item.Id == 0 ? connection.InsertAsync(item) : connection.UpdateAsync(item);
    }
}
