import fs from "node:fs";
const API = "https://khural.yurta.site/api";
const EMAIL = "adminSup@mail.ru";
const PASSWORD = "StrongPassword123!";
async function login() {
  const r = await fetch(`${API}/auth/login/password`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({email:EMAIL,password:PASSWORD}) });
  const data = await r.json();
  const token = data?.accessToken || data?.token || data?.access_token || data?.data?.accessToken || data?.data?.access_token || data?.data?.token;
  if (!token) throw new Error("No token: " + JSON.stringify(data).slice(0,300));
  return token;
}
function norm(s){return String(s??"").replace(/\s+/g," ").trim().toLowerCase();}
async function loadRows(){
  const files=["deputaty.json","deputaty_vseh_sozyvov.json"]; const rows=[];
  for(const f of files){
    let data;
    if(fs.existsSync(f)) data=JSON.parse(fs.readFileSync(f,"utf8"));
    else { const r=await fetch(`https://khural.yurta.site/persons_info/${f}`); data=await r.json(); fs.writeFileSync(f,JSON.stringify(data)); }
    if(Array.isArray(data)) rows.push(...data);
  }
  return rows;
}
async function main(){
  const token=await login(); console.log("logged in");
  const rows=await loadRows(); console.log("rows",rows.length);
  const persons=await (await fetch(`${API}/persons`)).json();
  const empty=persons.filter(p=>!String(p?.description??"").trim());
  console.log("empty bio count",empty.length);
  for(const p of empty){
    const withBio=rows.filter(r=>norm(r?.IE_NAME)===norm(p.fullName)).find(r=>String(r?.IE_DETAIL_TEXT??"").trim());
    if(!withBio){ console.log("no source for",p.id,p.fullName); continue; }
    const bio=String(withBio.IE_DETAIL_TEXT).trim();
    const reception=String(withBio.IE_PREVIEW_TEXT??"").trim();
    console.log("updating",p.id,p.fullName,"bio len",bio.length);
    const put=await fetch(`${API}/persons/${p.id}`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({description:bio,receptionSchedule:reception||undefined})});
    console.log("  status",put.status, (await put.text()).slice(0,120));
  }
}
main().catch(e=>{console.error(e);process.exit(1);});
