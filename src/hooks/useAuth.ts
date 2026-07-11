import { trpc } from "@/providers/trpc";
import { useCallback, useMemo } from "react";

export function useAuth() {
  const utils = trpc.useUtils();

  const {
    data: authData,
    isLoading,
    error,
    refetch,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      window.location.href = "/login";
    },
  });

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  return useMemo(
    () => ({
      user: authData ?? null,
      isAuthenticated: !!authData,
      isLoading: isLoading || logoutMutation.isPending,
      error,
      logout,
      refresh: refetch,
    }),
    [authData, isLoading, logoutMutation.isPending, error, logout, refetch],
  );
}

export function useRequireAuth(redirectPath = "/login") {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (!isLoading && !isAuthenticated && typeof window !== "undefined") {
    const currentPath = window.location.pathname;
    if (currentPath !== redirectPath) {
      window.location.href = redirectPath;
    }
  }

  return { user, isLoading, isAuthenticated };
}
