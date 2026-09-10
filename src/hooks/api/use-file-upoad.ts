import api from "@/services/axios";
import { AxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";
import { showErrorToast, showSuccessToast } from "@/utils/toastUtils";

type FileUploadOptions = {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  successToast?: string | ((data: any) => string);
  errorToast?: string | ((error: AxiosError) => string);
  method?: "get" | "post" | "put" | "delete";
  url?: string;
};

export const useFileUpload = ({
  errorToast,
  method = "post",
  onError,
  onSuccess,
  successToast,
  url = "/files/upload",
}: FileUploadOptions) => {
  return useMutation<
    any,
    AxiosError,
    {
      file?: File | File[] | null | undefined | any;
      files?: File | File[] | null | undefined;
      extraData?: Record<string, any>;
    }
  >({
    mutationFn: async ({ file, files, extraData }) => {
      const formData = new FormData();
      const filesToUpload = files || file;

      // Handle both single file and array of files
      if (Array.isArray(filesToUpload)) {
        filesToUpload.forEach((file) => {
          formData.append(`files`, file);
        });
      } else {
        formData.append("file", file);
      }

      if (extraData) {
        Object.entries(extraData).forEach(([key, value]) => {
          // Handle nested objects by stringifying them
          if (typeof value === "object" && !(value instanceof File)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value);
          }
        });
      }

      const response = await api[method](url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: (data: any) => {
      if (data?.isSuccess) {
        const message: any =
          typeof successToast === "function"
            ? successToast(data)
            : successToast;
        showSuccessToast(message);
      }
      onSuccess?.(data);
    },
    onError: (error: any) => {
      if (errorToast) {
        const message =
          typeof errorToast === "function" ? errorToast(error) : errorToast;
        showErrorToast(message);
      } else {
        showErrorToast(error.response?.data?.message || "File upload failed");
      }
      onError?.(error);
    },
  });
};
