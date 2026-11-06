/**
 * Régénère docs/agents/desk-inventory.csv depuis la source de données unique
 * (src/lib/organization.ts). Usage : npm run inventory
 */
import { writeFileSync } from "node:fs";
import { inventoryCsv } from "../src/lib/organization";

const target = new URL("../docs/agents/desk-inventory.csv", import.meta.url);
writeFileSync(target, inventoryCsv(), "utf8");
console.log(`Inventaire régénéré : ${target.pathname}`);
