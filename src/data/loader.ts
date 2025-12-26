import invoices from "../../data/invoices_extracted.json";
import corrections from "../../data/human_corrections.json";
import { Invoice } from "../types";

export const invoices_extracted: Invoice[] = invoices as Invoice[];
export const human_corrections = corrections;
