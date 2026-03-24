/**
 * API error handling utilities
 */

export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "APIError";
  }
}

/**
 * Handle API responses with proper error handling
 */
export async function handleAPIResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  const isJSON = contentType?.includes("application/json");

  try {
    if (!response.ok) {
      let errorData;
      if (isJSON) {
        errorData = await response.json();
      }
      throw new APIError(
        response.status,
        errorData?.error || errorData?.message || `HTTP ${response.status}`,
        errorData
      );
    }

    if (isJSON) {
      return (await response.json()) as T;
    }

    return response as unknown as T;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      response.status,
      "Failed to parse response",
      error
    );
  }
}

/**
 * Fetch with error handling
 */
export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    return handleAPIResponse<T>(response);
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      0,
      error instanceof Error ? error.message : "Network error",
      error
    );
  }
}

/**
 * Retry logic for failed requests
 */
export async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }

  throw lastError;
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}
