import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { isPubliclyVisible } from "@/lib/listing";

// Public listings: approved, not expired, and with something still free.
export function usePublicListings() {
  const query = useQuery({ queryKey: ["listings", "public"], queryFn: () => api.listings.list() });
  const listings = useMemo(() => (query.data || []).filter((p) => isPubliclyVisible(p)), [query.data]);
  return { listings, loading: query.isLoading, error: query.error, retry: query.refetch };
}

export function useAllListings() {
  return useQuery({ queryKey: ["listings", "all"], queryFn: () => api.listings.list({ all: true }) });
}

export function useInvalidateListings() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["listings"] });
}
