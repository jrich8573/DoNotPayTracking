import { useState, useMemo } from "react";

const ROUTINE_USE = `To the U.S. Department of the Treasury when disclosure of the information is relevant to review payment and award eligibility through the Do Not Pay Working System for the purposes of identifying, preventing, or recouping improper payments to an applicant for, or recipient of, Federal funds, including funds disbursed by a state (meaning a state of the United States, the District of Columbia, a territory or possession of the United States, or a federally recognized Indian tribe) in a state-administered, federally funded program.`;

const AGENCIES = [
  { agency:"Social Security Administration", abbr:"SSA", type:"CFO Act", frDoc:"2025-20931", frCitation:"90 FR 50879", pubDate:"2025-11-25", effectiveDate:"2025-12-26", sorns:["Multiple SSA systems of records"], notes:"EO 14249 compliance; added DNP routine use with limitation per 20 CFR 401.150(c). Comment period through Dec. 26, 2025.", frUrl:"https://www.federalregister.gov/documents/2025/11/25/2025-20931/privacy-act-of-1974-system-of-records", status:"Effective", sornCount:"Multiple" },
  { agency:"Commodity Futures Trading Commission", abbr:"CFTC", type:"Independent", frDoc:"2025-21510", frCitation:"90 FR (Nov. 28, 2025)", pubDate:"2025-11-28", effectiveDate:"2025-12-29", sorns:["CFTC-5 (Employee Personnel, Payroll & T&A)","CFTC-6","CFTC-7","CFTC-8"], notes:"Modified 4 SORNs. Also added M-17-12 breach routine uses to 3 of the 4 systems.", frUrl:"https://www.federalregister.gov/documents/2025/11/28/2025-21510/privacy-act-of-1974-system-of-records", status:"Effective", sornCount:4 },
  { agency:"Department of Education", abbr:"ED", type:"CFO Act", frDoc:"2025-22310", frCitation:"90 FR (Dec. 9, 2025)", pubDate:"2025-12-09", effectiveDate:"2026-01-08", sorns:["Multiple ED systems of records"], notes:"Cites both EO 14249 and M-25-32. Comment period closed Jan. 8, 2026.", frUrl:"https://www.federalregister.gov/documents/2025/12/09/2025-22310/privacy-act-of-1974-system-of-records", status:"Effective", sornCount:"Multiple" },
  { agency:"Securities and Exchange Commission", abbr:"SEC", type:"Independent", frDoc:"PA-63 / S7-2025-05", frCitation:"90 FR (Dec. 19, 2025)", pubDate:"2025-12-19", effectiveDate:"2026-01-18", sorns:["SEC-06 (Financial and Acquisition Management System)"], notes:"Modified SEC-06 only after comprehensive SORN inventory review per EO 14249 and M-25-32.", frUrl:"https://www.sec.gov/files/rules/other/2025/pa-63.pdf", status:"Effective", sornCount:1 },
  { agency:"General Services Administration", abbr:"GSA", type:"CFO Act", frDoc:"2026-00358", frCitation:"91 FR (Jan. 12, 2026)", pubDate:"2026-01-12", effectiveDate:"2026-02-11", sorns:["GSA/PPFM-11 (Pegasys Financial Management System)"], notes:"DNP added as 'Routine Use k'. Also added Congressional disclosure and breach uses. Pegasys re-acquired from USDA in 2023.", frUrl:"https://www.federalregister.gov/documents/2026/01/12/2026-00358/privacy-act-of-1974-notice-of-a-modified-system-of-records", status:"Effective", sornCount:1 },
  { agency:"Department of Housing and Urban Development", abbr:"HUD", type:"CFO Act", frDoc:"2026-00809", frCitation:"91 FR 11 (Jan. 16, 2026)", pubDate:"2026-01-16", effectiveDate:"2026-02-15", sorns:["LOCCS — Line of Credit Control System (A67)","HUDCAPS (A75)","Enterprise Income Verification (HUD/PIH-05)","HUD Information Portal (HUD/PIH-01)","Single Family Insurance System (HUD/HOU-04)","DSRS (HUD/HOU-03)","SMART (HUD/HOU-58)"], notes:"7 SORNs. Also removed prior DNP routine use from Single Family Mortgage Insurance Origination System. Acting CPO: Shalanda Capehart.", frUrl:"https://downloads.regulations.gov/HUD-2026-0067-0001/content.html", status:"Effective", sornCount:7 },
  { agency:"Department of Transportation", abbr:"DOT", type:"CFO Act", frDoc:"2026-00936", frCitation:"91 FR 12 (Jan. 20, 2026)", pubDate:"2026-01-20", effectiveDate:"2026-02-19", sorns:["DOT/ALL 8 — Parking and Transit Benefit Records (TRANServe TSP)"], notes:"SORN renamed from 'Parking and Transit Benefit System'. Migrated to FedRAMP-authorized cloud. SSNs no longer collected.", frUrl:"https://www.federalregister.gov/documents/2026/01/20/2026-00936/privacy-act-of-1974-system-of-records", status:"Effective", sornCount:1 },
  { agency:"Peace Corps", abbr:"PC", type:"Independent", frDoc:"2026-01444", frCitation:"91 FR (Jan. 26, 2026)", pubDate:"2026-01-26", effectiveDate:"2026-02-25", sorns:["PC-1","PC-9","P-22","PC-23"], notes:"Added as 'Routine Use O' to Peace Corps General Routine Use list. Comment period through Feb. 25, 2026.", frUrl:"https://www.federalregister.gov/documents/2026/01/26/2026-01444/privacy-act-of-1974-system-of-records", status:"Comment Period", sornCount:4 },
  { agency:"Federal Energy Regulatory Commission", abbr:"FERC", type:"Independent", frDoc:"2026-02520", frCitation:"91 FR 5757 (Feb. 9, 2026)", pubDate:"2026-02-09", effectiveDate:"2026-03-11", sorns:["FERC-16 — Death Case Files","FERC-17 — Disability Retirement Files","FERC-18 — Discontinued Service Retirements","FERC-21 — Training Records","FERC-22 — Employee Indebtedness Cases","FERC-23 — Leave Without Pay Requests","FERC-25 — OWCP Claims","FERC-28 — Restoration of Annual Leave","FERC-29 — Unemployment Compensation","FERC-31 — Parking Records","FERC-32 — Fitness Center Records","FERC-35 — Security Investigations","FERC-37 — Voluntary Leave Transfer","FERC-41 — Transit Subsidy Records","FERC-43 — Travel Records","FERC-46 — FOIA & PA Request Files"], notes:"16 SORNs in a single consolidated notice. CIO & SAOP: Mittal Desai. Comment period closes ~Mar. 11, 2026.", frUrl:"https://www.federalregister.gov/documents/2026/02/09/2026-02520/privacy-act-of-1974-systems-of-records", status:"Comment Period", sornCount:16 },
  { agency:"Department of Agriculture", abbr:"USDA", type:"CFO Act", frDoc:null, frCitation:null, pubDate:null, effectiveDate:null, sorns:[], notes:"Extensive payment programs (SNAP, farm subsidies, rural development loans). VA BEP data already used by USDA via PARIS for eligibility checks, making this a high-priority filer.", frUrl:"https://www.federalregister.gov/agencies/agriculture-department", status:"Not Filed", sornCount:null },
  { agency:"Department of Commerce", abbr:"DOC", type:"CFO Act", frDoc:null, frCitation:null, pubDate:null, effectiveDate:null, sorns:[], notes:"Includes NOAA, Census Bureau, USPTO, and NIST — multiple components with grant and contractor payment SORNs likely in scope.", frUrl:"https://www.federalregister.gov/agencies/commerce-department", status:"Not Filed", sornCount:null },
  { agency:"Department of Defense", abbr:"DoD", type:"CFO Act", frDoc:null, frCitation:null, pubDate:null, effectiveDate:null, sorns:[], notes:"Largest federal agency by disbursement. DFAS is a Non-Treasury Disbursing Office handling $477B+/year. Likely dozens of relevant component SORNs across Army, Navy, Air Force, and defense agencies.", frUrl:"https://www.federalregister.gov/agencies/defense-department", status:"Not Filed", sornCount:null },
  { agency:"Department of Energy", abbr:"DOE", type:"CFO Act", frDoc:null, frCitation:null, pubDate:null, effectiveDate:null, sorns:[], notes:"Parent department of FERC (which has filed). DOE proper — covering grants, national labs, and contractor payments — has not separately filed.", frUrl:"https://www.federalregister.gov/agencies/energy-department", status:"Not Filed", sornCount:null },
  { agency:"Department of Health and Human Services", abbr:"HHS", type:"CFO Act", frDoc:null, frCitation:null, pubDate:null, effectiveDate:null, sorns:[], notes:"Highest improper payment risk of any agency. CMS alone administers Medicare and Medicaid. Dozens of component SORNs likely in scope across CMS, NIH, CDC, HRSA, SAMHSA, and ACF.", frUrl:"https://www.federalregister.gov/agencies/health-and-human-services-department", status:"Not Filed", sornCount:null },
  { agency:"Department of Homeland Security", abbr:"DHS", type:"CFO Act", frDoc:null, frCitation:null, pubDate:null, effectiveDate:null, sorns:[], notes:"Includes FEMA (disaster relief payments), CBP, and ICE. FEMA improper payments are a historically significant federal issue.", frUrl:"https://www.federalregister.gov/agencies/homeland-security-department", status:"Not Filed", sornCount:null },
  { agency:"Department of the Interior", abbr:"DOI", type:"CFO Act", frDoc:null, frCitation:null, pubDate:null, effectiveDate:null, sorns:[], notes:"Manages mineral royalties, tribal trust payments, and natural resource grants via BLM, BIA, NPS, and BSEE.", frUrl:"https://www.federalregister.gov/agencies/interior-department", status:"Not Filed", sornCount:null },
  { agency:"Department of Justice", abbr:"DOJ", type:"CFO Act", frDoc:null, frCitation:null, pubDate:null, effectiveDate:null, sorns:[], notes:"Administers OJP grants, BOP vendor payments, and law enforcement assistance programs with significant payment volume.", frUrl:"https://www.federalregister.gov/agencies/justice-department", status:"Not Filed", sornCount:null },
  { agency:"Department of Labor", abbr:"DOL", type:"CFO Act", frDoc:null, frCitation:null, pubDate:null, effectiveDate:null, sorns:[], notes:"UI program improper payments are a major long-standing federal problem. Employment and training grants also in scope.", frUrl:"https://www.federalregister.gov/agencies/labor-department", status:"Not Filed", sornCount:null },
  { agency:"Department of State", abbr:"DOS", type:"CFO Act", frDoc:null, frCitation:null, pubDate:null, effectiveDate:null, sorns:[], notes:"Foreign assistance payments, contractor payments abroad, and consular services may have relevant SORNs. Unique cross-border compliance context.", frUrl:"https://www.federalregister.gov/agencies/state-department", status:"Not Filed", sornCount:null },
  { agency:"Department of the Treasury", abbr:"Treasury", type:"CFO Act", frDoc:null, frCitation:null, pubDate:null, effectiveDate:null, sorns:[], notes:"Operates DNP itself (Bureau of Fiscal Service). Must also comply as a disclosing agency. IRS and BFS have extensive SORN inventories that likely need modification.", frUrl:"https://www.federalregister.gov/agencies/treasury-department", status:"Not Filed", sornCount:null },
  { agency:"Department of Veterans Affairs", abbr:"VA", type:"CFO Act", frDoc:null, frCitation:null, pubDate:null, effectiveDate:null, sorns:[], notes:"VA BEP database designated into DNP/PARIS (Sep. 2025) for state use. VA must also modify its own SORNs as a disclosing agency. VBA and VHA payments are massive in scale.", frUrl:"https://www.federalregister.gov/agencies/veterans-affairs-department", status:"Not Filed", sornCount:null },
  { agency:"Environmental Protection Agency", abbr:"EPA", type:"CFO Act", frDoc:null, frCitation:null, pubDate:null, effectiveDate:null, sorns:[], notes:"Administers grants and cooperative agreements to states and tribes for environmental programs. Grantee and contractor payment records in scope.", frUrl:"https://www.federalregister.gov/agencies/environmental-protection-agency", status:"Not Filed", sornCount:null },
  { agency:"National Aeronautics and Space Administration", abbr:"NASA", type:"CFO Act", frDoc:null, frCitation:null, pubDate:null, effectiveDate:null, sorns:[], notes:"Large contractor payment base. SEWP and other acquisition vehicles involve substantial payment records for vendors and awardees.", frUrl:"https://www.federalregister.gov/agencies/national-aeronautics-and-space-administration", status:"Not Filed", sornCount:null },
  { agency:"Nuclear Regulatory Commission", abbr:"NRC", type:"CFO Act", frDoc:null, frCitation:null, pubDate:null, effectiveDate:null, sorns:[], notes:"Smaller, fee-funded agency. Contractor and grant payment records may be limited in scope relative to other CFO Act agencies.", frUrl:"https://www.federalregister.gov/agencies/nuclear-regulatory-commission", status:"Not Filed", sornCount:null },
  { agency:"National Science Foundation", abbr:"NSF", type:"CFO Act", frDoc:null, frCitation:null, pubDate:null, effectiveDate:null, sorns:[], notes:"Primarily a grant-making agency — awardee, PI, and institution records are highly relevant to DNP screening.", frUrl:"https://www.federalregister.gov/agencies/national-science-foundation", status:"Not Filed", sornCount:null },
  { agency:"Office of Personnel Management", abbr:"OPM", type:"CFO Act", frDoc:null, frCitation:null, pubDate:null, effectiveDate:null, sorns:[], notes:"Administers federal retirement and FEHB — among the largest benefit payment programs subject to DNP. CSRS/FERS and health plan records highly implicated.", frUrl:"https://www.federalregister.gov/agencies/personnel-management-office", status:"Not Filed", sornCount:null },
  { agency:"Small Business Administration", abbr:"SBA", type:"CFO Act", frDoc:null, frCitation:null, pubDate:null, effectiveDate:null, sorns:[], notes:"Loan guarantee and disaster assistance programs had massive COVID-era improper payments. SBA is a primary target for DNP screening improvements.", frUrl:"https://www.federalregister.gov/agencies/small-business-administration", status:"Not Filed", sornCount:null },
  { agency:"U.S. Agency for International Development", abbr:"USAID", type:"CFO Act", frDoc:null, frCitation:null, pubDate:null, effectiveDate:null, sorns:[], notes:"Undergoing major restructuring under DOGE. Foreign assistance payments have unique compliance context. Operational status makes compliance timeline uncertain.", frUrl:"https://www.federalregister.gov/agencies/agency-for-international-development", status:"Not Filed", sornCount:null },
];

