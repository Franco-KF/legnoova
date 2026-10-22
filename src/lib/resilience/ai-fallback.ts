import { getOrCreateBreaker } from "@/lib/resilience/circuit-breaker";
import { withRetry } from "@/lib/resilience/retry";

export interface AIModelConfig {
  name: string;
  model: string;
  priority: number;
  enabled: boolean;
}

export interface AIServiceStatus {
  primary: string;
  fallback: string | null;
  circuitState: string;
  lastFailure: number | null;
}

const MODELS: AIModelConfig[] = [
  { name: "gemini-3.8-flash", model: "gemini-3.8-flash", priority: 1, enabled: true },
  { name: "gemini-2.5-flash", model: "gemini-2.5-flash", priority: 2, enabled: true },
  { name: "gemini-2.0-flash", model: "gemini-2.0-flash", priority: 3, enabled: true },
];

export class AIResilience {
  private breakers = new Map<string, ReturnType<typeof getOrCreateBreaker>>();
  private lastFailure: number | null = null;
  private currentPrimary: string | null = null;

  getBreaker(model: string) {
    if (!this.breakers.has(model)) {
      this.breakers.set(model, getOrCreateBreaker(`ai-${model}`, {
        failureThreshold: 3,
        recoveryTimeoutMs: 60_000,
        halfOpenMaxCalls: 2,
      }));
    }
    return this.breakers.get(model)!;
  }

  getStatus(): AIServiceStatus {
    const enabled = MODELS.filter(m => m.enabled).sort((a, b) => a.priority - b.priority);
    return {
      primary: this.currentPrimary ?? enabled[0]?.name ?? "none",
      fallback: enabled[1]?.name ?? null,
      circuitState: this.currentPrimary ? this.getBreaker(this.currentPrimary).getState() : "closed",
      lastFailure: this.lastFailure,
    };
  }

  async executeWithFallback<T>(
    fn: (model: string) => Promise<T>,
    options?: { preferredModel?: string }
  ): Promise<{ result: T; model: string }> {
    const candidates = [...MODELS].sort((a, b) => a.priority - b.priority);
    const preferred = options?.preferredModel;
    if (preferred) {
      candidates.sort((a, b) => (a.name === preferred ? -1 : b.name === preferred ? 1 : 0));
    }

    let lastError: unknown;
    for (const model of candidates) {
      if (!model.enabled) continue;
      const breaker = this.getBreaker(model.name);
      if (!breaker.getState()) {
        // breaker not available (open)
        continue;
      }
      try {
        const result = await breaker.execute(() => withRetry(() => fn(model.model), {
          maxAttempts: 2,
          baseDelayMs: 500,
          maxDelayMs: 5000,
        }));
        this.currentPrimary = model.name;
        this.lastFailure = null;
        return { result, model: model.name };
      } catch (error) {
        lastError = error;
        this.lastFailure = Date.now();
        continue;
      }
    }

    throw lastError ?? new Error("All AI models unavailable");
  }
}

export const aiResilience = new AIResilience();
