import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export const OPS_SUMMARY_QUERY_KEY = ['ops-summary'];

export function useOpsSummary(options = {}) {
  return useQuery({
    queryKey: OPS_SUMMARY_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get('/reports/summary');
      return data;
    },
    staleTime: 45_000,
    refetchInterval: 90_000,
    ...options,
  });
}
