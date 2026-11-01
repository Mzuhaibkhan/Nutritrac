const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function getHeaders(isFormData = false) {
  let token: string | null = null;

  if (typeof window !== "undefined") {
    const clerk = (window as any).Clerk;
    if (clerk) {
      if (clerk.session) {
        token = await clerk.session.getToken();
      } else if (clerk.loaded === false) {
        // Wait briefly for Clerk to initialize if called during early hydration
        await new Promise<void>((resolve) => {
          if (clerk.loaded) return resolve();
          const interval = setInterval(() => {
            if (clerk.loaded) {
              clearInterval(interval);
              resolve();
            }
          }, 50);
          setTimeout(() => {
            clearInterval(interval);
            resolve();
          }, 2000);
        });
        token = (await clerk.session?.getToken()) ?? null;
      }
    }
  }

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
  return apiFetch(
    path,
    {
      ...options,
      method: "POST",
      body: isFormData ? body : JSON.stringify(body),
    },
    isFormData
  );
}

export async function apiDelete(path: string, options: RequestInit = {}) {
  return apiFetch(path, {
    ...options,
    method: "DELETE",
  });
}
