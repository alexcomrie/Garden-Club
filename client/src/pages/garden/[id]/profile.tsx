import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, ShoppingCart, MapPin, Phone, Mail, Clock } from "lucide-react";
import { useBusiness, useRefreshBusinesses } from "@/hooks/use-businesses";
import { useCart } from "@/providers/cart-provider";
import ImageViewer from "@/components/image-viewer";

interface GardenProfileProps {
  params: { id: string };
}

export default function GardenProfile({ params }: GardenProfileProps) {
  const [, setLocation] = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
  const [imageError, setImageError] = useState(false);

  const { data: business, isLoading, refetch } = useBusiness(params.id);
  const { itemCount } = useCart();

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

  const refreshBusinesses = useRefreshBusinesses();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setImageError(false);
    try {
      await refreshBusinesses();
      await refetch();
      setLastRefreshTime(Date.now());
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
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
              onClick={() => setLocation(`/garden/${business.id}/plants`)}
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
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Profile Image */}
        {business.profilePictureUrl && (
          <div className="relative aspect-[2/1] rounded-lg overflow-hidden bg-gray-100">
            <ImageViewer
              imageUrl={business.profilePictureUrl}
              alt={business.name}
              className="h-full"
              onError={() => setImageError(true)}
              refreshKey={lastRefreshTime}
              enableZoom={true}
            />
          </div>
        )}

        {/* Business Info */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Owner Info */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Owner</h2>
              <p>{business.ownerName}</p>
            </div>

            {/* Contact Info */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Contact Information</h2>
              <div className="space-y-2">
                {business.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <p>{business.address}</p>
                  </div>
                )}
                {business.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    <p>{business.phoneNumber}</p>
                  </div>
                )}
                {business.emailAddress && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    <p>{business.emailAddress}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Operating Hours */}
            {business.operationHours && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Operating Hours</h2>
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <p className="whitespace-pre-line">{business.operationHours}</p>
                </div>
              </div>
            )}

            {/* Delivery Information */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Delivery Information</h2>
              <div className="space-y-2">
                <Badge variant={business.hasDelivery ? "default" : "secondary"}>
                  {business.hasDelivery ? 'Delivery Available' : 'No Delivery Service'}
                </Badge>
                {business.hasDelivery && (
                  <div className="space-y-1">
                    {business.islandWideDeliveryCost !== null ? (
                      <p>Island-wide Delivery: ${business.islandWideDeliveryCost.toFixed(2)}</p>
                    ) : business.deliveryCost ? (
                      <>
                        <p>Delivery Cost: ${business.deliveryCost.toFixed(2)}</p>
                        {business.deliveryArea && (
                          <p className="text-sm text-muted-foreground">
                            Delivery Area: {business.deliveryArea}
                          </p>
                        )}
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}