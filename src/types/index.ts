
import { z } from "zod";

export const LineItemSchema = z.object({
  sku: z.string().nullable().optional(),
  description: z.string().optional(),
  qty: z.number(),
  unitPrice: z.number()
});

export const InvoiceFieldsSchema = z.object({
  invoiceNumber: z.string(),
  invoiceDate: z.string(),
  serviceDate: z.string().nullable().optional(),
  currency: z.string().nullable().optional(),
  poNumber: z.string().nullable().optional(),
  netTotal: z.number(),
  taxRate: z.number().optional(),
  taxTotal: z.number(),
  grossTotal: z.number(),
  discountTerms: z.string().optional(),
  lineItems: z.array(LineItemSchema)
});

export const InvoiceSchema = z.object({
  invoiceId: z.string(),
  vendor: z.string(),
  fields: InvoiceFieldsSchema,
  confidence: z.number(),
  rawText: z.string()
});

export type Invoice = z.infer<typeof InvoiceSchema>;

export const MemoryRuleSchema = z.object({
  id: z.number(),
  vendor: z.string(),
  field: z.string(),
  type: z.enum(["REGEX_EXTRACTION", "ARITHMETIC_FIX", "STATIC_MAPPING"]),
  value: z.string(),
  confidence: z.number(),
  weight: z.number()
});

export type MemoryRule = z.infer<typeof MemoryRuleSchema>;

export const AuditEntrySchema = z.object({
  step: z.enum(["recall", "apply", "decide", "learn"]),
  timestamp: z.string(),
  details: z.string()
});

export type AuditEntry = z.infer<typeof AuditEntrySchema>;

export const ProcessorOutputSchema = z.object({
  normalizedInvoice: InvoiceFieldsSchema,
  proposedCorrections: z.array(z.string()),
  requiresHumanReview: z.boolean(),
  reasoning: z.string(),
  confidenceScore: z.number(),
  memoryUpdates: z.array(z.string()),
  auditTrail: z.array(AuditEntrySchema)
});

export type ProcessorOutput = z.infer<typeof ProcessorOutputSchema>;
