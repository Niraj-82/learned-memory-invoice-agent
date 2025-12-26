import db from "./config/db";
import { DefaultMemoryStore } from "./core/MemoryStore";
import { DefaultAnalyzer } from "./core/Analyzer";
import { Processor } from "./core/Processor";
import { invoices_extracted } from "./data/loader";
import { Invoice } from "./types";

// --- Clean start for demo ---
db.exec("DELETE FROM memories");

const store = DefaultMemoryStore;
const analyzer = DefaultAnalyzer;
const processor = new Processor(store, invoices_extracted as Invoice[]);

// Pick invoices
const invA1 = invoices_extracted.find(i => i.invoiceId === "INV-A-001")!;
const invA2 = invoices_extracted.find(i => i.invoiceId === "INV-A-002")!;

// ----------------------------------------------------
// Epoch 1: Cold Start (No Memory)
// ----------------------------------------------------
console.log("\n=== Epoch 1: Cold Start ===");

const result1 = processor.process(invA1);
console.log(JSON.stringify(result1, null, 2));

// ----------------------------------------------------
// Learning Phase (Human Correction)
// ----------------------------------------------------
console.log("\n=== Learning from Human Correction ===");

// Simulate human correction
const correctedInvA1: Invoice = JSON.parse(JSON.stringify(invA1));
correctedInvA1.fields.serviceDate = "2024-01-01";

// Learn memory
const learnedRules = analyzer.learnFromCorrection(invA1, correctedInvA1);
console.log("Learned Rules:");
learnedRules.forEach(r =>
  console.log(`- ${r.type} | field=${r.field} | confidence=${r.confidence}`)
);

// ----------------------------------------------------
// Epoch 2: With Memory
// ----------------------------------------------------
console.log("\n=== Epoch 2: With Memory ===");

const result2 = processor.process(invA2);
console.log(JSON.stringify(result2, null, 2));

// ----------------------------------------------------
// Optional: Memory Snapshot
// ----------------------------------------------------
console.log("\n=== Memory Store Snapshot ===");
console.table(
  store.listAll().map(r => ({
    Vendor: r.vendor,
    Field: r.field,
    Type: r.type,
    Confidence: r.confidence.toFixed(2),
    Weight: r.weight
  }))
);
