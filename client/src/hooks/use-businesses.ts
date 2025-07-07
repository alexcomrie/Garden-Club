import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Business, Product } from '@shared/schema';
import { BusinessService } from '../services/business-service';

export function useBusinesses() {
  return useQuery({
    queryKey: ['businesses'],
    queryFn: BusinessService.loadBusinesses,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useRefreshBusinesses() {
  const queryClient = useQueryClient();
  
  return async () => {
    await queryClient.refetchQueries({
      queryKey: ['businesses'],
      exact: false,
    });
  };
}

export function useBusiness(id: string) {
  const { data: businesses } = useBusinesses();
  return businesses?.find(business => business.id === id);
}

export function useBusinessProducts(businessId: string) {
  const business = useBusiness(businessId);
  
  return useQuery({
    queryKey: ['products', businessId],
    queryFn: () => business ? BusinessService.loadProducts(business.productSheetUrl) : Promise.resolve(new Map()),
    enabled: !!business,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}