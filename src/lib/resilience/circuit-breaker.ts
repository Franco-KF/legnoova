export type CircuitState = "closed" | "open" | "half-open";

export interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeoutMs: number;
  halfOpenMaxCalls: number;
}

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failures = 0;
  private lastFailureTime = 0;
  private halfOpenCalls = 0;

  constructor(private readonly options: CircuitBreakerOptions) {}

  getState(): CircuitState {
    return this.state;
  }

  isAvailable(): boolean {
    if (this.state === "closed") return true;
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime >= this.options.recoveryTimeoutMs) {
        this.state = "half-open";
        this.halfOpenCalls = 0;
        return true;
      }
      return false;
    }
    return this.halfOpenCalls < this.options.halfOpenMaxCalls;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.isAvailable()) {
      throw new Error(`Circuit breaker is ${this.state}`);
    }

    if (this.state === "half-open") {
      this.halfOpenCalls++;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    if (this.state === "half-open") {
      this.state = "closed";
    }
    this.halfOpenCalls = 0;
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.state === "half-open" || this.failures >= this.options.failureThreshold) {
      this.state = "open";
    }
  }

  reset(): void {
    this.state = "closed";
    this.failures = 0;
    this.halfOpenCalls = 0;
    this.lastFailureTime = 0;
  }
}

export interface BreakerRegistry {
  get(name: string): CircuitBreaker;
}

const breakers = new Map<string, CircuitBreaker>();

export function getOrCreateBreaker(
  name: string,
  options: CircuitBreakerOptions,
): CircuitBreaker {
  let breaker = breakers.get(name);
  if (!breaker) {
    breaker = new CircuitBreaker(options);
    breakers.set(name, breaker);
  }
  return breaker;
}

export function getBreakerState(name: string): CircuitState | null {
  return breakers.has(name) ? breakers.get(name)!.getState() : null;
}
