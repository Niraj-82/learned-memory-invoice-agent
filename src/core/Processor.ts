
import { Invoice, ProcessorOutput, ProcessorOutputSchema, AuditEntry } from "../types";
import { MemoryStore } from "./MemoryStore";

export class Processor {
  constructor(private store: MemoryStore, private all: Invoice[]) {}

  private now() { return new Date().toISOString(); }

  process(invoice: Invoice): ProcessorOutput {
    const audit: AuditEntry[] = [];
    const proposed: string[] = [];
    const memoryUpdates: string[] = [];
    const normalized: Invoice = JSON.parse(JSON.stringify(invoice));

    const duplicate = this.all.some(i =>
      i.invoiceId !== invoice.invoiceId &&
      i.vendor === invoice.vendor &&
      i.fields.invoiceNumber === invoice.fields.invoiceNumber
    );

    if (duplicate) {
      audit.push({ step: "decide", timestamp: this.now(), details: "Duplicate invoice" });
      return ProcessorOutputSchema.parse({
        normalizedInvoice: normalized.fields,
        proposedCorrections: [],
        requiresHumanReview: true,
        reasoning: "Duplicate detected",
        confidenceScore: 0,
        memoryUpdates,
        auditTrail: audit
      });
    }

    audit.push({ step: "recall", timestamp: this.now(), details: "Loaded memory rules" });
    const rules = this.store.findRules(invoice.vendor);
    let confidence = 0.6;

    for (const r of rules) {
      if (r.type === "REGEX_EXTRACTION") {
        const m = invoice.rawText.match(new RegExp(r.value, "i"));
        if (m?.[1] && !normalized.fields.serviceDate) {
          normalized.fields.serviceDate = this.normalizeDate(m[1]);
          proposed.push("serviceDate inferred");
          confidence += 0.2;
        }
      }

      if (r.type === "ARITHMETIC_FIX") {
        const g = normalized.fields.grossTotal;
        const rtx = normalized.fields.taxRate ?? 0.19;
        const net = +(g / (1+rtx)).toFixed(2);
        const tax = +(g - net).toFixed(2);
        normalized.fields.netTotal = net;
        normalized.fields.taxTotal = tax;
        proposed.push("VAT recalculated");
        confidence += 0.15;
      }

      if (r.type === "STATIC_MAPPING" && r.field === "lineItems.sku") {
        const [k,v] = r.value.split("=");
        normalized.fields.lineItems.forEach(li => {
          if (!li.sku && li.description?.includes(k)) {
            li.sku = v;
            proposed.push(`SKU mapped to ${v}`);
            confidence += 0.15;
          }
        });
      }
    }

    const { netTotal=0, taxTotal=0, grossTotal=0 } = normalized.fields;
    if (Math.abs(netTotal + taxTotal - grossTotal) > 0.05) confidence -= 0.5;

    confidence = Math.max(0, Math.min(1, confidence));
    const requiresHumanReview = confidence < 0.8;

    audit.push({ step: "decide", timestamp: this.now(), details: `Confidence ${confidence.toFixed(2)}` });

    return ProcessorOutputSchema.parse({
      normalizedInvoice: normalized.fields,
      proposedCorrections: proposed,
      requiresHumanReview,
      reasoning: requiresHumanReview ? "Needs review" : "Auto approved",
      confidenceScore: +confidence.toFixed(2),
      memoryUpdates,
      auditTrail: audit
    });
  }

  private normalizeDate(s: string) {
    const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
  }
}
