import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { getHttpClient } from '@/core/config';
import { HttpResponse } from '@/data/api';

/**
 * Hook para fazer requisições GET com React Query
 */
export function useApiQuery<TData>(
  key: string[],
  url: string,
  options?: Omit<UseQueryOptions<HttpResponse<TData>, Error>, 'queryKey' | 'queryFn'>
) {
  const httpClient = getHttpClient();

  return useQuery({
    queryKey: key,
    queryFn: () => httpClient.get<TData>(url),
    ...options,
  });
}

/**
 * Hook para fazer mutations (POST, PUT, PATCH, DELETE)
 */
export function useApiMutation<TData, TVariables>(
  method: 'post' | 'put' | 'patch' | 'delete',
  url: string | ((variables: TVariables) => string),
  options?: UseMutationOptions<HttpResponse<TData>, Error, TVariables>
) {
  const httpClient = getHttpClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const isUrlFn = typeof url === 'function';
      const endpoint = isUrlFn ? url(variables) : url;

      if (!endpoint) {
        throw new Error('No API endpoint — household may not be loaded yet');
      }

      // When url is a function, variables were used to build the URL.
      // Only send them as body if they're an object (not a primitive like string).
      const body = isUrlFn && typeof variables !== 'object' ? undefined : variables;

      switch (method) {
        case 'post':
          return httpClient.post<TData, typeof body>(endpoint, body);
        case 'put':
          return httpClient.put<TData, typeof body>(endpoint, body);
        case 'patch':
          return httpClient.patch<TData, typeof body>(endpoint, body);
        case 'delete':
          return httpClient.delete<TData>(endpoint);
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    },
    ...options,
  });
}
