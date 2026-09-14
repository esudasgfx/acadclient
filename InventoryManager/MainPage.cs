using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using InteriorInventory.Models;
using InteriorInventory.Services;
using Xamarin.Forms;

namespace InteriorInventory
{
    public class MainPage : ContentPage
    {
        readonly InventoryDatabase database = new InventoryDatabase();
        readonly CollectionView inventoryList;
        readonly Label summary;
        readonly SearchBar searchBar;
        List<InventoryItem> items = new List<InventoryItem>();
        bool lowStockOnly;

        public MainPage()
        {
            Title = "Studio Inventory";
            BackgroundColor = Color.FromHex("#F5F1E8");
            summary = new Label { TextColor = Color.FromHex("#173B3F"), FontAttributes = FontAttributes.Bold, FontSize = 16 };
            searchBar = new SearchBar { Placeholder = "Search materials, suppliers or projects", BackgroundColor = Color.White };
            searchBar.TextChanged += (sender, args) => ApplyFilter();

            var lowStockButton = new Button { Text = "Low stock", BackgroundColor = Color.FromHex("#E8B86A"), TextColor = Color.FromHex("#173B3F"), CornerRadius = 8 };
            lowStockButton.Clicked += (sender, args) => { lowStockOnly = !lowStockOnly; ApplyFilter(); };
            var addButton = new Button { Text = "+ Add material", BackgroundColor = Color.FromHex("#173B3F"), TextColor = Color.White, CornerRadius = 8 };
            addButton.Clicked += async (sender, args) => await AddItemAsync();

            inventoryList = new CollectionView { SelectionMode = SelectionMode.None, ItemsLayout = new LinearItemsLayout(ItemsLayoutOrientation.Vertical) { ItemSpacing = 10 } };
            inventoryList.ItemTemplate = new DataTemplate(() =>
            {
                var name = new Label { FontAttributes = FontAttributes.Bold, FontSize = 17, TextColor = Color.FromHex("#173B3F") };
                name.SetBinding(Label.TextProperty, "Name");
                var detail = new Label { FontSize = 13, TextColor = Color.FromHex("#617072") };
                detail.SetBinding(Label.TextProperty, "Category");
                var quantity = new Label { FontAttributes = FontAttributes.Bold, HorizontalOptions = LayoutOptions.End, VerticalOptions = LayoutOptions.Center };
                quantity.SetBinding(Label.TextProperty, "QuantityLabel");
                var content = new Grid { Padding = 14, BackgroundColor = Color.White, ColumnDefinitions = { new ColumnDefinition { Width = GridLength.Star }, new ColumnDefinition { Width = GridLength.Auto } } };
                content.Children.Add(new StackLayout { Spacing = 4, Children = { name, detail } });
                Grid.SetColumn(quantity, 1);
                content.Children.Add(quantity);
                return new Frame { Content = content, CornerRadius = 8, Padding = 0, HasShadow = false, BorderColor = Color.FromHex("#E3DDD0") };
            });

            Content = new StackLayout { Padding = new Thickness(18, 12), Spacing = 12, Children =
            {
                new Label { Text = "MATERIALS", FontSize = 12, TextColor = Color.FromHex("#D77A61"), FontAttributes = FontAttributes.Bold },
                new Label { Text = "Keep every project moving", FontSize = 27, FontAttributes = FontAttributes.Bold, TextColor = Color.FromHex("#173B3F") },
                summary,
                searchBar,
                new Grid { ColumnDefinitions = { new ColumnDefinition { Width = GridLength.Star }, new ColumnDefinition { Width = GridLength.Star } }, ColumnSpacing = 10, Children = { lowStockButton, addButton } },
                inventoryList
            }};
        }

        protected override async void OnAppearing()
        {
            base.OnAppearing();
            await database.InitializeAsync();
            items = await database.GetItemsAsync();
            ApplyFilter();
        }

        void ApplyFilter()
        {
            var query = searchBar.Text?.ToLowerInvariant() ?? string.Empty;
            var filtered = items.Where(item => !lowStockOnly || item.IsLowStock).Where(item => string.IsNullOrWhiteSpace(query) || (item.Name + item.Category + item.Supplier + item.ProjectCode).ToLowerInvariant().Contains(query)).ToList();
            inventoryList.ItemsSource = filtered;
            summary.Text = $"{items.Count} materials  •  {items.Count(item => item.IsLowStock)} need attention";
        }

        async Task AddItemAsync()
        {
            var name = await DisplayPromptAsync("New material", "Material name");
            if (string.IsNullOrWhiteSpace(name)) return;
            var quantity = await DisplayPromptAsync("Stock quantity", "Enter a number", initialValue: "0", keyboard: Keyboard.Numeric);
            double.TryParse(quantity, out var parsedQuantity);
            await database.SaveItemAsync(new InventoryItem { Name = name.Trim(), Category = "General", Unit = "units", Quantity = parsedQuantity, ReorderLevel = 1, Location = "Unassigned", Supplier = "Unassigned" });
            items = await database.GetItemsAsync();
            ApplyFilter();
        }
    }
}
