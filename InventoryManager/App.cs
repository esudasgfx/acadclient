using Xamarin.Forms;

namespace InteriorInventory
{
    public class App : Application
    {
        public App()
        {
            MainPage = new NavigationPage(new MainPage())
            {
                BarBackgroundColor = Color.FromHex("#173B3F"),
                BarTextColor = Color.White
            };
        }
    }
}
