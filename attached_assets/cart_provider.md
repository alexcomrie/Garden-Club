import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/business.dart';

class CartProvider extends ChangeNotifier {
  List<Map<String, Object>> _orders = [];
  String _customerName = '';
  String _deliveryOption = 'pickup';
  String _deliveryAddress = '';
  String _pickupTime = '';
  Business? _selectedBusiness;

  List<Map<String, Object>> get orders => _orders;
  String get customerName => _customerName;
  String get deliveryOption => _deliveryOption;
  String get deliveryAddress => _deliveryAddress;
  String get pickupTime => _pickupTime;
  Business? get selectedBusiness => _selectedBusiness;
  int get itemCount {
    int count = 0;
    for (var order in _orders) {
      count += order['quantity'] as int;
    }
    return count;
  }

  CartProvider() {
    _loadSavedState();
  }

  Future<void> _loadSavedState() async {
    final prefs = await SharedPreferences.getInstance();
    final savedOrders = jsonDecode(prefs.getString('orders') ?? '[]') as List;
    _orders = savedOrders.map((order) {
      final Map<String, Object> orderMap = Map<String, Object>.from(order as Map);
      final productData = Map<String, Object>.from(orderMap['product'] as Map);
      final businessData = Map<String, Object>.from(orderMap['business'] as Map);
      _selectedBusiness = Business.fromJson(businessData);
      return <String, Object>{
        'product': Product.fromJson(productData),
        'quantity': orderMap['quantity'] as int,
        'business': Business.fromJson(businessData),
      };
    }).toList();
    _customerName = prefs.getString('customerName') ?? '';
    _deliveryOption = prefs.getString('deliveryOption') ?? 'pickup';
    _deliveryAddress = prefs.getString('deliveryAddress') ?? '';
    _pickupTime = prefs.getString('pickupTime') ?? '';
    notifyListeners();
  }

  Future<void> _saveState() async {
    final prefs = await SharedPreferences.getInstance();
    final ordersList = _orders.map((order) => <String, Object>{
          'product': (order['product'] as Product).toJson(),
          'quantity': order['quantity'] as int,
          'business': (order['business'] as Business).toJson(),
        }).toList();
    await prefs.setString('orders', jsonEncode(ordersList));
    await prefs.setString('customerName', _customerName);
    await prefs.setString('deliveryOption', _deliveryOption);
    await prefs.setString('deliveryAddress', _deliveryAddress);
    await prefs.setString('pickupTime', _pickupTime);
  }

  void addToCart(Product product, Business business, int quantity) {
    if (_selectedBusiness != null && _selectedBusiness?.id != business.id) {
      _orders.clear();
    }
    _selectedBusiness = business;
    _orders.add(<String, Object>{
      'product': product,
      'quantity': quantity,
      'business': business,
    });
    _saveState();
    notifyListeners();
  }

  void removeFromCart(int index) {
    _orders.removeAt(index);
    if (_orders.isEmpty) {
      _selectedBusiness = null;
    }
    _saveState();
    notifyListeners();
  }

  void clearCart() {
    _orders.clear();
    _selectedBusiness = null;
    _saveState();
    notifyListeners();
  }

  void updateCustomerInfo({
    String? customerName,
    String? deliveryOption,
    String? deliveryAddress,
    String? pickupTime,
  }) {
    if (customerName != null) _customerName = customerName;
    if (deliveryOption != null) _deliveryOption = deliveryOption;
    if (deliveryAddress != null) _deliveryAddress = deliveryAddress;
    if (pickupTime != null) _pickupTime = pickupTime;
    _saveState();
    notifyListeners();
  }
}