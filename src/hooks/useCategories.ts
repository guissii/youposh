import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '@/lib/api';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    // Very long cache (24 hours) since categories define the store structure and rarely change
    staleTime: 24 * 60 * 60 * 1000, 
    gcTime: 48 * 60 * 60 * 1000,
  });
}
