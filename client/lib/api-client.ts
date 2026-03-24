import {
  clearAuthSession,
  getStoredAuthUser,
  getValidAuthToken,
} from "@/lib/auth-client";

export async function getIdToken() {
  const token = await getValidAuthToken();
  if (!token) {
    throw new Error("User is not authenticated");
  }
  return token;
}

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
) {
  const user = getStoredAuthUser();
  const createHeaders = (token: string) => {
    const headers = new Headers(init.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    if (user?.id) {
      headers.set("x-user-id", user.id);
    }
    headers.set("Content-Type", "application/json");
    return headers;
  };

  let token = await getIdToken();
  let response = await fetch(input, {
    ...init,
    headers: createHeaders(token),
  });

  if (response.status === 401) {
    const refreshedToken = await getValidAuthToken(true);
    if (refreshedToken && refreshedToken !== token) {
      token = refreshedToken;
      response = await fetch(input, {
        ...init,
        headers: createHeaders(token),
      });
    }
  }

  if (response.status === 401) {
    clearAuthSession();
  }

  return response;
}

export async function readJson<T = any>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}
