import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/business_list_screen.dart';
import 'widgets/update_checker_widget.dart';
import 'services/app_update_service.dart';
import 'providers/cart_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Check if we need to clear the update pending status
  await checkAndClearUpdateStatus();
  
  runApp(const MyApp());
}

// Check if the current version matches or exceeds the pending update version
// If so, clear the pending update status
Future<void> checkAndClearUpdateStatus() async {
  try {
    final pendingUpdate = await AppUpdateService.getPendingUpdateInfo();
    if (pendingUpdate != null) {
      final currentVersion = await AppUpdateService.getCurrentAppVersion();
      final pendingVersion = pendingUpdate['version'] ?? '';
      
      // If current version is equal to or newer than the pending update version,
      // or if the pending version is empty, clear the pending status
      if (pendingVersion.isEmpty || 
          !AppUpdateService.isNewVersionAvailable(currentVersion, pendingVersion)) {
        await AppUpdateService.clearUpdatePending();
      }
    }
  } catch (e) {
    debugPrint('Error checking update status: $e');
  }
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => CartProvider()),
      ],
      child: UpdateCheckerWidget(
        child: MaterialApp(
          title: 'Garden Club',
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            colorScheme: ColorScheme.fromSeed(
              seedColor: Colors.green,
              primary: Colors.green,
              secondary: Colors.green,
            ),
            appBarTheme: const AppBarTheme(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
            ),
            elevatedButtonTheme: ElevatedButtonThemeData(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
              ),
            ),
            useMaterial3: true,
          ),
          home: const BusinessListScreen(),
        ),
      ),
    );
  }
}
