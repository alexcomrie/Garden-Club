import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/providers/cart-provider";
import { refreshService } from "@/services/refresh-service";
import { useEffect } from "react";
import GardenList from "@/pages/garden-list";
import GardenProfile from "@/pages/garden-profile";
import GardenPlants from "@/pages/garden-plants";
import PlantDetails from "@/pages/plant-details";
import Cart from "@/pages/cart";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={GardenList} />
      <Route path="/garden/:id/profile" component={GardenProfile} />
      <Route path="/garden/:id/plants" component={GardenPlants} />
      <Route path="/garden/:id/plant/:plantName" component={PlantDetails} />
      <Route path="/cart" component={Cart} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Cleanup refresh service when the app unmounts
    return () => refreshService.cleanup();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-neutral">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}

export default App;
