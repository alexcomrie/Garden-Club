import { useBusiness } from "@/hooks/use-businesses";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Store, Phone, Mail, MapPin, Clock, Truck, ArrowLeft, Leaf } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function GardenProfile() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { data: business, isLoading, error } = useBusiness(id);

  const handleCall = () => {
    if (business?.phoneNumber) {
      window.location.href = `tel:${business.phoneNumber}`;
    }
  };

  const handleEmail = () => {
    if (business?.email) {
      window.location.href = `mailto:${business.email}`;
    }
  };

  const handleViewMap = () => {
    if (business?.mapUrl) {
      window.open(business.mapUrl, '_blank');
    }
  };

  const handleViewProducts = () => {
    setLocation(`/garden/${id}/plants`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral p-4">
        <Skeleton className="h-64 w-full rounded-lg" />
        <div className="mt-4 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-neutral p-4 text-center">
        <Store className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Failed to load garden</h3>
        <p className="text-gray-600 mb-4">
          {error instanceof Error ? error.message : 'Please check your connection and try again'}
        </p>
        <Button onClick={() => setLocation('/garden-list')}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral">
      {/* Header with Profile Picture */}
      <div className="relative h-64">
        {business.profilePictureUrl ? (
          <img
            src={business.profilePictureUrl}
            alt={business.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <Store className="w-20 h-20 text-gray-400" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-black/20 text-white hover:bg-black/30"
          onClick={() => setLocation('/garden-list')}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 -mt-8">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold mb-2">{business.name}</h1>
            <p className="text-gray-600 mb-6">{business.description}</p>

            {/* Contact Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {business.phoneNumber && (
                <Button onClick={handleCall} className="w-full">
                  <Phone className="mr-2 h-4 w-4" />
                  Call
                </Button>
              )}
              {business.email && (
                <Button onClick={handleEmail} className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </Button>
              )}
            </div>

            {/* Business Details */}
            <div className="space-y-4">
              {business.address && (
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                  <div>
                    <h3 className="font-semibold">Address</h3>
                    <p className="text-gray-600">{business.address}</p>
                    {business.mapUrl && (
                      <Button
                        variant="link"
                        className="px-0 text-primary"
                        onClick={handleViewMap}
                      >
                        View on Map
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {business.businessHours && (
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-gray-500 mt-1" />
                  <div>
                    <h3 className="font-semibold">Business Hours</h3>
                    <p className="text-gray-600 whitespace-pre-line">{business.businessHours}</p>
                  </div>
                </div>
              )}

              {(business.isDeliveryAvailable || business.isIslandWideDeliveryAvailable) && (
                <div className="flex items-start space-x-3">
                  <Truck className="w-5 h-5 text-gray-500 mt-1" />
                  <div>
                    <h3 className="font-semibold">Delivery Options</h3>
                    <ul className="text-gray-600 list-disc list-inside">
                      {business.isDeliveryAvailable && <li>Local Delivery Available</li>}
                      {business.isIslandWideDeliveryAvailable && <li>Island-wide Delivery Available</li>}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* View Products Button */}
            <Button
              className="w-full mt-8"
              size="lg"
              onClick={handleViewProducts}
            >
              <Leaf className="mr-2 h-5 w-5" />
              View Plants
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}