namespace InventoryApi.Models;

public class InventoryItem
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Category { get; set; } = "";
    public string Unit { get; set; } = "units";
    public decimal Quantity { get; set; }
    public decimal ReorderLevel { get; set; }
    public string Supplier { get; set; } = "";
    public string Location { get; set; } = "";
    public string ProjectCode { get; set; } = "";
    public string Notes { get; set; } = "";
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
