export function getAuthToken(): string | null {
  return localStorage.getItem('jcc_token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('jcc_token', token);
  } else {
    localStorage.removeItem('jcc_token');
  }
}

export function clearAuth(): void {
  localStorage.removeItem('jcc_token');
  localStorage.removeItem('jcc_user');
}

export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const headers = new Headers(options?.headers);
  if (!headers.has('Content-Type') && !(options?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      if (typeof errJson.detail === 'string') {
        errorDetail = errJson.detail;
      } else if (Array.isArray(errJson.detail)) {
        errorDetail = errJson.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
      } else if (errJson.detail) {
        errorDetail = JSON.stringify(errJson.detail);
      } else if (errJson.message) {
        errorDetail = errJson.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
