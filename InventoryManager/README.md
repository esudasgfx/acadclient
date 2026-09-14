# Studio Inventory

Xamarin.Forms Android inventory management starter for interior design and implementation teams.

## Included

- Offline SQLite materials catalog with sample interior-design materials
- Search by material, category, supplier, or project code
- Low-stock summary and filter
- Add-material workflow
- Supplier, warehouse location, project code, reorder level, and notes fields

## Run on Android

Open `InteriorInventory.sln` in Visual Studio 2022 on Windows with the **Mobile development with .NET** workload and an Android SDK/emulator installed. Select `InteriorInventory.Android` as the startup project, choose an emulator or connected device, and run.

The shared project builds in this workspace. The current Linux container does not include the legacy `MonoAndroid v11.0` targeting pack required to build the Android host.

Xamarin is retired by Microsoft for new production work. This project follows the requested Xamarin.Forms structure; a new long-lived product should migrate the UI to .NET MAUI.
