import { createClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function getHeaders(isFormData = false) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiFetch(path: string, options: RequestInit = {}, isFormData = false) {
  const headers = await getHeaders(isFormData);
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  
  const mergedHeaders = {
    ...headers,
    ...(options.headers as Record<string, string>),
  };
  
  return fetch(url, {
    ...options,
    headers: mergedHeaders,
  });
}

export async function apiPost(path: string, body: any, options: RequestInit = {}) {
  const isFormData = body instanceof FormData;
  return apiFetch(path, {
    ...options,
    method: "POST",
    body: isFormData ? body : JSON.stringify(body),
  }, isFormData);
}

export async function apiDelete(path: string, options: RequestInit = {}) {
  return apiFetch(path, {
    ...options,
    method: "DELETE",
  });
}
