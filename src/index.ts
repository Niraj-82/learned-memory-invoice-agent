
import { DefaultMemoryStore } from "./core/MemoryStore";
import { DefaultAnalyzer } from "./core/Analyzer";
import { Processor } from "./core/Processor";
import { invoices_extracted, human_corrections } from "./data/loader";
import db from "./config/db";

console.log("Learned Memory Agent Demo");

db.exec("DELETE FROM memories");

const processor = new Processor(DefaultMemoryStore, invoices_extracted);

const inv = invoices_extracted[0];
console.log(processor.process(inv));

DefaultMemoryStore.decayConfidences();
