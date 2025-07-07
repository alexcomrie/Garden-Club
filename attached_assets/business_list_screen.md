import 'package:flutter/material.dart';
import '../models/business.dart';
import '../services/business_service.dart';
import '../services/app_update_service.dart';
import '../widgets/update_dialog.dart';
import 'product_list_screen.dart';
import 'business_profile_screen.dart';
import 'settings_screen.dart';

class BusinessListScreen extends StatefulWidget {
  const BusinessListScreen({super.key});

  @override
  State<BusinessListScreen> createState() => _BusinessListScreenState();
}

class _BusinessListScreenState extends State<BusinessListScreen> {
  List<Business> _businesses = [];
  String _error = '';
  bool _isLoading = true;
  bool _isRefreshing = false;

  String _getDirectImageUrl(String url) {
    if (url.isEmpty) return '';
    if (url.contains('drive.google.com')) {
      String? fileId;
      if (url.contains('/file/d/')) {
        fileId = url.split('/file/d/')[1].split('/')[0];
      } else if (url.contains('id=')) {
        fileId = url.split('id=')[1].split('&')[0];
      }
      if (fileId == null) return '';
      return 'https://drive.google.com/uc?export=view&id=$fileId';
    }
    return url;
  }

  @override
  void initState() {
    super.initState();
    _loadBusinesses();
    _checkForUpdates();
  }

  Future<void> _checkForUpdates() async {
    try {
      final currentVersion = await AppUpdateService.getCurrentAppVersion();
      final updateData = await AppUpdateService.getAppUpdateData();

      if (!mounted) return;

      if (updateData != null) {
        final remoteVersion = updateData["version"]!;
        final updateLink = updateData["link"]!;

        if (AppUpdateService.isNewVersionAvailable(currentVersion, remoteVersion)) {
          if (!mounted) return;
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (context) => UpdateDialog(
              updateLink: updateLink,
              currentVersion: currentVersion,
              newVersion: remoteVersion,
            ),
          );
          await AppUpdateService.savePendingUpdateInfo(remoteVersion, updateLink);
        }
      }
    } catch (e) {
      // Silently handle update check errors
    }
  }

  Future<void> _loadBusinesses() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _error = '';
    });

    try {
      final businesses = await BusinessService.loadBusinesses();
      if (!mounted) return;
      setState(() {
        _businesses = businesses;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _refreshBusinesses() async {
    if (_isRefreshing) return;
    setState(() {
      _isRefreshing = true;
      _error = '';
    });

    try {
      final businesses = await BusinessService.fetchBusinessesFromNetwork();
      if (!mounted) return;
      setState(() {
        _businesses = businesses;
        _isRefreshing = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _isRefreshing = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Garden Club'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const SettingsScreen(),
                ),
              );
            },
          ),
          IconButton(
            icon: _isRefreshing
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  )
                : const Icon(Icons.refresh),
            onPressed: _isRefreshing ? null : _refreshBusinesses,
          ),
        ],
      ),
      body: _error.isNotEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    _error,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.red),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _loadBusinesses,
                    child: const Text('Try Again'),
                  ),
                ],
              ),
            )
          : _isLoading
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _refreshBusinesses,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(8),
                    itemCount: _businesses.length,
                    itemBuilder: (context, index) {
                      final business = _businesses[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(vertical: 8),
                        child: Column(
                          children: [
                            InkWell(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => BusinessProfileScreen(
                                      business: business,
                                    ),
                                  ),
                                );
                              },
                              child: Stack(
                                children: [
                                  business.profilePictureUrl.isNotEmpty
                                      ? ClipRRect(
                                          borderRadius: BorderRadius.circular(8),
                                          child: Image.network(
                                            _getDirectImageUrl(business.profilePictureUrl),
                                            height: 200,
                                            width: double.infinity,
                                            fit: BoxFit.cover,
                                            cacheWidth: 800,
                                            cacheHeight: 600,
                                            errorBuilder:
                                                (context, error, stackTrace) =>
                                                    Container(
                                              height: 200,
                                              color: Colors.grey[300],
                                              child: const Icon(
                                                Icons.image_not_supported,
                                                size: 50,
                                                color: Colors.grey,
                                              ),
                                            ),
                                          ),
                                        )
                                      : Container(
                                          height: 200,
                                          color: Colors.grey[300],
                                          child: const Icon(
                                            Icons.store,
                                            size: 50,
                                            color: Colors.grey,
                                          ),
                                        ),
                                  Positioned(
                                    bottom: 8,
                                    right: 8,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: Colors.black54,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: const Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            Icons.touch_app,
                                            color: Colors.white,
                                            size: 16,
                                          ),
                                          SizedBox(width: 4),
                                          Text(
                                            'Tap image to view',
                                            style: TextStyle(
                                              color: Colors.white,
                                              fontSize: 12,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    business.name,
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleLarge
                                        ?.copyWith(
                                          fontWeight: FontWeight.bold,
                                        ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    business.address,
                                    style: Theme.of(context).textTheme.bodyMedium,
                                  ),
                                  if (business.bio.isNotEmpty) ...[                                    
                                    const SizedBox(height: 8),
                                    Text(
                                      business.bio,
                                      style: Theme.of(context).textTheme.bodyMedium,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                  const SizedBox(height: 16),
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceEvenly,
                                    children: [
                                      Expanded(
                                        child: ElevatedButton(
                                          onPressed: () {
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (context) =>
                                                    ProductListScreen(
                                                  business: business,
                                                ),
                                              ),
                                            );
                                          },
                                          child: const Text('View Products'),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
