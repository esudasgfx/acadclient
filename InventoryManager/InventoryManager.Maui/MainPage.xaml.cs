using InteriorInventory.Maui.Models;
using InteriorInventory.Maui.Services;

namespace InteriorInventory.Maui;

public partial class MainPage : ContentPage
{
    readonly InventoryDatabase database = new();
    List<InventoryItem> items = new();
    bool lowStockOnly;

    public MainPage() => InitializeComponent();

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await database.InitializeAsync();
        items = await database.GetItemsAsync();
        ApplyFilter();
    }

    void OnSearchChanged(object sender, TextChangedEventArgs args) => ApplyFilter();
    void OnLowStockClicked(object sender, EventArgs args) { lowStockOnly = !lowStockOnly; ApplyFilter(); }

    void ApplyFilter()
    {
        var query = Search.Text?.ToLowerInvariant() ?? "";
        InventoryList.ItemsSource = items.Where(item => (!lowStockOnly || item.IsLowStock) && (string.IsNullOrWhiteSpace(query) || (item.Name + item.Category + item.Supplier + item.ProjectCode).ToLowerInvariant().Contains(query))).ToList();
        Summary.Text = $"{items.Count} materials  •  {items.Count(item => item.IsLowStock)} need attention";
    }

    async void OnAddClicked(object sender, EventArgs args)
    {
        var name = await DisplayPromptAsync("New material", "Material name");
        if (string.IsNullOrWhiteSpace(name)) return;
        var quantityText = await DisplayPromptAsync("Stock quantity", "Enter a number", initialValue: "0", keyboard: Keyboard.Numeric);
        double.TryParse(quantityText, out var quantity);
        await database.SaveItemAsync(new InventoryItem { Name = name.Trim(), Category = "General", Quantity = quantity, ReorderLevel = 1 });
        items = await database.GetItemsAsync();
        ApplyFilter();
    }
}
