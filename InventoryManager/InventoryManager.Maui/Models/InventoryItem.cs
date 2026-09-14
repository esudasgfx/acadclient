using SQLite;

namespace InteriorInventory.Maui.Models;

public class InventoryItem
{
    [PrimaryKey, AutoIncrement] public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Category { get; set; } = "";
    public string Unit { get; set; } = "units";
    public double Quantity { get; set; }
    public double ReorderLevel { get; set; }
    public string Supplier { get; set; } = "";
    public string Location { get; set; } = "";
    public string ProjectCode { get; set; } = "";
    public string Notes { get; set; } = "";
    [Ignore] public bool IsLowStock => Quantity <= ReorderLevel;
    [Ignore] public string QuantityLabel => $"{Quantity:0.##} {Unit}";
}
