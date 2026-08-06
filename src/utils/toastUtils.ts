/* eslint-disable @typescript-eslint/no-explicit-any */

import { useAppStore } from "@/lib/core";

export type ToastType = "success" | "error" | "info" | "warning";

export type ApiErrorMessage =
  | string
  | string[]
  | Record<string, string | string[]>;

const DEFAULT_ERROR_MESSAGE = "An unexpected error occurred";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const convertToApiErrorMessage = (value: unknown): ApiErrorMessage => {
  if (typeof value === "string") {
    return value.trim() ? value : DEFAULT_ERROR_MESSAGE;
  }

  if (Array.isArray(value)) {
    const messages = value.filter(
      (item): item is string => typeof item === "string" && item.trim() !== "",
    );

    return messages.length > 0 ? messages : DEFAULT_ERROR_MESSAGE;
  }

  if (isObject(value)) {
    const normalizedErrors: Record<string, string | string[]> = {};

    Object.entries(value).forEach(([field, fieldValue]) => {
      if (typeof fieldValue === "string" && fieldValue.trim() !== "") {
        normalizedErrors[field] = fieldValue;
        return;
      }

      if (Array.isArray(fieldValue)) {
        const messages = fieldValue.filter(
          (item): item is string =>
            typeof item === "string" && item.trim() !== "",
        );

        if (messages.length > 0) {
          normalizedErrors[field] = messages;
        }
      }
    });

    if (Object.keys(normalizedErrors).length > 0) {
      return normalizedErrors;
    }
  }

  return DEFAULT_ERROR_MESSAGE;
};

export const normalizeToastMessage = (message: ApiErrorMessage): string => {
  if (typeof message === "string") {
    return message.trim() || DEFAULT_ERROR_MESSAGE;
  }

  if (Array.isArray(message)) {
    return (
      message
        .filter((item) => typeof item === "string" && item.trim() !== "")
        .join(", ") || DEFAULT_ERROR_MESSAGE
    );
  }

  const normalizedMessage = Object.entries(message)
    .flatMap(([field, errors]) => {
      if (Array.isArray(errors)) {
        return errors
          .filter((error) => typeof error === "string" && error.trim() !== "")
          .map((error) => `${field}: ${error}`);
      }

      if (typeof errors === "string" && errors.trim() !== "") {
        return [`${field}: ${errors}`];
      }

      return [];
    })
    .join(", ");

  return normalizedMessage || DEFAULT_ERROR_MESSAGE;
};

export const showSuccessToast = (message: string): void => {
  useAppStore.getState().toast(message, "ok");
};

export const showErrorToast = (message: ApiErrorMessage): void => {
  useAppStore.getState().toast(normalizeToastMessage(message), "err");
};

export const showToast = (
  message: ApiErrorMessage,
  type: ToastType = "info",
  actionLabel?: string,
  onActionClick?: () => void,
): void => {
  const tone = type === "success" ? "ok" : type === "error" ? "err" : "";

  useAppStore
    .getState()
    .toast(normalizeToastMessage(message), tone, actionLabel, onActionClick);
};

export const showInfoToast = (message: ApiErrorMessage): void => {
  showToast(message, "info");
};

export const showWarningToast = (message: ApiErrorMessage): void => {
  showToast(message, "warning");
};

export const getApiErrors = (error: any): ApiErrorMessage => {
  const responseData = error?.response?.data;

  const errorValue =
    responseData?.data?.message ??
    responseData?.errors ??
    responseData?.error_description ??
    responseData?.message ??
    responseData?.error ??
    error?.message;

  return convertToApiErrorMessage(errorValue);
};
