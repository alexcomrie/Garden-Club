import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, ShoppingCart, Info, Eye } from "lucide-react";
import { useBusiness, useBusinessProducts } from "@/hooks/use-businesses";
import { useCart } from "@/providers/cart-provider";
import { Product } from "@shared/schema";
import ImageViewer from "@/components/image-viewer";

interface GardenPlantsProps {
  params: { id: string };
}

// Categories matching the Dart app exactly
const categories = ['Flowers', 'Fruit Trees', 'Herbs', 'Others'];

const categoryIcons: Record<string, string> = {
  'Flowers': '🌸',
  'Fruit Trees': '🌳',
  'Herbs': '🌿',
  'Others': '🌱'
};

export default function GardenPlants({ params }: GardenPlantsProps) {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>('Flowers');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const { data: business, isLoading: isLoadingBusiness, refetch: refetchBusiness } = useBusiness(params.id);
  const { data: productsMap, isLoading: isLoadingProducts, refetch: refetchProducts } = useBusinessProducts(params.id);
  const { itemCount, addToCart } = useCart();

  const products = productsMap && selectedCategory ? productsMap.get(selectedCategory) || [] : [];

  if (!business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Garden not found</h2>
          <Button onClick={() => setLocation('/')}>
            Back to Gardens
          </Button>
        </div>
      </div>
    );
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchBusiness(),
        refetchProducts()
      ]);
      setLastRefreshTime(Date.now());
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    if (!product.inStock) {
      return;
    }
    addToCart(product, business, 1);
  };

  if (isLoadingBusiness || isLoadingProducts) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/')}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">{business.name}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/cart')}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <ShoppingCart className="h-5 w-5" />
              </Button>
              {itemCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation(`/garden/${business.id}/profile`)}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <Info className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap flex items-center gap-2"
            >
              <span>{categoryIcons[category]}</span>
              {category}
            </Button>
          ))}
        </div>

        {/* Products List */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No plants available</h3>
            <p className="text-muted-foreground">
              No plants found in the {selectedCategory} category
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product: Product) => (
              <Card 
                key={`${product.name}-${product.category}`} 
                className={`${!product.inStock ? 'opacity-60' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    {product.imageUrl && (
                      <div className="flex-shrink-0">
                        <div 
                          className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
                          onClick={() => setSelectedImage(product.imageUrl)}
                        >
                          <ImageViewer
                            imageUrl={product.imageUrl}
                            alt={product.name}
                            className="h-full"
                            refreshKey={lastRefreshTime}
                          />
                        </div>
                      </div>
                    )}

                    {/* Product Info */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <p className="font-medium">${product.price.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => setSelectedImage(product.imageUrl)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button
                          variant={product.inStock ? "default" : "outline"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          disabled={!product.inStock}
                          className={product.inStock ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          {product.inStock ? "Add to Cart" : "Out of Stock"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Full Screen Image Viewer */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:bg-white/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
          <ImageViewer
            imageUrl={selectedImage}
            className="max-w-[90vw] max-h-[90vh]"
            enableZoom
            refreshKey={lastRefreshTime}
          />
        </div>
      )}
    </div>
  );
}