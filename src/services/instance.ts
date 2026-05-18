import axios, { AxiosRequestConfig } from "axios";
import storageService from "@/services/storageService";
import { API_BASE_URL } from "@/constants/apiUrl";
// import { ApiResponse, AuthResponse } from "@app/interfaces/auth";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const axiosInstance = axios.create();

// ✅ Response interceptor
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => {
    if (response.status === 200 || response.status === 201) {
      return response.data;
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const errorMessage = error.response?.data?.errors;
    const serverMessage = error.response?.data?.message;
    const isOptionalAuth =
      originalRequest.headers?.["X-Optional-Auth"] === "true";

    // Tài khoản bị vô hiệu hoá → redirect login ngay lập tức
    if (status === 401 && serverMessage === "ACCOUNT_DISABLED") {
      storageService.remove("access_token");
      storageService.remove("refresh_token");
      if (typeof window !== "undefined") {
        window.location.href = "/login?reason=disabled";
      }
      return Promise.reject(error);
    }

    // Kiểm tra nếu là lỗi token hết hạn
    if (
      (status === 401 || status === 500) &&
      (errorMessage === "jwt expired" || status === 401) &&
      !originalRequest._retry
    ) {
      // Nếu là API optional auth và gặp 401, không cần refresh token
      if (isOptionalAuth && status === 401) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = storageService.get<string>("refresh_token");

        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const response = await axios.post<any>(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken },
          {
            headers: {
              "Content-Type": "application/json",
              "application-name": "bkt",
            },
          }
        );

        if (response.data.success) {
          const { accessToken, refreshToken: newRefreshToken } =
            response.data.data;
          storageService.set("access_token", accessToken);
          storageService.set("refresh_token", newRefreshToken);

          processQueue(null, accessToken);

          originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        } else {
          throw new Error("Refresh token failed");
        }
      } catch (refreshError) {
        processQueue(refreshError, null);

        storageService.remove("access_token");
        storageService.remove("refresh_token");

        // Chỉ redirect đến login nếu không phải là API optional auth
        if (typeof window !== "undefined" && !isOptionalAuth) {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

class HttpService {
  get<T>(config: AxiosRequestConfig) {
    return this.request({
      method: "get",
      ...config,
    }) as Promise<T>;
  }

  post<T>(config: AxiosRequestConfig) {
    return this.request({
      method: "post",
      ...config,
    }) as Promise<T>;
  }

  put<T>(config: AxiosRequestConfig) {
    return this.request({
      method: "put",
      ...config,
    }) as Promise<T>;
  }

  patch<T>(config: AxiosRequestConfig) {
    return this.request({
      method: "patch",
      ...config,
    }) as Promise<T>;
  }

  delete<T>(config: AxiosRequestConfig) {
    return this.request({
      method: "delete",
      ...config,
    }) as Promise<T>;
  }

  private request({ baseURL, headers, url, ...config }: AxiosRequestConfig) {
    const resolvedBase = (baseURL as string) || API_BASE_URL;
    const sanitizedBase = resolvedBase.endsWith("/")
      ? resolvedBase.slice(0, -1)
      : resolvedBase;
    const path = (url as string) || "";
    const sanitizedPath = path.startsWith("/") ? path : `/${path}`;

    const requestTimeout = config.timeout || 100000;

    return axiosInstance.request({
      baseURL: sanitizedBase,
      url: sanitizedPath,
      ...config,
      timeout: requestTimeout,
      headers: {
        "Content-Type": "application/json",
        "application-name": "bkt",
        Authorization: storageService.get("access_token")
          ? `Bearer ${storageService.get("access_token")}`
          : "",
        ...headers,
      },
    });
  }
}

export default new HttpService();
