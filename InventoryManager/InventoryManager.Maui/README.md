# Studio Inventory MAUI Android build

This is the Docker-friendly successor to the Xamarin.Forms project. It keeps the same offline SQLite inventory workflow while targeting current .NET Android tooling.

From the `InventoryManager` directory:

```bash
docker build -f Dockerfile.maui .
```

The image compiles the app. To install an APK on a device, add an Android SDK/emulator or use Visual Studio/`dotnet publish` with a connected Android environment.
