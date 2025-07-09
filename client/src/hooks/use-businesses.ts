import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BusinessService } from "@/services/business-service";
import { Business, Product } from "@shared/schema";

export function useBusinesses() {
  return useQuery<Business[]>({
    queryKey: ["businesses"],
    queryFn: () => BusinessService.loadBusinesses(),
  });
}

export function useBusiness(id: string) {
  const query = useQuery<Business>({
    queryKey: ["business", id],
    queryFn: () => BusinessService.loadBusinesses().then(businesses => businesses.find(b => b.id === id) || Promise.reject(new Error(`Business not found: ${id}`))),
    enabled: !!id,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useRefreshBusinesses() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["businesses"] }),
      queryClient.invalidateQueries({ queryKey: ["business-products"] })
    ]);
    // Clear the local storage cache
    Object.keys(localStorage).forEach(key => {
      if (key === 'businesses' || key.startsWith('products_')) {
        localStorage.removeItem(key);
      }
    });
  };
}

export function useBusinessProducts(id: string) {
  const business = useBusiness(id);
  
  const query = useQuery<Map<string, Product[]>>({
    queryKey: ["business-products", id],
    queryFn: () => BusinessService.loadProducts(business.data?.productSheetUrl || ''),
    enabled: !!id && !!business.data?.productSheetUrl,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
