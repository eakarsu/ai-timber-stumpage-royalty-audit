import test from "node:test";
import assert from "node:assert/strict";
delete process.env.OPENROUTER_API_KEY;
const {filterRecords,recordsToCsv,exportRecords,domainInsights}=await import("../listTools.mjs");
const rows=[{id:1,reference:"A-1",title:"Scale ticket mismatch",status:"Open",owner:"Sam",risk:"High",amount:0,payload:{verified:false}},{id:2,reference:"B-2",title:"Mill receipt ok",status:"Closed",owner:"Jo",risk:"Low",amount:125,payload:{verified:true}}];
test("search/filter matches text and status, preserves 0/false rows",()=>{ assert.equal(filterRecords(rows,{q:"scale"}).length,1); assert.equal(filterRecords(rows,{status:"Closed"})[0].id,2); assert.equal(filterRecords(rows,{q:"false"})[0].amount,0); });
test("CSV/JSON export preserves false/0/empty",()=>{ const csv=recordsToCsv(rows); assert.match(csv,/false/); assert.match(csv,/,0,/); assert.equal(JSON.parse(exportRecords(rows,"json").body)[0].payload.verified,false); assert.equal(exportRecords(rows,"csv").contentType.includes("csv"),true); });
test("deterministic insights are labelled aiGenerated:false with readable sections incl. zero counts",()=>{ const r=domainInsights(rows,"Timber Stumpage Royalty Audit"); assert.equal(r.aiGenerated,false); assert.match(r.label,/not AI-generated/); assert.equal(r.sections.length,3); assert.ok(r.sections.every(s=>s.title&&s.detail!==undefined)); assert.equal(r.metrics.find(m=>m.label==="Zero-amount records").value,1); assert.equal(domainInsights([],"x").sections.length,3); });
