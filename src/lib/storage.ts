const STORAGE_PREFIX = "sutra:";

export function readStoredRecords<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);

    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function writeStoredRecords<T>(key: string, records: T[]): void {
  localStorage.setItem(
    `${STORAGE_PREFIX}${key}`,
    JSON.stringify(records),
  );
}

export function createRecordId(): string {
  return crypto.randomUUID();
}