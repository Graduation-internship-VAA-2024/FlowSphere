import { hc } from "hono/client";
import { AppType } from "@/app/api/[[...route]]/route";

export const client = hc<AppType>(process.env.NEXT_PUBLIC_APP_URL!);

// RPC helper function for API calls
interface RPCOptions<T = any> {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: T;
  query?: Record<string, string | number | boolean | undefined>;
}

export async function rpc<Response = any, RequestBody = any>({ 
  method, 
  path, 
  body, 
  query 
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
      'Content-Type': 'application/json',
    },
  };
  
  if (body && method !== 'GET') {
    init.body = JSON.stringify(body);
  }
  
  const response = await fetch(url.toString(), init);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Request failed with status ${response.status}`);
  }
  
  return response.json();
}
