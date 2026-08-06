/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  type QueryKey,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";

import type { AxiosError } from "axios";

import api from "@/services/axios";
import {
  getApiErrors,
  showErrorToast,
  showSuccessToast,
  type ApiErrorMessage,
} from "@/utils/toastUtils";

export interface MutationResponse {
  [key: string]: any;

  status: number;

  data: {
    remark: string;
    [key: string]: any;
  };
}

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

type ContentType =
  | "application/x-www-form-urlencoded"
  | "application/json"
  | "multipart/form-data";

type SuccessMessage<TData> =
  | string
  | ((data: TData) => string | null | undefined);

interface CustomMutationOptions<
  TData,
  TError,
  TVariables,
  TContext,
> extends Omit<
  UseMutationOptions<TData, TError, TVariables, TContext>,
  "mutationFn"
> {
  endpoint: string;

  method?: HttpMethod;

  successMessage?: SuccessMessage<TData>;

  errorMessage?: (error: TError) => ApiErrorMessage | void;

  onSuccessCallback?: (data: TData) => void | Promise<void>;

  contentType?: ContentType;

  useQueryParams?: boolean;

  queryParamsKey?: string;

  bodyKey?: string;

  /**
   * Kept for compatibility with the old implementation.
   * Normal React Query options can also be passed directly.
   */
  mutationOptions?: Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    "mutationFn" | "onSuccess" | "onError"
  >;
}

interface UseDataOptions<
  TQueryFnData = unknown,
  TError = AxiosError,
  TData = TQueryFnData,
> extends Omit<
  UseQueryOptions<TQueryFnData, TError, TData, QueryKey>,
  "queryKey" | "queryFn"
> {
  url: string;
  queryKey: QueryKey;
}

interface InfinitePageMetadata {
  last?: boolean;
  number?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export interface InfinitePageResponse {
  data?: InfinitePageMetadata;
  [key: string]: unknown;
}

interface UseInfiniteGetDataOptions {
  url: string;
  queryKey: QueryKey;
  enabled?: boolean;
  pageSize?: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const addQueryParams = (
  endpoint: string,
  params: Record<string, unknown>,
): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null) {
          searchParams.append(key, String(item));
        }
      });

      return;
    }

    searchParams.append(key, String(value));
  });

  const queryString = searchParams.toString();

  if (!queryString) {
    return endpoint;
  }

  const separator = endpoint.includes("?") ? "&" : "?";

  return `${endpoint}${separator}${queryString}`;
};

const isEmptyErrorMessage = (message: ApiErrorMessage): boolean => {
  if (typeof message === "string") {
    return message.trim() === "";
  }

  if (Array.isArray(message)) {
    return message.length === 0;
  }

  return Object.keys(message).length === 0;
};

export const useCustomMutation = <
  TData = MutationResponse,
  TError = AxiosError,
  TVariables = unknown,
  TContext = unknown,
>(
  options: CustomMutationOptions<TData, TError, TVariables, TContext>,
): UseMutationResult<TData, TError, TVariables, TContext> => {
  const {
    endpoint,
    method = "post",
    successMessage,
    errorMessage,
    onSuccessCallback,
    contentType = "application/json",
    useQueryParams = false,
    queryParamsKey = "params",
    bodyKey = "body",
    mutationOptions: nestedMutationOptions,
    onSuccess: userOnSuccess,
    onError: userOnError,
    ...baseMutationOptions
  } = options;

  return useMutation<TData, TError, TVariables, TContext>({
    ...nestedMutationOptions,
    ...baseMutationOptions,

    mutationFn: async (variables: TVariables): Promise<TData> => {
      let finalEndpoint = endpoint;
      let requestData: unknown = variables;

      if (useQueryParams && isRecord(variables)) {
        const queryParams = variables[queryParamsKey];

        if (isRecord(queryParams)) {
          finalEndpoint = addQueryParams(endpoint, queryParams);
        }

        requestData = Object.prototype.hasOwnProperty.call(variables, bodyKey)
          ? variables[bodyKey]
          : undefined;
      }

      const response = await api.request<TData>({
        url: finalEndpoint,
        method,
        headers: {
          "Content-Type": contentType,
        },

        // GET requests should not send a body.
        ...(method !== "get"
          ? {
              data: requestData,
            }
          : {}),
      });

      return response.data;
    },

    onSuccess: async (...args) => {
      const [data] = args;

      const resolvedSuccessMessage =
        typeof successMessage === "function"
          ? successMessage(data)
          : successMessage;

      if (resolvedSuccessMessage && resolvedSuccessMessage.trim() !== "") {
        showSuccessToast(resolvedSuccessMessage);
      }

      await onSuccessCallback?.(data);
      await userOnSuccess?.(...args);
    },

    onError: async (...args) => {
      const [error] = args;

      let message: ApiErrorMessage;

      try {
        message = errorMessage?.(error) ?? getApiErrors(error);
      } catch (messageError) {
        console.error("Failed to process custom API error:", messageError);

        message = getApiErrors(error);
      }

      if (isEmptyErrorMessage(message)) {
        message = "An unexpected error occurred";
      }

      showErrorToast(message);

      await userOnError?.(...args);
    },
  });
};

export const useGetData = <
  TQueryFnData = unknown,
  TError = AxiosError,
  TData = TQueryFnData,
>({
  url,
  queryKey,
  ...options
}: UseDataOptions<TQueryFnData, TError, TData>): UseQueryResult<
  TData,
  TError
> => {
  return useQuery<TQueryFnData, TError, TData, QueryKey>({
    queryKey,

    queryFn: async (): Promise<TQueryFnData> => {
      const response = await api.get<TQueryFnData>(url);

      return response.data;
    },

    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0,

    ...options,
  });
};

export const useInfiniteGetData = <
  TPageData extends InfinitePageResponse = InfinitePageResponse,
>({
  url,
  queryKey,
  enabled = true,
  pageSize = 20,
}: UseInfiniteGetDataOptions) => {
  return useInfiniteQuery<TPageData, AxiosError>({
    queryKey,

    queryFn: async ({ pageParam }): Promise<TPageData> => {
      const page = typeof pageParam === "number" ? pageParam : 0;

      const separator = url.includes("?") ? "&" : "?";

      const fullUrl = `${url}${separator}` + `page=${page}&size=${pageSize}`;

      const response = await api.get<TPageData>(fullUrl);

      return response.data;
    },

    initialPageParam: 0,

    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      const pagination = lastPage.data;

      if (!pagination) {
        return undefined;
      }

      if (pagination.last === true) {
        return undefined;
      }

      const currentPage =
        typeof pagination.number === "number"
          ? pagination.number
          : typeof lastPageParam === "number"
            ? lastPageParam
            : 0;

      if (
        typeof pagination.totalPages === "number" &&
        currentPage + 1 >= pagination.totalPages
      ) {
        return undefined;
      }

      return currentPage + 1;
    },

    enabled,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    retry: false,
  });
};
