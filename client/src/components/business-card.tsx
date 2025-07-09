import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Business } from "@shared/schema";
import { useLocation } from "wouter";
import { Store, RefreshCw } from "lucide-react";
import { useCart } from "@/providers/cart-provider";
import ImageViewer from "./image-viewer";

interface BusinessCardProps {
  business: Business;
  onRefresh?: () => void;
  lastRefreshTime?: number;
  isRefreshing?: boolean;
}

export default function BusinessCard({ business, onRefresh, lastRefreshTime = Date.now(), isRefreshing = false }: BusinessCardProps) {
  const [, setLocation] = useLocation();
  const [imageError, setImageError] = useState(false);
  const { selectedBusiness, clearCart } = useCart();

  const handleClick = () => {
    // Clear cart if switching to a different business
    if (selectedBusiness && selectedBusiness.id !== business.id) {
      clearCart();
    }
    setLocation(`/garden/${business.id}/plants`);
  };

  return (
    <Card 
      className="overflow-hidden cursor-pointer transition-transform hover:scale-105"
      onClick={handleClick}
    >
      <div className="relative h-48 overflow-hidden">
        {business.profilePictureUrl && !imageError ? (
          <div className="relative w-full h-full">
            <ImageViewer
              imageUrl={business.profilePictureUrl}
              alt={business.name}
              className="h-full"
              onError={() => setImageError(true)}
              refreshKey={lastRefreshTime}
              enableZoom={true}
            />
            {onRefresh && (
              <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageError(false);
                    onRefresh();
                  }}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <Store className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <h3 className="text-lg font-semibold">{business.name}</h3>
        <p className="text-sm text-gray-600">Owner: {business.ownerName}</p>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 line-clamp-2">{business.bio}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {business.hasDelivery && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Delivery Available
            </span>
          )}
          {business.status === 'active' && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Open Now
            </span>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              if (selectedBusiness && selectedBusiness.id !== business.id) {
                clearCart();
              }
              setLocation(`/garden/${business.id}/profile`);
            }}
            className="flex-1"
          >
            View Profile
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleClick}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            View Products
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}