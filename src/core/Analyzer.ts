
import { Invoice, MemoryRule } from "../types";
import { MemoryStore, DefaultMemoryStore } from "./MemoryStore";

export class Analyzer {
  constructor(private store: MemoryStore) {}

  learnFromCorrection(original: Invoice, corrected: Invoice): MemoryRule[] {
    const learned: MemoryRule[] = [];

    const persist = (rule: Omit<MemoryRule, "id">) => {
      const saved = this.store.saveRule(rule);
      learned.push(saved);
      return saved;
    };

    if (!original.fields.serviceDate && corrected.fields.serviceDate) {
      const [y,m,d] = corrected.fields.serviceDate.split("-");
      const de = `${d}.${m}.${y}`;
      const idx = original.rawText.indexOf(de);
      if (idx !== -1) {
        const prefix = original.rawText.substring(Math.max(0, idx-40), idx);
        const label = prefix.match(/([A-Za-zäöüÄÖÜß ]+):\s*$/);
        if (label) {
          const escaped = label[1].trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          persist({
            vendor: original.vendor,
            field: "serviceDate",
            type: "REGEX_EXTRACTION",
            value: `${escaped}:\\s*([\\d\\.]+)`,
            confidence: 0.6,
            weight: 1
          });
        }
      }
    }

    if (original.fields.taxTotal !== corrected.fields.taxTotal) {
      const raw = original.rawText.toLowerCase();
      if (["mwst. inkl", "vat included", "prices incl"].some(k => raw.includes(k))) {
        persist({
          vendor: original.vendor,
          field: "taxTotal",
          type: "ARITHMETIC_FIX",
          value: "GROSS_BACK_CALC",
          confidence: 0.6,
          weight: 1
        });
      }
    }

    original.fields.lineItems.forEach((o,i) => {
      const c = corrected.fields.lineItems[i];
      if (!o.sku && c?.sku && o.description?.toLowerCase().includes("seefracht")) {
        persist({
          vendor: original.vendor,
          field: "lineItems.sku",
          type: "STATIC_MAPPING",
          value: `Seefracht=${c.sku}`,
          confidence: 0.6,
          weight: 1
        });
      }
    });

    if (!original.fields.poNumber && corrected.fields.poNumber) {
      persist({
        vendor: original.vendor,
        field: "poNumber",
        type: "STATIC_MAPPING",
        value: corrected.fields.poNumber,
        confidence: 0.6,
        weight: 1
      });
    }

    return learned;
  }
}

export const DefaultAnalyzer = new Analyzer(DefaultMemoryStore);
