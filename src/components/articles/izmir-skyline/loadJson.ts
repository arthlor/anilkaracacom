const requests = new Map<string, Promise<unknown>>();

/**
 * Fetches JSON with a few retries, so a flaky mobile connection doesn't leave
 * a chart empty. Callers asking for the same file share one request; a failed
 * request is forgotten so the next attempt starts fresh.
 */
export function loadJson<T>(url: string, retries = 2): Promise<T> {
  const pending = requests.get(url);
  if (pending) return pending as Promise<T>;

  const attempt = async (left: number): Promise<T> => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${url} returned ${response.status}`);
      return (await response.json()) as T;
    } catch (error) {
      if (left <= 0) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, 600 * (retries - left + 1)),
      );
      return attempt(left - 1);
    }
  };

  const request = attempt(retries).catch((error: unknown) => {
    requests.delete(url);
    throw error;
  });
  requests.set(url, request);
  return request;
}
