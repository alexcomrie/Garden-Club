import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/business.dart';
import '../providers/cart_provider.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final _formKey = GlobalKey<FormState>();
  late CartProvider _cartProvider;

  @override
  void initState() {
    super.initState();
    _cartProvider = Provider.of<CartProvider>(context, listen: false);
  }



  void _removeFromOrder(int index) {
    _cartProvider.removeFromCart(index);
  }

  Future<void> _sendOrder() async {
    if (_formKey.currentState!.validate() && _cartProvider.selectedBusiness != null) {
      _formKey.currentState!.save();
      String orderSummary = _buildOrderSummary();
      String deliveryMethod = _cartProvider.deliveryOption == 'island_wide' ? 'Island Wide Delivery' : 
                             _cartProvider.deliveryOption == 'delivery' ? 'Delivery' : 'Pickup';
      final phoneNumber = _cartProvider.selectedBusiness!.whatsAppNumber;
      final message = Uri.encodeComponent(
        'Hello ${_cartProvider.selectedBusiness!.name}, I would like to place an order for:\n$orderSummary\nName: ${_cartProvider.customerName}\nDelivery Method: $deliveryMethod\n${_cartProvider.deliveryOption == 'delivery' ? 'Delivery Address: ${_cartProvider.deliveryAddress}' : 'Pickup Time: ${_cartProvider.pickupTime}'}',
      );
      final url = 'https://wa.me/$phoneNumber?text=$message';
      if (await canLaunchUrl(Uri.parse(url))) {
        await launchUrl(Uri.parse(url));
        // Clear the cart after successful order
        _cartProvider.clearCart();
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

    for (var order in _cartProvider.orders) {
      final product = order['product'] as Product;
      final quantity = order['quantity'] as int;
      final itemTotal = product.price * quantity;
      totalPrice += itemTotal;

      summary.write('${product.name} x $quantity @ \$${product.price.toStringAsFixed(2)} = \$${itemTotal.toStringAsFixed(2)}\n');
    }

    summary.write('\nTotal: \$${totalPrice.toStringAsFixed(2)}');
    if (_cartProvider.deliveryOption == 'delivery' && _cartProvider.selectedBusiness?.hasDelivery == true) {
      summary.write('\nDelivery Area: ${_cartProvider.selectedBusiness!.deliveryArea}');
      if (_cartProvider.selectedBusiness?.deliveryCost != null) {
        summary.write('\nDelivery Cost: \$${_cartProvider.selectedBusiness!.deliveryCost!.toStringAsFixed(2)}');
        totalPrice += _cartProvider.selectedBusiness!.deliveryCost!;
      }
    } else if (_cartProvider.deliveryOption == 'island_wide' && _cartProvider.selectedBusiness?.islandWideDelivery.isNotEmpty == true) {
      summary.write('\nIsland Wide Delivery via ${_cartProvider.selectedBusiness!.islandWideDelivery}');
      if (_cartProvider.selectedBusiness?.islandWideDeliveryCost != null) {
        summary.write('\nDelivery Cost: \$${_cartProvider.selectedBusiness!.islandWideDeliveryCost!.toStringAsFixed(2)}');
        totalPrice += _cartProvider.selectedBusiness!.islandWideDeliveryCost!;
      }
    }

    return summary.toString();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Shopping Cart'),
      ),
      body: Consumer<CartProvider>(
        builder: (context, cart, child) => cart.orders.isEmpty
          ? const Center(
              child: Text('Your cart is empty'),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: cart.orders.length,
                    itemBuilder: (context, index) {
                      final order = cart.orders[index];
                      final product = order['product'] as Product;
                      final quantity = order['quantity'] as int;
                      return Card(
                        child: ListTile(
                          title: Text(product.name),
                          subtitle: Text(
                              '\$${product.price.toStringAsFixed(2)} x $quantity'),
                          trailing: IconButton(
                            icon: const Icon(Icons.delete),
                            onPressed: () => _removeFromOrder(index),
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 24),
                  Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        TextFormField(
                          initialValue: cart.customerName,
                          decoration: const InputDecoration(
                            labelText: 'Your Name',
                            border: OutlineInputBorder(),
                          ),
                          validator: (value) =>
                              value?.isEmpty ?? true ? 'Please enter your name' : null,
                          onSaved: (value) => _cartProvider.updateCustomerInfo(customerName: value ?? ''),
                        ),
                        const SizedBox(height: 16),
                        if (cart.selectedBusiness?.hasDelivery == true)
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
                                  if (cart.selectedBusiness?.islandWideDelivery.isNotEmpty == true)
                                    const ButtonSegment(
                                      value: 'island_wide',
                                      label: Text('Island Wide Delivery'),
                                    ),
                                ],
                                selected: {cart.deliveryOption},
                                onSelectionChanged: (Set<String> newSelection) {
                                  _cartProvider.updateCustomerInfo(deliveryOption: newSelection.first);
                                },
                              ),
                              const SizedBox(height: 16),
                            ],
                          ),
                        if ((cart.deliveryOption == 'delivery' && cart.selectedBusiness?.hasDelivery == true) ||
                            (cart.deliveryOption == 'island_wide' && cart.selectedBusiness?.islandWideDelivery.isNotEmpty == true))
                          Column(
                            children: [
                              TextFormField(
                                initialValue: cart.deliveryAddress,
                                decoration: const InputDecoration(
                                  labelText: 'Delivery Address',
                                  border: OutlineInputBorder(),
                                ),
                                validator: (value) => value?.isEmpty ?? true
                                    ? 'Please enter delivery address'
                                    : null,
                                onSaved: (value) => _cartProvider.updateCustomerInfo(deliveryAddress: value ?? ''),
                              ),
                              const SizedBox(height: 16),
                            ],
                          )
                        else
                          Column(
                            children: [
                              TextFormField(
                                initialValue: cart.pickupTime,
                                decoration: const InputDecoration(
                                  labelText: 'Preferred Pickup Time',
                                  border: OutlineInputBorder(),
                                ),
                                validator: (value) => value?.isEmpty ?? true
                                    ? 'Please enter pickup time'
                                    : null,
                                onSaved: (value) => _cartProvider.updateCustomerInfo(pickupTime: value ?? ''),
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
              ),
            ),
        ),
    );
  }
}