class Business {
  final String id;
  final String name;
  final String ownerName;
  final String address;
  final String phoneNumber;
  final String whatsAppNumber;
  final String emailAddress;
  final bool hasDelivery;
  final String deliveryArea;
  final String operationHours;
  final String specialHours;
  final String profilePictureUrl;
  final String productSheetUrl;
  final String status;
  final String bio;
  final String mapLocation;
  final double? deliveryCost;
  final String islandWideDelivery;
  final double? islandWideDeliveryCost;

  Business({
    required this.name,
    required this.ownerName,
    required this.address,
    required this.phoneNumber,
    required this.whatsAppNumber,
    required this.emailAddress,
    required this.hasDelivery,
    required this.deliveryArea,
    required this.operationHours,
    required this.specialHours,
    required this.profilePictureUrl,
    required this.productSheetUrl,
    required this.status,
    required this.bio,
    required this.mapLocation,
    this.deliveryCost,
    required this.islandWideDelivery,
    this.islandWideDeliveryCost,
  }) : id = name.toLowerCase().replaceAll(' ', '_');

  factory Business.fromCsv(List<dynamic> row) {
    return Business(
      name: row[0].toString(),
      ownerName: row[1].toString(),
      address: row[2].toString(),
      phoneNumber: row[3].toString(),
      whatsAppNumber: row[4].toString(),
      emailAddress: row[5].toString(),
      hasDelivery: row[6].toString().toLowerCase() == 'yes',
      deliveryArea: row[7].toString(),
      operationHours: row[8].toString(),
      specialHours: row[9].toString(),
      profilePictureUrl: row[10].toString(),
      productSheetUrl: row[11].toString(),
      bio: row[13].toString(),
      status: row[12].toString().toLowerCase(),
      mapLocation: row.length > 14 ? row[14].toString() : '',
      deliveryCost: row.length > 15 ? double.tryParse(row[15].toString()) : null,
      islandWideDelivery: row.length > 16 ? row[16].toString() : '',
      islandWideDeliveryCost: row.length > 17 ? double.tryParse(row[17].toString()) : null);
  }

  factory Business.fromJson(Map<String, dynamic> json) {
    return Business(
      name: json['name'] as String,
      ownerName: json['ownerName'] as String,
      address: json['address'] as String,
      phoneNumber: json['phoneNumber'] as String,
      whatsAppNumber: json['whatsAppNumber'] as String,
      emailAddress: json['emailAddress'] as String,
      hasDelivery: json['hasDelivery'] as bool,
      deliveryArea: json['deliveryArea'] as String,
      operationHours: json['operationHours'] as String,
      specialHours: json['specialHours'] as String,
      profilePictureUrl: json['profilePictureUrl'] as String,
      productSheetUrl: json['productSheetUrl'] as String,
      bio: json['bio'] as String,
      status: json['status'] as String,
      mapLocation: json['mapLocation'] as String,
      deliveryCost: json['deliveryCost'] as double?,
      islandWideDelivery: json['islandWideDelivery'] as String,
      islandWideDeliveryCost: json['islandWideDeliveryCost'] as double?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'ownerName': ownerName,
        'address': address,
        'phoneNumber': phoneNumber,
        'whatsAppNumber': whatsAppNumber,
        'emailAddress': emailAddress,
        'hasDelivery': hasDelivery,
        'deliveryArea': deliveryArea,
        'operationHours': operationHours,
        'specialHours': specialHours,
        'profilePictureUrl': profilePictureUrl,
        'productSheetUrl': productSheetUrl,
        'bio': bio,
        'status': status,
        'mapLocation': mapLocation,
        'deliveryCost': deliveryCost,
        'islandWideDelivery': islandWideDelivery,
        'islandWideDeliveryCost': islandWideDeliveryCost,
      };
}

class Product {
  final String name;
  final String category;
  final double price;
  final String description;
  final String imageUrl;
  final bool inStock;

  Product({
    required this.name,
    required this.category,
    required this.price,
    required this.description,
    required this.imageUrl,
    required this.inStock,
  });

  factory Product.fromCsv(List<dynamic> row) {
    String status = row[5].toString().trim().toLowerCase();
    return Product(
      name: row[0].toString(),
      category: row[1].toString(),
      price: double.tryParse(row[2].toString().replaceAll(r'$', '')) ?? 0.0,
      description: row[3].toString(),
      imageUrl: row[4].toString(),
      inStock: status == 'yes' || status == 'in stock',
    );
  }

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      name: json['name'] as String,
      category: json['category'] as String,
      price: json['price'] as double,
      description: json['description'] as String,
      imageUrl: json['imageUrl'] as String,
      inStock: json['inStock'] as bool,
    );
  }

  Map<String, Object> toJson() => {
        'name': name,
        'category': category,
        'price': price,
        'description': description,
        'imageUrl': imageUrl,
        'inStock': inStock,
      };
}