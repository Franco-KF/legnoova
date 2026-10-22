import { getOrCreateBreaker } from "@/lib/resilience/circuit-breaker";
import { withRetry } from "@/lib/resilience/retry";

export interface MT5ApiClientOptions {
  baseUrl: string;
  deviceToken: string;
  circuitName?: string;
}

export class MT5ApiClient {
  private readonly baseUrl: string;
  private readonly headers: HeadersInit;
  private readonly breaker: ReturnType<typeof getOrCreateBreaker>;

  constructor(options: MT5ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.headers = {
      Authorization: `Bearer ${options.deviceToken}`,
      "Content-Type": "application/json",
    };
    this.breaker = getOrCreateBreaker(options.circuitName ?? "mt5-api", {
      failureThreshold: 5,
      recoveryTimeoutMs: 30_000,
      halfOpenMaxCalls: 3,
    });
  }

  getState() {
    return this.breaker.getState();
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const execute = async (): Promise<T> => {
      const response = await fetch(url, {
        ...init,
        headers: { ...this.headers, ...(init.headers || {}) },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const err = new Error(`HTTP ${response.status}`);
        (err as { status?: number }).status = response.status;
        throw err;
      }
      return (await response.json()) as T;
    };

    return this.breaker.execute(() => withRetry(execute));
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET", cache: "no-store" });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }
}
