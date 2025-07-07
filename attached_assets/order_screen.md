import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:convert';
import '../models/business.dart';

class OrderScreen extends StatefulWidget {
  final Business business;
  final Product product;

  const OrderScreen({
    super.key,
    required this.business,
    required this.product,
  });

  @override
  State<OrderScreen> createState() => _OrderScreenState();
}

class _OrderScreenState extends State<OrderScreen> {
  final _formKey = GlobalKey<FormState>();
  List<Map<String, Object>> orders = [];
  String customerName = '';
  String deliveryOption = 'pickup'; // Options: 'pickup', 'delivery', 'island_wide_delivery'
  String deliveryAddress = '';
  String pickupTime = '';
  int quantity = 1;

  @override
  void initState() {
    super.initState();
    _loadSavedState();
  }

  Future<void> _loadSavedState() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      final savedOrders = jsonDecode(prefs.getString('orders') ?? '[]') as List;
      orders = savedOrders.map((order) {
        final Map<String, Object> orderMap = Map<String, Object>.from(order as Map);
        final productData = Map<String, Object>.from(orderMap['product'] as Map);
        return <String, Object>{
          'product': Product.fromJson(productData),
          'quantity': orderMap['quantity'] as int,
        };
      }).toList();
      customerName = prefs.getString('customerName') ?? '';
      deliveryOption = prefs.getString('deliveryOption') ?? 'pickup';
      deliveryAddress = prefs.getString('deliveryAddress') ?? '';
      pickupTime = prefs.getString('pickupTime') ?? '';
    });
  }

  Future<void> _saveState() async {
    final prefs = await SharedPreferences.getInstance();
    final ordersList = orders.map((order) => <String, Object>{
          'product': (order['product'] as Product).toJson(),
          'quantity': (order['quantity'] as int),
        }).toList();
    await prefs.setString('orders', jsonEncode(ordersList));
    await prefs.setString('customerName', customerName);
    await prefs.setString('deliveryOption', deliveryOption);
    await prefs.setString('deliveryAddress', deliveryAddress);
    await prefs.setString('pickupTime', pickupTime);
  }

  void _addToOrder() {
    setState(() {
      orders.add(<String, Object>{
        'product': widget.product,
        'quantity': quantity,
      });
    });
    _saveState();
    Navigator.pop(context);
  }

  Future<void> _sendOrder() async {
    if (_formKey.currentState!.validate()) {
      _formKey.currentState!.save();
      String orderSummary = _buildOrderSummary();
      final phoneNumber = widget.business.whatsAppNumber;
      String deliveryInfo = '';
      if (deliveryOption == 'pickup') {
        deliveryInfo = 'Pickup Time: $pickupTime';
      } else if (deliveryOption == 'delivery') {
        deliveryInfo = 'Delivery Address: $deliveryAddress';
      } else if (deliveryOption == 'island_wide_delivery') {
        deliveryInfo = 'Island Wide Delivery via ${widget.business.islandWideDelivery}\nDelivery Address: $deliveryAddress';
      }

      final message = Uri.encodeComponent(
        'Hello ${widget.business.name}, I would like to place an order for:\n$orderSummary\nName: $customerName\n$deliveryInfo',
      );
      final url = 'https://wa.me/$phoneNumber?text=$message';
      if (await canLaunchUrl(Uri.parse(url))) {
        await launchUrl(Uri.parse(url));
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not launch WhatsApp')),
        );
      }
    }
  }

  String _buildOrderSummary() {
    StringBuffer summary = StringBuffer();
    double totalPrice = 0;

    for (var order in orders) {
      final product = order['product'] as Product;
      final quantity = order['quantity'] as int;
      final itemTotal = product.price * quantity;
      totalPrice += itemTotal;

      summary.write('${product.name} x $quantity @ \$${product.price.toStringAsFixed(2)} = \$${itemTotal.toStringAsFixed(2)}\n');
    }

    // Add delivery costs if applicable
    if (deliveryOption == 'delivery' && widget.business.deliveryCost != null) {
      summary.write('\nDelivery Cost: \$${widget.business.deliveryCost!.toStringAsFixed(2)}');
      totalPrice += widget.business.deliveryCost!;
    } else if (deliveryOption == 'island_wide_delivery' && widget.business.islandWideDeliveryCost != null) {
      summary.write('\nIsland Wide Delivery Cost: \$${widget.business.islandWideDeliveryCost!.toStringAsFixed(2)}');
      totalPrice += widget.business.islandWideDeliveryCost!;
    }

    summary.write('\nTotal: \$${totalPrice.toStringAsFixed(2)}');
    if (deliveryOption == 'delivery' && widget.business.hasDelivery) {
      summary.write('\nDelivery Area: ${widget.business.deliveryArea}');
    }

    return summary.toString();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Place Order'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.product.name,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      widget.product.description,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '\$${widget.product.price.toStringAsFixed(2)}',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: Colors.green,
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        const Text('Quantity:'),
                        const SizedBox(width: 16),
                        IconButton(
                          icon: const Icon(Icons.remove),
                          onPressed: quantity > 1
                              ? () => setState(() => quantity--)
                              : null,
                        ),
                        Text(quantity.toString()),
                        IconButton(
                          icon: const Icon(Icons.add),
                          onPressed: () => setState(() => quantity++),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _addToOrder,
                      child: const Text('Add to Order'),
                    ),
                  ],
                ),
              ),
            ),
            if (orders.isNotEmpty) ...[
              const SizedBox(height: 24),
              Text(
                'Order Summary',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextFormField(
                      initialValue: customerName,
                      decoration: const InputDecoration(
                        labelText: 'Your Name',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) =>
                          value?.isEmpty ?? true ? 'Please enter your name' : null,
                      onSaved: (value) => customerName = value ?? '',
                    ),
                    const SizedBox(height: 16),
                    if (widget.business.hasDelivery)
                      Column(
                        children: [
                          SegmentedButton<String>(
                            segments: [
                              const ButtonSegment(
                                value: 'pickup',
                                label: Text('Pickup'),
                              ),
                              const ButtonSegment(
                                value: 'delivery',
                                label: Text('Delivery'),
                              ),
                              if (widget.business.islandWideDelivery.isNotEmpty)
                                ButtonSegment(
                                  value: 'island_wide_delivery',
                                  label: Text('Island Wide Delivery'),
                                ),
                            ],
                            selected: {deliveryOption},
                            onSelectionChanged: (Set<String> newSelection) {
                              setState(() {
                                deliveryOption = newSelection.first;
                              });
                            },
                          ),
                          const SizedBox(height: 16),
                        ],
                      ),
                    if (deliveryOption == 'delivery' &&
                        widget.business.hasDelivery)
                      Column(
                        children: [
                          TextFormField(
                            initialValue: deliveryAddress,
                            decoration: const InputDecoration(
                              labelText: 'Delivery Address',
                              border: OutlineInputBorder(),
                            ),
                            validator: (value) => value?.isEmpty ?? true
                                ? 'Please enter delivery address'
                                : null,
                            onSaved: (value) => deliveryAddress = value ?? '',
                          ),
                          const SizedBox(height: 16),
                        ],
                      )
                    else
                      Column(
                        children: [
                          TextFormField(
                            initialValue: pickupTime,
                            decoration: const InputDecoration(
                              labelText: 'Preferred Pickup Time',
                              border: OutlineInputBorder(),
                            ),
                            validator: (value) => value?.isEmpty ?? true
                                ? 'Please enter pickup time'
                                : null,
                            onSaved: (value) => pickupTime = value ?? '',
                          ),
                          const SizedBox(height: 16),
                        ],
                      ),
                    const SizedBox(height: 24),
                    Text(_buildOrderSummary()),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: _sendOrder,
                      child: const Text('Send Order via WhatsApp'),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}