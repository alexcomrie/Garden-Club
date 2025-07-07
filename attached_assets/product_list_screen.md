import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/business.dart';
import '../services/business_service.dart';
import '../providers/cart_provider.dart';
import 'business_profile_screen.dart';
import '../widgets/image_viewer_widget.dart';
import '../widgets/add_to_cart_bottom_sheet.dart';
import 'cart_screen.md';

class ProductListScreen extends StatefulWidget {
  final Business business;

  const ProductListScreen({
    super.key,
    required this.business,
  });

  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  Map<String, List<Product>> _products = {};
  String _error = '';
  bool _isLoading = true;
  bool _isRefreshing = false;
  String? _selectedCategory;

  final List<String> _categories = [
    'Flowers',
    'Fruit Trees',
    'Herbs',
    'Others',
  ];

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _error = '';
    });

    try {
      final products = await BusinessService.loadProducts(widget.business.productSheetUrl);
      if (!mounted) return;
      setState(() {
        _products = products;
        _isLoading = false;
        // Set initial category if not set
        if (_selectedCategory == null && products.isNotEmpty) {
          _selectedCategory = _categories.first;
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _refreshProducts() async {
    if (_isRefreshing) return;
    setState(() {
      _isRefreshing = true;
      _error = '';
    });

    try {
      final products = await BusinessService.fetchProductsFromNetwork(widget.business.productSheetUrl);
      if (!mounted) return;
      setState(() {
        _products = products;
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
        title: Text(widget.business.name),
        actions: [
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
            onPressed: _isRefreshing ? null : _refreshProducts,
          ),
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.shopping_cart),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const CartScreen(),
                    ),
                  );
                },
              ),
              Consumer<CartProvider>(
                builder: (context, cart, child) {
                  if (cart.itemCount == 0) return const SizedBox.shrink();
                  return Positioned(
                    right: 8,
                    top: 8,
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        color: Colors.red,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 16,
                        minHeight: 16,
                      ),
                      child: Text(
                        '${cart.itemCount}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.info),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => BusinessProfileScreen(
                    business: widget.business,
                  ),
                ),
              );
            },
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
                    onPressed: _loadProducts,
                    child: const Text('Try Again'),
                  ),
                ],
              ),
            )
          : _isLoading
              ? const Center(child: CircularProgressIndicator())
              : Column(
                  children: [
                    Container(
                      height: 60,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        itemCount: _categories.length,
                        itemBuilder: (context, index) {
                          final category = _categories[index];
                          final isSelected = category == _selectedCategory;
                          return Padding(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 4),
                            child: ChoiceChip(
                              avatar: Icon(
                                category == 'Flowers' ? Icons.local_florist :
                                category == 'Herbs' ? Icons.grass :
                                category == 'Fruit Trees' ? Icons.nature :
                                Icons.category,
                                size: 18,
                              ),
                              label: Text(category),
                              selected: isSelected,
                              onSelected: (selected) {
                                if (selected) {
                                  setState(() {
                                    _selectedCategory = category;
                                  });
                                }
                              },
                            ),
                          );
                        },
                      ),
                    ),
                    Expanded(
                      child: RefreshIndicator(
                        onRefresh: _refreshProducts,
                        child: _selectedCategory == null
                            ? const Center(
                                child: Text('No products available'),
                              )
                            : ListView.builder(
                                padding: const EdgeInsets.all(8),
                                itemCount: (_products[_selectedCategory] ?? []).length,
                                itemBuilder: (context, index) {
                                  final product = _products[_selectedCategory]![index];
                                  return Card(
                                    margin: const EdgeInsets.symmetric(
                                        vertical: 8),
                                    child: Opacity(
                                      opacity: product.inStock ? 1.0 : 0.6,
                                      child: InkWell(
                                        onTap: () {
                                           if (!product.inStock) {
                                             ScaffoldMessenger.of(context).showSnackBar(
                                               const SnackBar(
                                                 content: Text('This product is currently out of stock'),
                                                 duration: Duration(seconds: 2),
                                               ),
                                             );
                                             return;
                                           }
                                        showModalBottomSheet<void>(
                                          context: context,
                                          isScrollControlled: true,
                                          builder: (BuildContext context) => Padding(
                                            padding: EdgeInsets.only(
                                              bottom: MediaQuery.of(context).viewInsets.bottom,
                                            ),
                                            child: AddToCartBottomSheet(
                                              product: product,
                                              business: widget.business,
                                              parentContext: context,
                                            ),
                                          ),
                                        );
                                      },
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          if (product.imageUrl.isNotEmpty)
                                            ClipRRect(
                                              borderRadius:
                                                  const BorderRadius.vertical(
                                                      top: Radius.circular(4)),
                                              child: Image.network(
                                                _getDirectImageUrl(product.imageUrl),
                                                height: 200,
                                                width: double.infinity,
                                                fit: BoxFit.cover,
                                                errorBuilder: (context, error,
                                                        stackTrace) =>
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
                                            ),
                                          Padding(
                                            padding: const EdgeInsets.all(16),
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  product.name,
                                                  style: Theme.of(context)
                                                      .textTheme
                                                      .titleLarge
                                                      ?.copyWith(
                                                        fontWeight:
                                                            FontWeight.bold,
                                                      ),
                                                ),
                                                const SizedBox(height: 8),
                                                Text(
                                                  product.description,
                                                  style: Theme.of(context)
                                                      .textTheme
                                                      .bodyMedium,
                                                ),
                                                const SizedBox(height: 8),
                                                Row(
                                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                  children: [
                                                    Column(
                                                      crossAxisAlignment: CrossAxisAlignment.start,
                                                      children: [
                                                        Text(
                                                          '\$${product.price.toStringAsFixed(2)}',
                                                          style: Theme.of(context)
                                                              .textTheme
                                                              .titleMedium
                                                              ?.copyWith(
                                                                color: Colors.green,
                                                                fontWeight:
                                                                    FontWeight.bold,
                                                              ),
                                                        ),
                                                        Text(
                                                          product.inStock ? 'In Stock' : 'Out of Stock',
                                                          style: TextStyle(
                                                            color: product.inStock ? Colors.green : Colors.red,
                                                            fontWeight: FontWeight.bold,
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                    if (product.imageUrl.isNotEmpty)
                                                      TextButton.icon(
                                                        onPressed: () {
                                                          Navigator.push(
                                                            context,
                                                            MaterialPageRoute(
                                                              builder: (context) => ImageViewerWidget(
                                                                imageUrl: _getDirectImageUrl(product.imageUrl),
                                                              ),
                                                            ),
                                                          );
                                                        },
                                                        icon: const Icon(Icons.image),
                                                        label: const Text('View'),
                                                      ),
                                                  ],
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    )),
                                  );
                                },
                              ),
                      ),
                    ),
                  ],
                ),
    );
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