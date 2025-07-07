import 'package:flutter/material.dart';
import '../models/business.dart';
import 'dart:developer' as developer;
import 'package:url_launcher/url_launcher.dart';

class BusinessProfileScreen extends StatelessWidget {
  final Business business;

  const BusinessProfileScreen({
    super.key,
    required this.business,
  });

  Future<void> _launchMapUrl(BuildContext context, String mapLocation) async {
    String urlString = mapLocation;
    if (!mapLocation.startsWith('http')) {
      // Assume coordinates format: "latitude,longitude"
      urlString = 'https://maps.google.com/?q=$mapLocation';
    }
    final Uri url = Uri.parse(urlString);
    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    } else {
      developer.log('Could not launch map URL: $mapLocation',
          name: 'BusinessProfileScreen');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open Google Maps')),
        );
      } else {
        developer.log('Widget is no longer mounted, cannot show SnackBar',
            name: 'BusinessProfileScreen');
      }
    }
  }

  String _getDirectImageUrl(String url) {
    if (url.contains('drive.google.com')) {
      // Extract file ID from Google Drive URL
      final RegExp regExp =
          RegExp(r'/d/([a-zA-Z0-9_-]+)|/file/d/([a-zA-Z0-9_-]+)/');
      final match = regExp.firstMatch(url);
      if (match != null) {
        final fileId = match.group(1) ?? match.group(2);
        if (fileId != null) {
          return 'https://drive.google.com/uc?export=view&id=$fileId';
        }
      }
    }
    return url;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(business.name),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (business.profilePictureUrl.isNotEmpty)
              Stack(
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: GestureDetector(
                        onTap: () {
                          if (business.profilePictureUrl.isNotEmpty) {
                            showDialog(
                              context: context,
                              builder: (context) => Dialog(
                                child: Image.network(
                                  _getDirectImageUrl(business.profilePictureUrl),
                                  fit: BoxFit.contain,
                                ),
                              ),
                            );
                          }
                        },
                        child: Image.network(
                          _getDirectImageUrl(business.profilePictureUrl),
                          height: 200,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          cacheWidth: 1200,
                          cacheHeight: 800,
                          errorBuilder: (context, error, stackTrace) {
                            developer.log('Error loading image: $error',
                                name: 'BusinessProfileScreen');
                            return Container(
                              height: 200,
                              width: double.infinity,
                              color: Colors.grey[300],
                              child: const Center(
                                child: Text(
                                  'Failed to load image',
                                  style: TextStyle(color: Colors.grey),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  ),

                ],
              ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    business.name,
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Owner: ${business.ownerName}',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 16),
                  if (business.bio.isNotEmpty) ...[                    
                    Text(
                      business.bio,
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                    const SizedBox(height: 16),
                  ],
                  const Divider(),
                  const SizedBox(height: 16),
                  _buildInfoSection(
                    context,
                    'Contact Information',
                    [
                      _buildInfoRow(Icons.location_on, business.address),
                      if (business.mapLocation.isNotEmpty)
                        _buildClickableInfoRow(
                          Icons.map,
                          'View on Google Maps',
                          () => _launchMapUrl(context, business.mapLocation),
                        ),
                      _buildInfoRow(Icons.phone, business.phoneNumber),
                      _buildInfoRow(Icons.message, business.whatsAppNumber), // Using message icon as WhatsApp alternative
                      _buildInfoRow(Icons.email, business.emailAddress),
                    ],
                  ),
                  const SizedBox(height: 24),
                  _buildInfoSection(
                    context,
                    'Business Hours',
                    [
                      _buildInfoRow(Icons.access_time, business.operationHours),
                      if (business.specialHours.isNotEmpty)
                        _buildInfoRow(
                            Icons.event_note, 'Special Hours:\n${business.specialHours}'),
                    ],
                  ),
                  if (business.hasDelivery) ...[                    
                    const SizedBox(height: 24),
                    _buildInfoSection(
                      context,
                      'Delivery Information',
                      [
                        _buildInfoRow(
                            Icons.local_shipping, 'Delivery Available'),
                        _buildInfoRow(
                            Icons.map, 'Delivery Area: ${business.deliveryArea}'),
                        if (business.deliveryCost != null)
                          _buildInfoRow(
                            Icons.attach_money,
                            'Delivery Cost: \$${business.deliveryCost!.toStringAsFixed(2)}'
                          ),
                        if (business.islandWideDelivery.isNotEmpty) ...[                          
                          _buildInfoRow(
                            Icons.delivery_dining,
                            'Island Wide Delivery via ${business.islandWideDelivery}'
                          ),
                          if (business.islandWideDeliveryCost != null)
                            _buildInfoRow(
                              Icons.attach_money,
                              'Island Wide Delivery Cost: \$${business.islandWideDeliveryCost!.toStringAsFixed(2)}'
                            ),
                        ],
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoSection(BuildContext context, String title, List<Widget> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 16),
        ...items,
      ],
    );
  }

  Widget _buildClickableInfoRow(IconData icon, String text, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 20, color: Colors.green),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                text,
                style: const TextStyle(
                  color: Colors.blue,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: Colors.green),
          const SizedBox(width: 12),
          Expanded(
            child: Text(text),
          ),
        ],
      ),
    );
  }
}