import fs from "fs";
import path from "path";
import type { EvaluationCore, EvaluationRequestInputs } from "./engine.ts";

export type EvidenceEntry = EvaluationRequestInputs &
  EvaluationCore & {
    id: string;
    timestamp: string;
  };

export interface EvidenceStore {
  list(): EvidenceEntry[];
  find(id: string): EvidenceEntry | undefined;
  append(entry: EvidenceEntry): void;
}

export class FileEvidenceStore implements EvidenceStore {
  private readonly filePath: string;

  constructor(filePath = path.join(process.cwd(), "logs.json")) {
    this.filePath = filePath;
  }

  private ensureFile() {
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, "[]\n", "utf-8");
    }
  }

  list(): EvidenceEntry[] {
    this.ensureFile();
    const parsed: unknown = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
    if (!Array.isArray(parsed)) {
      throw new Error("Evidence store must contain a JSON array.");
    }
    return parsed as EvidenceEntry[];
  }

  find(id: string) {
    return this.list().find((entry) => entry.id === id);
  }

  append(entry: EvidenceEntry) {
    const entries = this.list();
    entries.unshift(entry);
    const temporaryPath = `${this.filePath}.tmp`;
    fs.writeFileSync(temporaryPath, `${JSON.stringify(entries, null, 2)}\n`, "utf-8");
    fs.renameSync(temporaryPath, this.filePath);
  }
}
