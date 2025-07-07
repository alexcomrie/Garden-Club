import 'package:http/http.dart' as http;
import 'package:csv/csv.dart';
import 'dart:convert';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import '../models/business.dart';

class BusinessService {
  static const String profileSheetUrl =
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vTsstw4tcDryjFRgMtk7dWyB5WSKE9fu02YOLb5PnajOBGrq9W1wwvHxjvMrxzank8xsHUKBkRF0ib9/pub?output=csv';

  static final Map<String, List<Business>> _businessCache = {};
  static final Map<String, Map<String, List<Product>>> _productCache = {};

  static Future<String> get _localPath async {
    final directory = await getApplicationDocumentsDirectory();
    return directory.path;
  }

  static Future<File> get _businessLocalFile async {
    final path = await _localPath;
    return File('$path/businesses.json');
  }

  static Future<File> _productLocalFile(String productSheetUrl) async {
    final path = await _localPath;
    final hash = productSheetUrl.hashCode.toString();
    return File('$path/products_$hash.json');
  }

  static Future<List<Business>> loadBusinesses() async {
    if (_businessCache.containsKey(profileSheetUrl)) {
      return _businessCache[profileSheetUrl]!;
    }

    try {
      final businesses = await _loadBusinessesFromLocal();
      if (businesses.isNotEmpty) {
        _businessCache[profileSheetUrl] = businesses;
        return businesses;
      }
    } catch (e) {
      // If local load fails, continue to fetch from network
    }

    return fetchBusinessesFromNetwork();
  }

  static Future<List<Business>> _loadBusinessesFromLocal() async {
    try {
      final file = await _businessLocalFile;
      if (await file.exists()) {
        final contents = await file.readAsString();
        final List<dynamic> jsonList = json.decode(contents);
        return jsonList
            .map((json) => Business.fromJson(json))
            .where((business) => business.status.toLowerCase() == 'active')
            .toList();
      }
    } catch (e) {
      // Handle file read error
    }
    return [];
  }

  static Future<void> _saveBusinessesToLocal(List<Business> businesses) async {
    try {
      final file = await _businessLocalFile;
      final jsonList = businesses.map((b) => b.toJson()).toList();
      await file.writeAsString(json.encode(jsonList));
    } catch (e) {
      // Handle file write error
    }
  }

  static Future<List<Business>> fetchBusinessesFromNetwork() async {
    try {
      final response = await http.get(Uri.parse(profileSheetUrl));
      if (response.statusCode == 200) {
        List<List<dynamic>> csvTable =
            const CsvToListConverter().convert(response.body);
        List<List<dynamic>> rows = csvTable.skip(1).toList();
        final businesses = rows
            .map((row) => Business.fromCsv(row))
            .where((business) => 
                business.status.toLowerCase() == 'active' && 
                business.profilePictureUrl.isNotEmpty &&
                business.name.isNotEmpty)
            .toList();

        await _saveBusinessesToLocal(businesses);
        _businessCache[profileSheetUrl] = businesses;
        return businesses;
      } else {
        throw Exception('Failed to load businesses');
      }
    } catch (e) {
      if (e.toString().contains('SocketException') ||
          e.toString().contains('ClientException') ||
          e.toString().contains('Failed host lookup')) {
        throw Exception('No internet connection. Please try again.');
      } else {
        throw Exception('Error loading businesses: ${e.toString()}');
      }
    }
  }

  static Future<Map<String, List<Product>>> loadProducts(String productSheetUrl) async {
    if (_productCache.containsKey(productSheetUrl)) {
      return _productCache[productSheetUrl]!;
    }

    try {
      final products = await _loadProductsFromLocal(productSheetUrl);
      if (products.isNotEmpty) {
        _productCache[productSheetUrl] = products;
        return products;
      }
    } catch (e) {
      // If local load fails, continue to fetch from network
    }

    return fetchProductsFromNetwork(productSheetUrl);
  }

  static Future<Map<String, List<Product>>> _loadProductsFromLocal(String productSheetUrl) async {
    try {
      final file = await _productLocalFile(productSheetUrl);
      if (await file.exists()) {
        final contents = await file.readAsString();
        final Map<String, dynamic> jsonMap = json.decode(contents);
        Map<String, List<Product>> products = {};
        jsonMap.forEach((key, value) {
          products[key] =
              (value as List).map((item) => Product.fromJson(item)).toList();
        });
        return products;
      }
    } catch (e) {
      // Handle file read error
    }
    return {};
  }

  static Future<void> _saveProductsToLocal(
      String productSheetUrl, Map<String, List<Product>> products) async {
    try {
      final file = await _productLocalFile(productSheetUrl);
      final jsonMap = {};
      products.forEach((key, value) {
        jsonMap[key] = value.map((p) => p.toJson()).toList();
      });
      await file.writeAsString(json.encode(jsonMap));
    } catch (e) {
      // Handle file write error
    }
  }

  static Future<Map<String, List<Product>>> fetchProductsFromNetwork(String productSheetUrl) async {
    try {
      final response = await http.get(Uri.parse(productSheetUrl));
      if (response.statusCode == 200) {
        List<List<dynamic>> csvTable =
            const CsvToListConverter().convert(response.body);
        List<List<dynamic>> rows = csvTable.skip(1).toList();
        final products = rows.map((row) => Product.fromCsv(row)).toList();

        // Group products by category
        Map<String, List<Product>> groupedProducts = {};
        for (var product in products) {
          if (!groupedProducts.containsKey(product.category)) {
            groupedProducts[product.category] = [];
          }
          groupedProducts[product.category]!.add(product);
        }

        await _saveProductsToLocal(productSheetUrl, groupedProducts);
        _productCache[productSheetUrl] = groupedProducts;
        return groupedProducts;
      } else {
        throw Exception('Failed to load products');
      }
    } catch (e) {
      if (e.toString().contains('SocketException') ||
          e.toString().contains('ClientException') ||
          e.toString().contains('Failed host lookup')) {
        throw Exception('No internet connection. Please try again.');
      } else {
        throw Exception('Error loading products: ${e.toString()}');
      }
    }
  }
}