// Search/filter + CSV/JSON export + deterministic domain insights over own records.
// Pure helpers: no DB or provider calls, safe to unit-test offline.
export function filterRecords(rows,{q="",status="",risk=""}={}){
  const needle=String(q||"").trim().toLowerCase();
  return (rows||[]).filter(r=>{
    if(status && String(r.status??"")!==status) return false;
    if(risk && String(r.risk??"")!==risk) return false;
    if(!needle) return true;
    const hay=[r.title,r.reference,r.status,r.owner,r.risk,JSON.stringify(r.payload??{})].filter(v=>v!==undefined&&v!==null).join(" ").toLowerCase();
    return hay.includes(needle);
  });
}
function cell(v){ if(v===null||v===undefined) return ""; if(typeof v==="object") return JSON.stringify(v); return String(v); }
export function recordsToCsv(rows){
  const cols=["id","feature_id","reference","title","status","owner","risk","due_date","amount","payload","created_at","updated_at"];
  const esc=s=>/[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
  // Preserve false/0/empty explicitly: String(false)="false", String(0)="0", empty stays an empty cell.
  return [cols.join(","),...(rows||[]).map(r=>cols.map(c=>esc(cell(r[c]))).join(","))].join("\n");
}
export function exportRecords(rows,format){
  if(format==="csv") return {contentType:"text/csv; charset=utf-8",body:recordsToCsv(rows)};
  return {contentType:"application/json",body:JSON.stringify(rows??[],null,2)};
}
export function domainInsights(rows,featureTitle){
  const list=rows||[];
  const high=list.filter(r=>["High","Critical"].includes(String(r.risk??""))).length;
  const open=list.filter(r=>!["Approved","Closed"].includes(String(r.status??""))).length;
  const total=list.reduce((s,r)=>s+(Number.isFinite(Number(r.amount))?Number(r.amount):0),0);
  const zeroAmount=list.filter(r=>Number(r.amount)===0).length;
  return {
    aiGenerated:false,
    source:"deterministic-fallback",
    label:"Deterministic fallback \u2014 not AI-generated. Computed locally from your own records; verify before acting.",
    feature:featureTitle,
    sections:[
      {title:"Exception & risk summary",detail:`${list.length} record(s) reviewed for ${featureTitle}: ${high} high/critical-risk, ${open} still open. Counts of 0 are shown explicitly and mean none found in the current records.`},
      {title:"Value at stake",detail:`Total recorded amount is ${total}. ${zeroAmount} record(s) carry an amount of 0 \u2014 retained here rather than dropped, and worth confirming as genuine zero-value cases.`},
      {title:"Work queue & next actions",detail:open?`Prioritise the ${open} open record(s), starting with high/critical risk, assign an owner, and retain closure evidence.`:"No open records in scope; keep the audit trail and re-run when new records arrive."},
    ],
    metrics:[{label:"Records reviewed",value:list.length},{label:"High/critical risk",value:high},{label:"Open records",value:open},{label:"Zero-amount records",value:zeroAmount}],
  };
}
