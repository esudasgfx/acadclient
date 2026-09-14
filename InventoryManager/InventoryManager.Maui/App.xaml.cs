namespace InteriorInventory.Maui;

public partial class App : Application
{
    public App()
    {
        InitializeComponent();
        MainPage = new NavigationPage(new MainPage()) { BarBackgroundColor = Color.FromArgb("#173B3F"), BarTextColor = Colors.White };
    }
}