const STATUS_CFG = {
  "Effective":      { bg:"#052e16", text:"#4ade80", border:"#166534", dot:"#22c55e" },
  "Comment Period": { bg:"#1c1917", text:"#fb923c", border:"#9a3412", dot:"#f97316" },
  "Not Filed":      { bg:"#1a0a0a", text:"#f87171", border:"#7f1d1d", dot:"#ef4444" },
};

function Dot({ status }) {
  const c = STATUS_CFG[status];
  return <span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background:c.dot, marginRight:5, flexShrink:0, boxShadow: status==="Effective"?`0 0 5px ${c.dot}66`:"none" }} />;
}

function Badge({ status }) {
  const c = STATUS_CFG[status];
  return (
    <span style={{ background:c.bg, color:c.text, border:`1px solid ${c.border}`, borderRadius:3, padding:"2px 7px", fontSize:10, fontFamily:"monospace", whiteSpace:"nowrap", display:"inline-flex", alignItems:"center" }}>
      <Dot status={status}/>{status}
    </span>
  );
}

function Chip({ s }) {
  return <span style={{ background:"#0d1117", color:"#6b7280", border:"1px solid #1f2937", borderRadius:3, padding:"2px 5px", fontSize:10, fontFamily:"monospace", display:"inline-block", margin:"2px 2px 2px 0" }}>{s}</span>;
}

