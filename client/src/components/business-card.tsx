import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Business } from "@shared/schema";
import { useLocation } from "wouter";
import { Store } from "lucide-react";
import { BusinessService } from "@/services/business-service";

interface BusinessCardProps {
  business: Business;
}

export default function BusinessCard({ business }: BusinessCardProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    setLocation(`/garden/${business.id}/profile`);
  };

  return (
    <Card 
      className="overflow-hidden cursor-pointer transition-transform hover:scale-105"
      onClick={handleClick}
    >
      <div className="relative h-48 overflow-hidden">
        {business.profilePictureUrl ? (
          <img
            src={BusinessService.getDirectImageUrl(business.profilePictureUrl)}
            alt={business.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
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
            onClick={() => setLocation(`/garden/${business.id}/profile`)}
            className="flex-1"
          >
            View Profile
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => setLocation(`/garden/${business.id}/plants`)}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            View Products
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}