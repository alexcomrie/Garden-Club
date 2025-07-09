import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Trash2, ShoppingCart } from "lucide-react";
import { useCart } from "@/providers/cart-provider";
import { useToast } from "@/hooks/use-toast";

export default function Cart() {
  const [, setLocation] = useLocation();
  const { 
    orders, 
    customerName, 
    deliveryOption, 
    deliveryAddress, 
    pickupTime, 
    selectedBusiness,
    removeFromCart, 
    updateCustomerInfo, 
    clearCart 
  } = useCart();
  
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    customerName: customerName,
    deliveryAddress: deliveryAddress,
    pickupTime: pickupTime,
  });

  const subtotal = orders.reduce(
    (sum, order) => sum + order.product.price * order.quantity,
    0
  );

  const getDeliveryCost = () => {
    if (!selectedBusiness) return 0;
    switch (deliveryOption) {
      case 'delivery':
        return selectedBusiness.deliveryCost || 0;
      case 'island_wide':
        return selectedBusiness.islandWideDeliveryCost || 0;
      default:
        return 0;
    }
  };

  const deliveryCost = getDeliveryCost();
  const total = subtotal + deliveryCost;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    updateCustomerInfo({ [field]: value } as any);
  };

  const handleDeliveryOptionChange = (value: string) => {
    updateCustomerInfo({ deliveryOption: value as any });
  };

  const buildOrderSummary = () => {
    let summary = '';
    
    for (const order of orders) {
      const itemTotal = order.product.price * order.quantity;
      summary += `${order.product.name} x ${order.quantity} @ $${order.product.price.toFixed(2)} = $${itemTotal.toFixed(2)}\n`;
    }

    summary += `\nTotal: $${total.toFixed(2)}`;
    
    if (deliveryOption === 'delivery' && selectedBusiness?.hasDelivery) {
      summary += `\nDelivery Area: ${selectedBusiness.deliveryArea}`;
      if (selectedBusiness.deliveryCost) {
        summary += `\nDelivery Cost: $${selectedBusiness.deliveryCost.toFixed(2)}`;
      }
    } else if (deliveryOption === 'island_wide' && selectedBusiness?.islandWideDelivery) {
      summary += `\nIsland Wide Delivery via ${selectedBusiness.islandWideDelivery}`;
      if (selectedBusiness.islandWideDeliveryCost) {
        summary += `\nDelivery Cost: $${selectedBusiness.islandWideDeliveryCost.toFixed(2)}`;
      }
    }

    return summary;
  };

  const handleSendOrder = async () => {
    if (!selectedBusiness || !customerName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (deliveryOption === 'delivery' && !deliveryAddress.trim()) {
      toast({
        title: "Missing Delivery Address",
        description: "Please enter a delivery address",
        variant: "destructive"
      });
      return;
    }

    if (deliveryOption === 'pickup' && !pickupTime.trim()) {
      toast({
        title: "Missing Pickup Time",
        description: "Please enter a preferred pickup time",
        variant: "destructive"
      });
      return;
    }

    const orderSummary = buildOrderSummary();
    const deliveryMethod = deliveryOption === 'island_wide' ? 'Island Wide Delivery' : 
                          deliveryOption === 'delivery' ? 'Delivery' : 'Pickup';
    
    // Use the WhatsApp number directly from the business profile
    const phoneNumber = selectedBusiness.whatsAppNumber;
    const addressInfo = deliveryOption === 'delivery' || deliveryOption === 'island_wide' 
      ? `Delivery Address: ${deliveryAddress}` 
      : `Pickup Time: ${pickupTime}`;
    
    const message = `Hello ${selectedBusiness.name}, I would like to place an order for:\n${orderSummary}\nName: ${customerName}\nDelivery Method: ${deliveryMethod}\n${addressInfo}`;
    
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    try {
      window.open(url, '_blank');
      clearCart();
      toast({
        title: "Order Sent!",
        description: "Your order has been sent via WhatsApp",
      });
      setLocation('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not open WhatsApp",
        variant: "destructive"
      });
    }
  };

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Shopping Cart</h1>
          </div>
          
          <div className="flex flex-col items-center justify-center py-16">
            <ShoppingCart className="h-24 w-24 text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground text-center mb-4">
              Add some plants to your cart to get started
            </p>
            <Button onClick={() => setLocation('/')}>
              Start Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Shopping Cart</h1>
        </div>

        {/* Order Items */}
        <div className="space-y-4 mb-6">
          {orders.map((order, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium">{order.product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {order.product.description}
                    </p>
                    <p className="text-sm font-medium">
                      ${order.product.price.toFixed(2)} x {order.quantity}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromCart(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Customer Information Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customerName">Your Name *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            {selectedBusiness?.hasDelivery && (
              <div>
                <Label>Delivery Option</Label>
                <RadioGroup
                  value={deliveryOption}
                  onValueChange={handleDeliveryOptionChange}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup">Pickup</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery">Delivery</Label>
                  </div>
                  {selectedBusiness?.islandWideDelivery && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="island_wide" id="island_wide" />
                      <Label htmlFor="island_wide">Island Wide Delivery</Label>
                    </div>
                  )}
                </RadioGroup>
              </div>
            )}

            {(deliveryOption === 'delivery' || deliveryOption === 'island_wide') ? (
              <div>
                <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                <Input
                  id="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                  placeholder="Enter delivery address"
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="pickupTime">Preferred Pickup Time *</Label>
                <Input
                  id="pickupTime"
                  value={formData.pickupTime}
                  onChange={(e) => handleInputChange('pickupTime', e.target.value)}
                  placeholder="e.g., 2:00 PM today"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {deliveryCost > 0 && (
                <div className="flex justify-between">
                  <span>Delivery Cost</span>
                  <span>${deliveryCost.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Send Order Button */}
        <Button 
          onClick={handleSendOrder}
          className="w-full"
          size="lg"
        >
          Send Order via WhatsApp
        </Button>
      </div>
    </div>
  );
}