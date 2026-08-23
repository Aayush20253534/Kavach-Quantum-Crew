import { QueryClient } from '@tanstack/react-query';

const shouldRetry = (failureCount, error) => {
  const status = error?.response?.status;

  if (status && status >= 400 && status < 500) {
    return false;
  }

  return failureCount < 1;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
