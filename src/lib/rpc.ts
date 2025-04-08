import { hc } from "hono/client";
import { AppType } from "@/app/api/[[...route]]/route";

export const client = hc<AppType>(process.env.NEXT_PUBLIC_APP_URL!);

// RPC helper function for API calls
interface RPCOptions<T = any> {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  body?: T;
  query?: Record<string, string | number | boolean | undefined>;
  retries?: number; // Số lần thử lại
  retryDelay?: number; // Độ trễ giữa các lần thử lại (ms)
}

// Hàm sleep helper
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function rpc<Response = any, RequestBody = any>({
  method,
  path,
  body,
  query,
  retries = 2, // Mặc định thử lại 2 lần
  retryDelay = 1000, // Mặc định độ trễ 1 giây
}: RPCOptions<RequestBody>): Promise<Response> {
  const url = new URL(path, process.env.NEXT_PUBLIC_APP_URL);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Đảm bảo gửi cookie cho các yêu cầu xác thực
  };

  if (body && method !== "GET") {
    init.body = JSON.stringify(body);
  }

  let lastError: Error | null = null;
  let attempts = 0;

  // Thực hiện request với cơ chế retry
  while (attempts <= retries) {
    try {
      attempts++;
      const response = await fetch(url.toString(), init);

      if (!response.ok) {
        // Kiểm tra xem có phải lỗi từ server không (5xx)
        const isServerError = response.status >= 500 && response.status < 600;

        // Lấy thông tin lỗi từ response nếu có
        let errorInfo: any = {};
        try {
          errorInfo = await response.json();
        } catch (error) {
          // Nếu không lấy được JSON, sử dụng text
          errorInfo = {
            message: await response.text().catch(() => "Không thể đọc lỗi"),
          };
        }

        // Tạo lỗi với thông tin chi tiết
        const errorMessage =
          errorInfo.message || `Yêu cầu thất bại với mã lỗi ${response.status}`;
        const error = new Error(errorMessage);
        Object.assign(error, {
          status: response.status,
          info: errorInfo,
          url: url.toString(),
          method,
        });

        // Nếu là lỗi server và còn cơ hội retry
        if (isServerError && attempts <= retries) {
          console.warn(
            `Lỗi server (${response.status}) khi gọi ${method} ${path}. Thử lại lần ${attempts}/${retries}`
          );
          lastError = error;

          // Đợi trước khi thử lại
          await sleep(retryDelay * attempts); // Tăng thời gian chờ theo số lần thử
          continue;
        }

        // Nếu không retry được nữa hoặc không phải lỗi server
        throw error;
      }

      return response.json();
    } catch (error) {
      // Nếu đã hết số lần thử hoặc lỗi không phải từ response
      if (attempts > retries || !(error instanceof Error)) {
        const finalError =
          error instanceof Error ? error : new Error(String(error));
        console.error("RPC error:", finalError);
        throw finalError;
      }

      lastError = error instanceof Error ? error : new Error(String(error));

      // Đợi trước khi thử lại
      await sleep(retryDelay * attempts);
    }
  }

  // Nếu đã thử hết mà vẫn lỗi
  throw lastError || new Error(`RPC call failed after ${retries} retries`);
}
