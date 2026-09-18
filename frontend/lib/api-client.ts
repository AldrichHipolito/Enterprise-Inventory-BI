// lib/api-client.ts
//
// Generic fetch wrapper — every future module's lib/api/*.ts file builds on
// top of this. Nothing endpoint-specific lives here, just the plumbing.

const API_BASE_URL = "http://localhost:4000"; // matches backend's PORT in .env

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiClient<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(response.status, data?.message ?? "Something went wrong");
  }

  return data as T;
}