function Row({ a, isOpen, onToggle }) {
  const c = STATUS_CFG[a.status];
  const filed = a.status !== "Not Filed";
  return (
    <div style={{ background:"#08111e", border:`1px solid ${isOpen?c.border:"#111827"}`, borderRadius:5, marginBottom:5, overflow:"hidden", transition:"border-color 0.15s" }}>
      <div onClick={onToggle} style={{ display:"grid", gridTemplateColumns:"22px 2fr 95px 100px 100px 130px 20px", gap:10, padding:"11px 14px", cursor:"pointer", alignItems:"center" }}>
        <span style={{ fontSize:8, color:"#1f2937", border:"1px solid #1f2937", borderRadius:2, padding:"1px 2px", fontFamily:"monospace", textAlign:"center", lineHeight:1.4 }}>
          {a.type==="CFO Act"?"CFO":"IND"}
        </span>
        <div>
          <span style={{ fontSize:13, fontWeight:600, color:"#f3f4f6" }}>{a.agency}</span>
          <span style={{ fontSize:10, color:"#374151", fontFamily:"monospace", marginLeft:6 }}>({a.abbr})</span>
        </div>
        <span style={{ fontSize:11, color:filed?"#6b7280":"#1f2937", fontFamily:"monospace" }}>{a.pubDate??'—'}</span>
        <span style={{ fontSize:11, color:filed?"#6b7280":"#1f2937", fontFamily:"monospace" }}>{a.effectiveDate??'—'}</span>
        <span style={{ fontSize:11, color:filed?"#6b7280":"#1f2937", fontFamily:"monospace" }}>
          {a.sornCount!=null?`${a.sornCount} SORN${a.sornCount!==1&&a.sornCount!=="Multiple"?"s":a.sornCount==="Multiple"?"s":""}`:"—"}
        </span>
        <Badge status={a.status}/>
        <span style={{ color:"#374151", fontSize:10, textAlign:"right" }}>{isOpen?"▲":"▼"}</span>
      </div>
      {isOpen && (
        <div style={{ borderTop:"1px solid #0d1117", padding:"12px 14px", background:"#050c18" }}>
          {filed ? (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:12 }}>
              <div>
                <div style={{ fontSize:9, color:"#374151", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:5 }}>SORNs Modified</div>
                <div>{a.sorns.map(s=><Chip key={s} s={s}/>)}</div>
              </div>
              <div>
                <div style={{ fontSize:9, color:"#374151", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:5 }}>Notes</div>
                <p style={{ margin:0, fontSize:12, color:"#9ca3af", lineHeight:1.6 }}>{a.notes}</p>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:9, color:"#374151", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:5 }}>Compliance Context</div>
              <p style={{ margin:0, fontSize:12, color:"#9ca3af", lineHeight:1.6 }}>{a.notes}</p>
            </div>
          )}
          <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
            {a.frDoc && <>
              <span style={{ fontSize:10, color:"#374151", fontFamily:"monospace" }}>FR Doc: <span style={{ color:"#60a5fa" }}>{a.frDoc}</span></span>
              <span style={{ fontSize:10, color:"#374151", fontFamily:"monospace" }}>Citation: <span style={{ color:"#60a5fa" }}>{a.frCitation}</span></span>
            </>}
            <a href={a.frUrl} target="_blank" rel="noreferrer" style={{ fontSize:10, color:"#3b82f6", textDecoration:"none", fontFamily:"monospace", marginLeft:"auto", border:"1px solid #1e3a5f", padding:"3px 9px", borderRadius:4 }}>
              {filed?"View FR Notice ↗":"Agency FR Page ↗"}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [view, setView] = useState("gap");
  const [expanded, setExpanded] = useState(null);

  const stats = useMemo(() => ({
    total: AGENCIES.length,
    effective: AGENCIES.filter(a=>a.status==="Effective").length,
    comment: AGENCIES.filter(a=>a.status==="Comment Period").length,
    notFiled: AGENCIES.filter(a=>a.status==="Not Filed").length,
    cfoFiled: AGENCIES.filter(a=>a.type==="CFO Act"&&a.status!=="Not Filed").length,
    cfoTotal: AGENCIES.filter(a=>a.type==="CFO Act").length,
    sornCount: AGENCIES.filter(a=>typeof a.sornCount==="number").reduce((n,a)=>n+a.sornCount,0),
  }), []);

  const filtered = useMemo(() => AGENCIES.filter(a => {
    const q = search.toLowerCase();
    return (!q || a.agency.toLowerCase().includes(q) || a.abbr.toLowerCase().includes(q) || a.sorns.some(s=>s.toLowerCase().includes(q)))
      && (statusFilter==="All" || a.status===statusFilter)
      && (typeFilter==="All" || a.type===typeFilter);
  }), [search, statusFilter, typeFilter]);

  const pct = Math.round(((stats.effective+stats.comment)/stats.total)*100);
  const filed = filtered.filter(a=>a.status!=="Not Filed");
  const notFiled = filtered.filter(a=>a.status==="Not Filed");

  const toggle = key => setExpanded(expanded===key?null:key);

  return (
    <div style={{ minHeight:"100vh", background:"#030712", color:"#e5e7eb", fontFamily:"'Helvetica Neue',Arial,sans-serif" }}>

      {/* HEADER */}
      <div style={{ borderBottom:"1px solid #0d1a2d", background:"#020b17", padding:"24px 32px 18px" }}>
        <div style={{ fontSize:9, color:"#1e3a5f", letterSpacing:"0.2em", textTransform:"uppercase", fontFamily:"monospace", marginBottom:5 }}>EO 14249 · OMB M-25-32 · Privacy Act Compliance</div>
        <h1 style={{ margin:"0 0 4px", fontSize:19, fontWeight:700, color:"#f9fafb", letterSpacing:"-0.02em" }}>Do Not Pay SORN Routine Use — Compliance Tracker</h1>
        <p style={{ margin:0, fontSize:12, color:"#4b5563", maxWidth:660 }}>Agency Federal Register filings adding the Treasury Do Not Pay routine use to Privacy Act SORNs. Updated Mar. 16, 2026.</p>

        <div style={{ display:"flex", gap:8, marginTop:16, flexWrap:"wrap" }}>
          {[
            { l:"Total Tracked", v:stats.total, c:"#60a5fa" },
            { l:"Effective", v:stats.effective, c:"#22c55e" },
            { l:"Comment Period", v:stats.comment, c:"#f97316" },
            { l:"Not Filed", v:stats.notFiled, c:"#ef4444" },
            { l:"CFO Act Filed", v:`${stats.cfoFiled}/${stats.cfoTotal}`, c:"#a78bfa" },
            { l:"SORNs Confirmed", v:`${stats.sornCount}+`, c:"#34d399" },
          ].map(s=>(
            <div key={s.l} style={{ background:"#080f1a", border:"1px solid #111f30", borderRadius:5, padding:"7px 12px" }}>
              <div style={{ fontSize:17, fontWeight:700, color:s.c, fontFamily:"monospace" }}>{s.v}</div>
              <div style={{ fontSize:9, color:"#374151", marginTop:1 }}>{s.l}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop:14, maxWidth:480 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
            <span style={{ fontSize:9, color:"#374151" }}>Compliance progress (filed / total tracked)</span>
            <span style={{ fontSize:9, color:"#4b5563", fontFamily:"monospace" }}>{pct}%</span>
          </div>
          <div style={{ background:"#0a1525", borderRadius:3, height:5, overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:3, width:`${pct}%`, background:"linear-gradient(90deg,#1d4ed8,#22c55e)", transition:"width 0.5s" }}/>
          </div>
          <div style={{ display:"flex", gap:12, marginTop:5 }}>
            {[["#22c55e",`Effective (${stats.effective})`],["#f97316",`Comment Period (${stats.comment})`],["#ef4444",`Not Filed (${stats.notFiled})`]].map(([c,l])=>(
              <span key={l} style={{ fontSize:9, color:c }}>■ {l}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ROUTINE USE */}
      <div style={{ padding:"12px 32px 0" }}>
        <div style={{ background:"#060d1a", border:"1px solid #162540", borderLeft:"3px solid #1d4ed8", borderRadius:4, padding:"10px 14px", maxWidth:820 }}>
          <div style={{ fontSize:8, color:"#1e3a5f", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:5 }}>Standardized Routine Use — OMB M-25-32</div>
          <p style={{ margin:0, fontSize:11, color:"#4b5563", lineHeight:1.7, fontStyle:"italic" }}>"{ROUTINE_USE}"</p>
        </div>
      </div>

      {/* CONTROLS */}
      <div style={{ padding:"14px 32px 8px", display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ display:"flex", background:"#080f1a", border:"1px solid #111f30", borderRadius:5, overflow:"hidden" }}>
          {[["list","All Agencies"],["gap","Compliance Gap"]].map(([v,l])=>(
            <button key={v} onClick={()=>setView(v)} style={{ background:view===v?"#162540":"transparent", border:"none", color:view===v?"#93c5fd":"#374151", padding:"6px 13px", fontSize:11, cursor:"pointer", fontFamily:"monospace" }}>{l}</button>
          ))}
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search agency, SORN…"
          style={{ background:"#080f1a", border:"1px solid #111f30", borderRadius:4, color:"#e5e7eb", padding:"5px 11px", fontSize:11, width:200, outline:"none" }}/>
        {["All","Effective","Comment Period","Not Filed"].map(f=>(
          <button key={f} onClick={()=>setStatusFilter(f)} style={{ background:statusFilter===f?"#162540":"#080f1a", border:`1px solid ${statusFilter===f?"#3b82f6":"#111f30"}`, borderRadius:4, color:statusFilter===f?"#93c5fd":"#374151", padding:"5px 11px", fontSize:10, cursor:"pointer", fontFamily:"monospace" }}>{f}</button>
        ))}
        {["All","CFO Act","Independent"].map(t=>(
          <button key={t} onClick={()=>setTypeFilter(t)} style={{ background:typeFilter===t?"#1a1040":"#080f1a", border:`1px solid ${typeFilter===t?"#7c3aed":"#111f30"}`, borderRadius:4, color:typeFilter===t?"#a78bfa":"#374151", padding:"5px 11px", fontSize:10, cursor:"pointer", fontFamily:"monospace" }}>{t}</button>
        ))}
        <a href="https://www.federalregister.gov/documents/search?conditions%5Bterm%5D=%22Do+Not+Pay+Working+System%22+%22routine+use%22&conditions%5Btype%5D%5B%5D=NOTICE" target="_blank" rel="noreferrer"
          style={{ marginLeft:"auto", fontSize:10, color:"#3b82f6", textDecoration:"none", fontFamily:"monospace", border:"1px solid #1e3a5f", padding:"5px 11px", borderRadius:4 }}>
          🔍 Live FR Search ↗
        </a>
      </div>

      {/* TABLE HEADER */}
      <div style={{ padding:"0 32px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"22px 2fr 95px 100px 100px 130px 20px", gap:10, padding:"4px 14px 7px", fontSize:8, color:"#1f2937", textTransform:"uppercase", letterSpacing:"0.1em" }}>
          <div></div><div>Agency</div><div>Published</div><div>Effective</div><div>SORNs</div><div>Status</div><div></div>
        </div>
      </div>

      {/* ROWS */}
      <div style={{ padding:"0 32px 36px" }}>
        {view==="list" ? (
          filtered.map((a,i)=><Row key={a.abbr} a={a} isOpen={expanded===`l${i}`} onToggle={()=>toggle(`l${i}`)}/>)
        ) : (
          <>
            {filed.length>0 && (
              <>
                <div style={{ fontSize:9, color:"#22c55e", textTransform:"uppercase", letterSpacing:"0.15em", fontFamily:"monospace", padding:"6px 0 5px", borderBottom:"1px solid #0a2010", marginBottom:7 }}>
                  ✓ Filed &amp; Confirmed — {filed.length} {filed.length===1?"Agency":"Agencies"}
                </div>
                {filed.map((a,i)=><Row key={a.abbr} a={a} isOpen={expanded===`f${i}`} onToggle={()=>toggle(`f${i}`)}/>)}
              </>
            )}
            {notFiled.length>0 && (
              <>
                <div style={{ fontSize:9, color:"#ef4444", textTransform:"uppercase", letterSpacing:"0.15em", fontFamily:"monospace", padding:"16px 0 5px", borderBottom:"1px solid #1a0505", marginBottom:7 }}>
                  ✗ Not Yet Filed — {notFiled.length} {notFiled.length===1?"Agency":"Agencies"}
                </div>
                {notFiled.map((a,i)=><Row key={a.abbr} a={a} isOpen={expanded===`n${i}`} onToggle={()=>toggle(`n${i}`)}/>)}
              </>
            )}
          </>
        )}
        {filtered.length===0 && (
          <div style={{ textAlign:"center", padding:40, color:"#1f2937", fontSize:12 }}>No agencies match your filters.</div>
        )}

        <div style={{ marginTop:18, padding:"11px 14px", background:"#060b14", border:"1px solid #0d1a2d", borderRadius:5, fontSize:10, color:"#374151", lineHeight:1.8 }}>
          <span style={{ color:"#4b5563" }}>⚠ Coverage note:</span> "Not Filed" = no confirmed Federal Register SORN modification notice located as of Mar. 16, 2026.
          Large agencies may have filed under component-level notices not yet surfaced, or be in process.
          EO 14249 applies to <em>all</em> executive agencies — non-CFO Act agencies (CFTC, SEC, FERC, Peace Corps, etc.) are equally required to comply.
          Use Live FR Search for real-time updates.
        </div>
      </div>
    </div>
  );
}
