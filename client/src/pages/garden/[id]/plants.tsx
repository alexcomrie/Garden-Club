import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useBusiness, useBusinessProducts } from "@/hooks/use-businesses";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Store, ArrowLeft, ShoppingCart, Plus, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCart } from "@/lib/providers/CartProvider";
import { Product } from "@/lib/models/business";

export default function GardenPlants() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { data: business, isLoading: isLoadingBusiness } = useBusiness(id);
  const { data: products, isLoading: isLoadingProducts } = useBusinessProducts(id);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, cart } = useCart();

  const categories = products
    ? Array.from(new Set(products.map((product) => product.category)))
    : [];

  const filteredProducts = selectedCategory
    ? products?.filter((product) => product.category === selectedCategory)
    : products;

  const handleAddToCart = () => {
    if (selectedProduct) {
      addToCart({
        businessId: id,
        product: selectedProduct,
        quantity,
      });
      setSelectedProduct(null);
      setQuantity(1);
    }
  };

  if (isLoadingBusiness || isLoadingProducts) {
    return (
      <div className="min-h-screen bg-neutral p-4">
        <Skeleton className="h-16 w-full rounded-lg mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!business || !products) {
    return (
      <div className="min-h-screen bg-neutral p-4 text-center">
        <Store className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Failed to load plants</h3>
        <p className="text-gray-600 mb-4">Please check your connection and try again</p>
        <Button onClick={() => setLocation(`/garden/${id}/profile`)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral">
      {/* Header */}
      <header className="bg-green-600 text-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation(`/garden/${id}/profile`)}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-bold">{business.name}</h1>
          </div>
          {cart.orders.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/cart')}
              className="text-white hover:bg-white/10 relative"
            >
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cart.orders.reduce((sum, order) => sum + order.quantity, 0)}
              </span>
            </Button>
          )}
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="container mx-auto px-4 pb-4 overflow-x-auto">
            <div className="flex space-x-2">
              <Button
                variant={selectedCategory === null ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="text-white hover:bg-white/10 whitespace-nowrap"
              >
                All Plants
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="text-white hover:bg-white/10 whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts?.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden cursor-pointer transition-transform hover:scale-105"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="relative h-48 overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Store className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                {!product.inStock && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-semibold">Out of Stock</span>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold truncate">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {product.description}
                </p>
                <p className="text-primary font-semibold">${product.price.toFixed(2)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Add to Cart Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedProduct?.imageUrl && (
              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.name}
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
            <p className="text-gray-600">{selectedProduct?.description}</p>
            <p className="text-lg font-semibold">
              ${(selectedProduct?.price || 0).toFixed(2)}
            </p>

            {selectedProduct?.inStock ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <Button className="w-full" onClick={handleAddToCart}>
                  Add to Cart - ${((selectedProduct?.price || 0) * quantity).toFixed(2)}
                </Button>
              </div>
            ) : (
              <Button className="w-full" disabled>
                Out of Stock
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}