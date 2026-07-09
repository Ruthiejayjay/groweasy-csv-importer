import { CrmRecord } from "./crm";
import { SkippedRecord } from "../services/validationService";

export interface ImportResult {
  imported: CrmRecord[];
  skipped: SkippedRecord[];
  totalImported: number;
  totalSkipped: number;
}
