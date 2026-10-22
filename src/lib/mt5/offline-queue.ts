import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface QueuedItem {
  id: string;
  type: "signal" | "event" | "diagnostic";
  payload: unknown;
  path: string;
  createdAt: number;
  attempts: number;
}

export class OfflineQueue {
  private readonly dir: string;

  constructor(subDir: string = "legnoova/mt5-offline-queue") {
    this.dir = path.join(os.homedir(), subDir);
    fs.mkdirSync(this.dir, { recursive: true });
  }

  enqueue(type: QueuedItem["type"], payload: unknown): string {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const item: QueuedItem = {
      id,
      type,
      payload,
      path: "",
      createdAt: Date.now(),
      attempts: 0,
    };
    const filePath = path.join(this.dir, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(item, null, 2));
    item.path = filePath;
    return id;
  }

  list(): QueuedItem[] {
    const items: QueuedItem[] = [];
    try {
      const files = fs.readdirSync(this.dir);
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        try {
          const raw = fs.readFileSync(path.join(this.dir, file), "utf-8");
          const item = JSON.parse(raw) as QueuedItem;
          item.path = path.join(this.dir, file);
          items.push(item);
        } catch {
          // skip corrupt files
        }
      }
    } catch {
      // directory may not exist yet
    }
    return items.sort((a, b) => a.createdAt - b.createdAt);
  }

  remove(id: string): void {
    const file = path.join(this.dir, `${id}.json`);
    try {
      fs.unlinkSync(file);
    } catch {
      // already gone
    }
  }

  incrementAttempts(id: string): void {
    const file = path.join(this.dir, `${id}.json`);
    try {
      const raw = fs.readFileSync(file, "utf-8");
      const item = JSON.parse(raw) as QueuedItem;
      item.attempts += 1;
      fs.writeFileSync(file, JSON.stringify(item, null, 2));
    } catch {
      // ignore
    }
  }

  maxAttemptsReached(id: string, max: number): boolean {
    const file = path.join(this.dir, `${id}.json`);
    try {
      const raw = fs.readFileSync(file, "utf-8");
      const item = JSON.parse(raw) as QueuedItem;
      return item.attempts >= max;
    } catch {
      return true;
    }
  }
}

export const offlineQueue = new OfflineQueue();
