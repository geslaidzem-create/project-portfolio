import React, { useState, useEffect } from 'react';
import {
  Users, Calendar, ClipboardList, AlertCircle,
  FileText, Settings, Download, Plus, Trash2,
  Save, MessageSquare, BookOpen, Star, Sparkles, Upload, Edit2, X, ChevronDown, ChevronUp
} from 'lucide-react';

const TABS = [
  { id: 'forms',        label: 'შესავსები ფორმები',                      icon: ClipboardList },
  { id: 'profile',      label: 'პროფილი',                                icon: Settings },
  { id: 'yearlyPlan',   label: 'წლიური გეგმა',                           icon: ClipboardList },
  { id: 'classHour',    label: 'კლასის საათი',                           icon: Calendar },
  { id: 'class1',       label: 'კლასი 1',                                icon: BookOpen },
  { id: 'class2',       label: 'კლასი 2',                                icon: BookOpen },
  { id: 'workMeetings', label: 'სამუშაო შეხვედრები',                     icon: FileText },
  { id: 'parentMeetings',label: 'მასწავლებლების და მშობლების შეხვედრები', icon: MessageSquare },
  { id: 'aiReport',     label: 'AI ანგარიში',                           icon: Star },
];

const MOTIVATION = [
  { text: "ბავშვებს არ აინტერესებთ რამდენი იცით, სანამ არ გაიგებენ, რამდენად ზრუნავთ მათზე.", author: "ჯონ მაქსველი", insight: "ემოციური კავშირი არის წარმატების საძირკველი." },
  { text: "განათლება არის ყველაზე ძლიერი იარაღი, რომელიც შეგიძლიათ გამოიყენოთ მსოფლიოს შესაცვლელად.", author: "ნელსონ მანდელა", insight: "თქვენი ყოველი გაკვეთილი მომავლის მშენებლობაა." },
  { text: "ის, რასაც ჩვენ ვხედავთ ადამიანებში, არის ის, რასაც ჩვენ ვეძებთ მათში.", author: "ვიქტორ ფრანკლი", insight: "დაინახეთ პოტენციალი იქ, სადაც სხვები პრობლემას ხედავენ." }
];

function storage(key, val) {
  if (val === undefined) return window.storage.get(key);
  return window.storage.set(key, typeof val === 'string' ? val : JSON.stringify(val));
}

function AIReportPanel({ students, classNames, attendance, incidents, workMeetings, parentMeetings, classHours }) {
  const [mode, setMode]           = useState('class'); // 'class' | 'student'
  const [selectedClass, setSelectedClass] = useState('class1');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [report, setReport]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [copied, setCopied]       = useState(false);

  const classStudents = students.filter(s => s.classId === selectedClass);

  const buildClassPrompt = () => {
    const cls = students.filter(s => s.classId === selectedClass);
    const att = Object.values(attendance).filter(a => cls.some(s => s.id === a.studentId));
    const inc = incidents.filter(i => cls.some(s => s.id === i.studentId));
    const pm  = parentMeetings.filter(m => cls.some(s => s.id === m.participants));
    const ch  = classHours.filter(c => c.classId === selectedClass);
    return `შენ ხარ გამოცდილი პედაგოგიური მრჩეველი. შექმენი სრული, პროფესიონალური ანგარიში კლასის შესახებ ქართულ ენაზე.

კლასი: ${classNames[selectedClass]}
მოსწავლეთა რაოდენობა: ${cls.length}

დასწრების სტატისტიკა:
- სულ ჩანაწერი: ${att.length}
- დამსწრე: ${att.filter(a=>a.status==='present').length}
- დაგვიანება: ${att.filter(a=>a.status==='late').length}
- გაცდენა: ${att.filter(a=>a.status==='absent').length}

შემთხვევები (${inc.length}):
${inc.map(i=>`• ${i.date} | ${i.type}: ${i.description||'—'}`).join('\n')||'არ არის'}

კლასის საათები (${ch.length}):
${ch.map(c=>`• ${c.date}: ${c.topic||'—'}`).join('\n')||'არ არის'}

მშობლებთან შეხვედრები: ${parentMeetings.length}

მოსწავლეების დახასიათებები:
${cls.map(s=>`• ${s.name}: ${s.characterization||'—'}`).join('\n')}

გთხოვ შექმენი ანგარიში შემდეგი სტრუქტურით:
## 1. კლასის ზოგადი მიმოხილვა
## 2. დასწრების ანალიზი
## 3. შემთხვევების შეჯამება
## 4. კლასის ძლიერი მხარეები
## 5. გამოწვევები
## 6. რეკომენდაციები მასწავლებლისთვის
## 7. რეკომენდაციები მშობლებთან კომუნიკაციისთვის`;
  };

  const buildStudentPrompt = () => {
    const st  = students.find(s => s.id === selectedStudent);
    if (!st) return '';
    const att = Object.values(attendance).filter(a => a.studentId === st.id);
    const inc = incidents.filter(i => i.studentId === st.id);
    const pm  = parentMeetings.filter(m => m.participants?.includes(st.name));
    return `შენ ხარ გამოცდილი პედაგოგიური მრჩეველი. შექმენი სრული, პროფესიონალური ანგარიში მოსწავლის შესახებ ქართულ ენაზე.

მოსწავლე: ${st.name}
კლასი: ${classNames[st.classId]}
დახასიათება: ${st.characterization||'არ არის'}

დასწრება:
- სულ: ${att.length} | დამსწრე: ${att.filter(a=>a.status==='present').length} | დაგვიანება: ${att.filter(a=>a.status==='late').length} | გაცდენა: ${att.filter(a=>a.status==='absent').length}

შემთხვევები (${inc.length}):
${inc.map(i=>`• ${i.date} | ${i.type}: ${i.description||'—'}\n  ქმედება: ${i.actions||'—'}`).join('\n')||'არ არის'}

შენიშვნები: ${st.notes||'არ არის'}

გთხოვ შექმენი ანგარიში შემდეგი სტრუქტურით:
## 1. მოსწავლის ზოგადი დახასიათება
## 2. დასწრების ანალიზი
## 3. ქცევა და შემთხვევები
## 4. ძლიერი მხარეები
## 5. გასაუმჯობესებელი სფეროები
## 6. რეკომენდაციები მოსწავლისთვის
## 7. რეკომენდაციები მშობლებისთვის`;
  };

  const generate = async () => {
    if (mode==='student' && !selectedStudent) return;
    setLoading(true); setReport('');
    const prompt = mode==='class' ? buildClassPrompt() : buildStudentPrompt();
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1000, messages:[{role:'user',content:prompt}] })
      });
      const d = await r.json();
      setReport(d.content.filter(c=>c.type==='text').map(c=>c.text).join('\n'));
    } catch { setReport('შეცდომა. სცადეთ თავიდან.'); }
    setLoading(false);
  };

  const copy = () => { navigator.clipboard.writeText(report); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  const printReport = () => {
    const w = window.open('','_blank');
    const title = mode==='class' ? classNames[selectedClass] : students.find(s=>s.id===selectedStudent)?.name;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>AI ანგარიში — ${title}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px;line-height:1.8;color:#222}
    h1{color:#7c3aed;border-bottom:3px solid #7c3aed;padding-bottom:8px}
    h2{color:#6d28d9;margin-top:24px}pre{white-space:pre-wrap;font-family:Arial,sans-serif}
    .footer{color:#aaa;font-size:11px;margin-top:40px;border-top:1px solid #eee;padding-top:12px;text-align:center}</style></head>
    <body><h1>AI ანგარიში — ${title}</h1><pre>${report}</pre>
    <div class="footer">შექმნილია: ${new Date().toLocaleDateString('ka-GE')}</div>
    <script>window.onload=()=>window.print();</script></body></html>`);
    w.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-3xl shadow-sm border border-purple-50 p-6">
        <h2 className="text-xl font-bold text-purple-800 mb-5 flex items-center gap-2"><Star className="text-purple-400"/> AI ანგარიში</h2>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-5 p-1 bg-purple-50 rounded-2xl w-fit">
          <button onClick={()=>setMode('class')}
            className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${mode==='class'?'bg-purple-600 text-white shadow-lg':'text-purple-500 hover:text-purple-700'}`}>
            🏫 კლასი
          </button>
          <button onClick={()=>setMode('student')}
            className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${mode==='student'?'bg-purple-600 text-white shadow-lg':'text-purple-500 hover:text-purple-700'}`}>
            👤 მოსწავლე
          </button>
        </div>

        {/* Selectors */}
        <div className="flex flex-wrap gap-4 mb-5">
          <div>
            <label className="text-xs font-medium text-purple-600 mb-1 block">კლასი</label>
            <select value={selectedClass} onChange={e=>{setSelectedClass(e.target.value);setSelectedStudent('');setReport('');}}
              className="bg-purple-50/60 border-none rounded-xl px-4 py-2.5 text-purple-800 font-medium outline-none focus:ring-2 focus:ring-purple-300">
              <option value="class1">{classNames.class1}</option>
              <option value="class2">{classNames.class2}</option>
            </select>
          </div>
          {mode==='student'&&(
            <div>
              <label className="text-xs font-medium text-purple-600 mb-1 block">მოსწავლე</label>
              <select value={selectedStudent} onChange={e=>{setSelectedStudent(e.target.value);setReport('');}}
                className="bg-purple-50/60 border-none rounded-xl px-4 py-2.5 text-purple-800 font-medium outline-none focus:ring-2 focus:ring-purple-300 min-w-[200px]">
                <option value="">— აირჩიეთ მოსწავლე —</option>
                {classStudents.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <button onClick={generate} disabled={loading||(mode==='student'&&!selectedStudent)}
          className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-bold rounded-2xl hover:from-purple-700 hover:to-indigo-600 shadow-xl shadow-purple-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base">
          {loading?(<><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"/>გენერირება...</>)
            :(<><Sparkles size={20}/>ანგარიშის გენერირება</>)}
        </button>
      </div>

      {/* Result */}
      {(report||loading)&&(
        <div className="bg-white rounded-3xl shadow-sm border border-purple-50 overflow-hidden">
          <div className="p-5 bg-purple-50/50 border-b flex justify-between items-center">
            <h3 className="font-bold text-purple-800">
              {mode==='class'?`${classNames[selectedClass]} — შედეგი`:students.find(s=>s.id===selectedStudent)?.name+' — შედეგი'}
            </h3>
            {report&&!loading&&(
              <div className="flex gap-2">
                <button onClick={copy} className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${copied?'bg-green-500 text-white':'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}>
                  {copied?'✅ კოპირდა':'📋 კოპირება'}
                </button>
                <button onClick={printReport} className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-all">
                  <Download size={16}/> PDF
                </button>
              </div>
            )}
          </div>
          <div className="p-6">
            {loading?(
              <div className="flex flex-col items-center py-16 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"/>
                <p className="text-purple-500 font-medium">AI ანგარიშს ამზადებს...</p>
              </div>
            ):(
              <div className="prose max-w-none">
                {report.split('\n').map((line,i)=>{
                  if(line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-purple-800 mt-6 mb-2 flex items-center gap-2"><span className="w-1 h-6 bg-purple-400 rounded-full inline-block"/>{line.replace('## ','')}</h2>;
                  if(line.startsWith('# '))  return <h1 key={i} className="text-xl font-bold text-purple-900 mb-4">{line.replace('# ','')}</h1>;
                  if(line.startsWith('• ')||line.startsWith('- ')) return <p key={i} className="text-gray-700 ml-4 mb-1">{'• '+line.slice(2)}</p>;
                  if(line.trim()==='') return <div key={i} className="h-2"/>;
                  return <p key={i} className="text-gray-700 mb-2 leading-relaxed">{line}</p>;
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MentorApp() {
  const [activeTab, setActiveTab]           = useState('forms');
  const [students, setStudents]             = useState([]);
  const [classNames, setClassNames]         = useState({ class1: 'კლასი 1', class2: 'კლასი 2' });
  const [editClassName, setEditClassName]   = useState(null);
  const [attendance, setAttendance]         = useState({});
  const [dateMap, setDateMap]               = useState({ class1: new Date().toISOString().split('T')[0], class2: new Date().toISOString().split('T')[0] });
  const [incidents, setIncidents]           = useState([]);
  const [workMeetings, setWorkMeetings]     = useState([]);
  const [parentMeetings, setParentMeetings] = useState([]);
  const [classHours, setClassHours]         = useState([]);
  const [profile, setProfile]               = useState({ fullName:'', role:'', school:'', subjects:'', bio:'' });
  const [yearlyPlan, setYearlyPlan]         = useState([]);
  const [portfolioTitle, setPortfolioTitle] = useState('დამრიგებლის პორტფოლიო');
  const [editTitle, setEditTitle]           = useState(false);
  const [inspiration, setInspiration]       = useState({ text: '', author: '' });
  const [editInsp, setEditInsp]             = useState(false);
  const [aiReport, setAiReport]             = useState('');
  const [showReport, setShowReport]         = useState(false);
  const [generating, setGenerating]         = useState(false);
  const [expanded, setExpanded]             = useState({});
  const [editPlan, setEditPlan]             = useState(null);
  const [editWM, setEditWM]                 = useState(null);
  const [editPM, setEditPM]                 = useState(null);
  const [editCH, setEditCH]                 = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const keys = ['students','attendance','incidents','workMeetings','parentMeetings','profile','yearlyPlan','classNames','portfolioTitle','inspiration','classHours'];
        const results = await Promise.all(keys.map(k => window.storage.get(k).catch(() => null)));
        const [s,a,inc,wm,pm,pr,yp,cn,pt,insp,ch] = results;
        if (s)    setStudents(JSON.parse(s.value)); else initStudents();
        if (a)    setAttendance(JSON.parse(a.value));
        if (inc)  setIncidents(JSON.parse(inc.value));
        if (wm)   setWorkMeetings(JSON.parse(wm.value));
        if (pm)   setParentMeetings(JSON.parse(pm.value));
        if (pr)   setProfile(JSON.parse(pr.value));
        if (yp)   setYearlyPlan(JSON.parse(yp.value));
        if (cn)   setClassNames(JSON.parse(cn.value));
        if (pt)   setPortfolioTitle(pt.value);
        if (insp) setInspiration(JSON.parse(insp.value));
        if (ch)   setClassHours(JSON.parse(ch.value));
      } catch { initStudents(); }
    })();
  }, []);

  function initStudents() {
    const s = [];
    ['class1','class2'].forEach(c => {
      for (let i=1;i<=25;i++) s.push({ id:`${c}-${i}`, name:`მოსწავლე ${i}`, classId:c, characterization:'', notes:'' });
    });
    setStudents(s); storage('students', s);
  }

  const save = (key, val) => storage(key, val);
  const toggleExpand = (sid, section) => setExpanded(e => ({ ...e, [`${sid}-${section}`]: !e[`${sid}-${section}`] }));
  const isExpanded = (sid, section) => !!expanded[`${sid}-${section}`];
  const quote = MOTIVATION[new Date().getDate() % 3];

  // Students
  const addStudent = classId => {
    const n = { id:`${classId}-${Date.now()}`, name:`ახალი მოსწავლე`, classId, characterization:'', notes:'' };
    const u = [...students, n]; setStudents(u); save('students', u);
  };
  const updStudent = (id, field, val) => { const u = students.map(s => s.id===id ? {...s,[field]:val} : s); setStudents(u); save('students', u); };

  // Attendance
  const markAtt = (sid, status, classId) => {
    const date = dateMap[classId];
    const u = { ...attendance, [`${sid}-${date}`]: { studentId:sid, date, status } };
    setAttendance(u); save('attendance', u);
  };
  const attStatus = (sid, classId) => attendance[`${sid}-${dateMap[classId]}`]?.status;

  // Incidents
  const addIncident = sid => {
    const date = dateMap[students.find(s=>s.id===sid)?.classId] || new Date().toISOString().split('T')[0];
    const u = [...incidents, { id:Date.now(), studentId:sid, date, type:'ქცევითი', description:'', actions:'' }];
    setIncidents(u); save('incidents', u);
    setExpanded(e => ({ ...e, [`${sid}-incidents`]: true }));
  };
  const updIncident = (id, field, val) => { const u=incidents.map(i=>i.id===id?{...i,[field]:val}:i); setIncidents(u); };
  const saveIncidents = () => save('incidents', incidents);
  const delIncident = id => { const u=incidents.filter(i=>i.id!==id); setIncidents(u); save('incidents',u); };

  // Work Meetings
  const addWM = () => { const u=[...workMeetings,{id:Date.now(),date:new Date().toISOString().split('T')[0],time:'',topic:'',participants:'',notes:''}]; setWorkMeetings(u); save('workMeetings',u); setEditWM(u[u.length-1].id); };
  const updWM = (id,f,v) => { const u=workMeetings.map(m=>m.id===id?{...m,[f]:v}:m); setWorkMeetings(u); };
  const saveWM = () => { save('workMeetings',workMeetings); setEditWM(null); };
  const delWM = id => { const u=workMeetings.filter(m=>m.id!==id); setWorkMeetings(u); save('workMeetings',u); };

  // Parent Meetings
  const addPM = () => { const u=[...parentMeetings,{id:Date.now(),date:new Date().toISOString().split('T')[0],time:'',topic:'',participants:'',result:'',notes:''}]; setParentMeetings(u); save('parentMeetings',u); setEditPM(u[u.length-1].id); };
  const updPM = (id,f,v) => { const u=parentMeetings.map(m=>m.id===id?{...m,[f]:v}:m); setParentMeetings(u); };
  const savePM = () => { save('parentMeetings',parentMeetings); setEditPM(null); };
  const delPM = id => { const u=parentMeetings.filter(m=>m.id!==id); setParentMeetings(u); save('parentMeetings',u); };

  // Class Hours
  const addCH = () => { const u=[...classHours,{id:Date.now(),date:new Date().toISOString().split('T')[0],classId:'class1',topic:'',activities:'',notes:''}]; setClassHours(u); save('classHours',u); setEditCH(u[u.length-1].id); };
  const updCH = (id,f,v) => { const u=classHours.map(c=>c.id===id?{...c,[f]:v}:c); setClassHours(u); };
  const saveCH = () => { save('classHours',classHours); setEditCH(null); };
  const delCH = id => { const u=classHours.filter(c=>c.id!==id); setClassHours(u); save('classHours',u); };

  // Yearly Plan
  const addPlan = () => { const u=[...yearlyPlan,{id:Date.now(),month:'',goals:'',activities:'',notes:''}]; setYearlyPlan(u); save('yearlyPlan',u); setEditPlan(u[u.length-1].id); };
  const updPlan = (id,f,v) => { const u=yearlyPlan.map(p=>p.id===id?{...p,[f]:v}:p); setYearlyPlan(u); };
  const savePlan = () => { save('yearlyPlan',yearlyPlan); setEditPlan(null); };
  const delPlan = id => { const u=yearlyPlan.filter(p=>p.id!==id); setYearlyPlan(u); save('yearlyPlan',u); };

  // AI Report
  const genReport = async (classId) => {
    setGenerating(true); setShowReport(true); setAiReport('იტვირთება...');
    const cls = students.filter(s=>s.classId===classId);
    const inc = incidents.filter(i=>cls.some(s=>s.id===i.studentId));
    const att = Object.values(attendance).filter(a=>cls.some(s=>s.id===a.studentId));
    const prompt = `შექმენი დეტალური პედაგოგიური ანგარიში კლასზე ქართულ ენაზე.\n\nკლასი: ${classNames[classId]}\nმოსწავლეები: ${cls.length}\nშემთხვევები: ${inc.length}\nდასწრების ჩანაწერები: ${att.length}\nდამსწრე: ${att.filter(a=>a.status==='present').length}\nგაცდენა: ${att.filter(a=>a.status==='absent').length}\n\nგთხოვ შექმენი: 1. ზოგადი მიმოხილვა 2. დასწრების ანალიზი 3. შემთხვევების მიმოხილვა 4. რეკომენდაციები`;
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:prompt}]})});
      const d = await r.json();
      setAiReport(d.content.filter(c=>c.type==='text').map(c=>c.text).join('\n'));
    } catch { setAiReport('შეცდომა. სცადეთ თავიდან.'); }
    setGenerating(false);
  };

  // Export PDF
  const exportPDF = () => {
    const w = window.open('', '_blank');
    const attByStudent = (sid) => {
      const recs = Object.values(attendance).filter(a => a.studentId === sid);
      return `დამსწრე: ${recs.filter(a=>a.status==='present').length} | დაგვიანება: ${recs.filter(a=>a.status==='late').length} | გაცდენა: ${recs.filter(a=>a.status==='absent').length}`;
    };
    const renderStudents = (classId) => students.filter(s=>s.classId===classId).map(s => {
      const inc = incidents.filter(i=>i.studentId===s.id);
      return `<tr><td colspan="3" style="background:#f3f0ff;font-weight:bold;padding:8px 12px">${s.name}</td></tr>
        <tr><td style="padding:6px 12px;color:#555">დახასიათება: ${s.characterization||'—'}</td><td style="padding:6px 12px;color:#555">${attByStudent(s.id)}</td><td style="padding:6px 12px;color:#555">შემთხვევები: ${inc.length}</td></tr>
        ${inc.map(i=>`<tr><td colspan="3" style="padding:4px 20px;color:#888;font-size:12px">• ${i.date} | ${i.type} — ${i.description||'—'}</td></tr>`).join('')}`;
    }).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${portfolioTitle}</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:13px;color:#222;padding:30px}
    h1{color:#7c3aed;font-size:22px;border-bottom:3px solid #7c3aed;padding-bottom:8px;margin-bottom:20px}
    h2{color:#6d28d9;font-size:16px;margin:24px 0 10px;border-left:4px solid #7c3aed;padding-left:10px}
    table{width:100%;border-collapse:collapse;margin-bottom:12px}td,th{border:1px solid #e0d7ff;padding:7px 10px;vertical-align:top}
    th{background:#7c3aed;color:#fff;font-size:12px}.section{margin-bottom:28px;padding:16px;border:1px solid #e0d7ff;border-radius:10px}
    .footer{text-align:center;color:#aaa;font-size:11px;margin-top:40px;border-top:1px solid #eee;padding-top:12px}</style></head><body>
    <h1>📋 ${portfolioTitle}</h1>
    <div class="section"><h2>მასწავლებლის პროფილი</h2>
    <table><tr><th>სახელი</th><th>როლი</th><th>სკოლა</th><th>საგნები</th></tr>
    <tr><td>${profile.fullName||'—'}</td><td>${profile.role||'—'}</td><td>${profile.school||'—'}</td><td>${profile.subjects||'—'}</td></tr></table>
    ${profile.bio?`<p style="color:#555;margin-top:8px"><b>პედაგოგიური ხედვა:</b> ${profile.bio}</p>`:''}
    ${inspiration.text?`<p style="margin-top:10px;font-style:italic;color:#7c3aed">"${inspiration.text}"${inspiration.author?' — '+inspiration.author:''}</p>`:''}
    </div>
    <div class="section"><h2>წლიური გეგმა</h2>
    ${yearlyPlan.length===0?'<p style="color:#aaa">ჩანაწერები არ არის</p>':''}
    <table>${yearlyPlan.length>0?`<tr><th>თვე/პერიოდი</th><th>მიზნები</th><th>აქტივობები</th><th>შენიშვნები</th></tr>${yearlyPlan.map(p=>`<tr><td>${p.month||'—'}</td><td>${p.goals||'—'}</td><td>${p.activities||'—'}</td><td>${p.notes||'—'}</td></tr>`).join('')}`:''}</table></div>
    <div class="section"><h2>${classNames.class1} — მოსწავლეები</h2>
    <table><tr><th>მოსწავლე</th><th>დასწრება</th><th>შემთხვევები</th></tr>${renderStudents('class1')}</table></div>
    <div class="section"><h2>${classNames.class2} — მოსწავლეები</h2>
    <table><tr><th>მოსწავლე</th><th>დასწრება</th><th>შემთხვევები</th></tr>${renderStudents('class2')}</table></div>
    <div class="section"><h2>კლასის საათი</h2>
    ${classHours.length===0?'<p style="color:#aaa">ჩანაწერები არ არის</p>':''}
    <table>${classHours.length>0?`<tr><th>თარიღი</th><th>კლასი</th><th>თემა</th><th>აქტივობები</th><th>შენიშვნები</th></tr>${classHours.map(c=>`<tr><td>${c.date||'—'}</td><td>${classNames[c.classId]||c.classId}</td><td>${c.topic||'—'}</td><td>${c.activities||'—'}</td><td>${c.notes||'—'}</td></tr>`).join('')}`:''}</table></div>
    <div class="section"><h2>სამუშაო შეხვედრები</h2>
    ${workMeetings.length===0?'<p style="color:#aaa">ჩანაწერები არ არის</p>':''}
    <table>${workMeetings.length>0?`<tr><th>თარიღი</th><th>დრო</th><th>თემა</th><th>მონაწილეები</th><th>შენიშვნები</th></tr>${workMeetings.map(m=>`<tr><td>${m.date||'—'}</td><td>${m.time||'—'}</td><td>${m.topic||'—'}</td><td>${m.participants||'—'}</td><td>${m.notes||'—'}</td></tr>`).join('')}`:''}</table></div>
    <div class="section"><h2>მასწავლებლების და მშობლების შეხვედრები</h2>
    ${parentMeetings.length===0?'<p style="color:#aaa">ჩანაწერები არ არის</p>':''}
    <table>${parentMeetings.length>0?`<tr><th>თარიღი</th><th>დრო</th><th>თემა</th><th>მონაწილეები</th><th>შედეგი</th><th>შენიშვნები</th></tr>${parentMeetings.map(m=>`<tr><td>${m.date||'—'}</td><td>${m.time||'—'}</td><td>${m.topic||'—'}</td><td>${m.participants||'—'}</td><td>${m.result||'—'}</td><td>${m.notes||'—'}</td></tr>`).join('')}`:''}</table></div>
    <div class="footer">შექმნილია: ${new Date().toLocaleDateString('ka-GE')} ${new Date().toLocaleTimeString('ka-GE')}</div>
    <script>window.onload=()=>window.print();</script></body></html>`;
    w.document.write(html); w.document.close();
  };

  // Export/Import
  const exportData = () => {
    const all={students,attendance,incidents,workMeetings,parentMeetings,profile,yearlyPlan,classNames,portfolioTitle,inspiration,classHours};
    const uri='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(all,null,2));
    const a=document.createElement('a'); a.href=uri; a.download=`mentor_backup_${new Date().toLocaleDateString()}.json`; a.click();
  };
  const importData = e => {
    const fr=new FileReader(); fr.readAsText(e.target.files[0],'UTF-8');
    fr.onload=ev=>{
      try {
        const j=JSON.parse(ev.target.result);
        setStudents(j.students||[]); setAttendance(j.attendance||{}); setIncidents(j.incidents||[]);
        setWorkMeetings(j.workMeetings||[]); setParentMeetings(j.parentMeetings||[]);
        setProfile(j.profile||{}); setYearlyPlan(j.yearlyPlan||[]);
        setClassNames(j.classNames||{class1:'კლასი 1',class2:'კლასი 2'});
        setPortfolioTitle(j.portfolioTitle||'დამრიგებლის პორტფოლიო');
        setInspiration(j.inspiration||{text:'',author:''});
        setClassHours(j.classHours||[]);
        ['students','attendance','incidents','workMeetings','parentMeetings','profile','yearlyPlan','classNames','classHours'].forEach(k=>save(k,j[k]));
        save('portfolioTitle',j.portfolioTitle); save('inspiration',j.inspiration);
        alert('ჩაიტვირთა!');
      } catch { alert('ფაილი არასწორია.'); }
    };
  };

  // Meeting Card
  const MeetingCard = ({ item, isEdit, onEdit, onSave, onCancel, onDel, onUpd, extraFields=[] }) => (
    <div className="border-2 border-purple-100 rounded-2xl p-4 hover:border-purple-200 transition-all">
      <div className="flex justify-between items-start mb-3">
        <div className="grid grid-cols-2 gap-3 flex-1">
          <div><label className="text-xs font-medium text-purple-600 mb-1 block">თარიღი</label>
            <input type="date" value={item.date} onChange={e=>onUpd('date',e.target.value)} disabled={!isEdit}
              className={`w-full p-2 rounded-xl text-sm outline-none ${isEdit?'bg-purple-50/60 focus:ring-2 focus:ring-purple-300':'bg-gray-50'}`}/></div>
          <div><label className="text-xs font-medium text-purple-600 mb-1 block">დრო</label>
            <input type="time" value={item.time} onChange={e=>onUpd('time',e.target.value)} disabled={!isEdit}
              className={`w-full p-2 rounded-xl text-sm outline-none ${isEdit?'bg-purple-50/60 focus:ring-2 focus:ring-purple-300':'bg-gray-50'}`}/></div>
        </div>
        <div className="flex gap-2 ml-3">
          {isEdit?(<><button onClick={onSave} className="text-green-600 hover:bg-green-50 p-2 rounded-lg"><Save size={18}/></button><button onClick={onCancel} className="text-gray-500 hover:bg-gray-50 p-2 rounded-lg"><X size={18}/></button></>)
            :(<button onClick={onEdit} className="text-purple-600 hover:bg-purple-50 p-2 rounded-lg"><Edit2 size={18}/></button>)}
          <button onClick={onDel} className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg"><Trash2 size={18}/></button>
        </div>
      </div>
      {[['topic','თემა','შეხვედრის თემა...'],['participants','მონაწილეები','სახელები...'],...extraFields,['notes','შენიშვნები','დეტალები...',3]].map(([f,lbl,ph,rows=2])=>(
        <div key={f} className="mb-3"><label className="text-xs font-medium text-purple-600 mb-1 block">{lbl}</label>
          <textarea placeholder={ph} value={item[f]||''} rows={rows} onChange={e=>onUpd(f,e.target.value)} disabled={!isEdit}
            className={`w-full p-3 rounded-xl text-sm border-none outline-none resize-none ${isEdit?'bg-purple-50/60 focus:ring-2 focus:ring-purple-300':'bg-gray-50'}`}/></div>
      ))}
    </div>
  );

  // Class Panel
  const ClassPanel = ({ classId }) => {
    const cls = students.filter(s=>s.classId===classId);
    const date = dateMap[classId];
    const pres = Object.values(attendance).filter(a=>a.date===date&&a.status==='present'&&a.studentId.startsWith(classId)).length;
    const abs  = Object.values(attendance).filter(a=>a.date===date&&a.status==='absent'&&a.studentId.startsWith(classId)).length;
    const late = Object.values(attendance).filter(a=>a.date===date&&a.status==='late'&&a.studentId.startsWith(classId)).length;
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-3xl shadow-sm border border-purple-50 p-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              {editClassName===classId?(
                <div className="flex items-center gap-2">
                  <input value={classNames[classId]} onChange={e=>setClassNames({...classNames,[classId]:e.target.value})}
                    onBlur={()=>{save('classNames',{...classNames});setEditClassName(null);}}
                    onKeyPress={e=>{if(e.key==='Enter'){save('classNames',{...classNames});setEditClassName(null);}}}
                    className="text-xl font-bold text-purple-800 bg-white px-3 py-2 rounded-lg border-2 border-purple-300 outline-none" autoFocus/>
                  <button onClick={()=>{save('classNames',{...classNames});setEditClassName(null);}} className="text-green-600 p-2 hover:bg-green-50 rounded-lg"><Save size={18}/></button>
                </div>
              ):(
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-purple-800">{classNames[classId]}</h2>
                  <button onClick={()=>setEditClassName(classId)} className="text-purple-400 p-1 hover:text-purple-600"><Edit2 size={16}/></button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <input type="date" value={date} onChange={e=>setDateMap(d=>({...d,[classId]:e.target.value}))}
                className="border-purple-200 rounded-xl p-2 outline-none focus:ring-2 focus:ring-purple-400 text-purple-700"/>
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-xl text-sm font-bold">✅ {pres}</span>
              <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-xl text-sm font-bold">⏰ {late}</span>
              <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-xl text-sm font-bold">❌ {abs}</span>
              <button onClick={()=>genReport(classId)} className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 text-sm shadow-lg transition-all">
                <Star size={16}/> AI ანგარიში
              </button>
              <button onClick={()=>addStudent(classId)} className="flex items-center gap-1 px-3 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 text-sm shadow-lg transition-all">
                <Plus size={16}/> მოსწავლე
              </button>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-purple-50 overflow-hidden divide-y divide-purple-50">
          {cls.map(st => {
            const studInc = incidents.filter(i=>i.studentId===st.id);
            const showAtt = isExpanded(st.id,'attendance');
            const showInc = isExpanded(st.id,'incidents');
            return (
              <div key={st.id} className="p-5">
                <div className="flex flex-wrap gap-3 items-start mb-3">
                  <input value={st.name} onChange={e=>updStudent(st.id,'name',e.target.value)} onBlur={()=>save('students',students)}
                    className="text-base font-semibold text-slate-700 bg-transparent border-b-2 border-transparent hover:border-purple-200 focus:border-purple-400 outline-none flex-shrink-0"/>
                  <textarea placeholder="დახასიათება..." value={st.characterization||''} rows={1}
                    onChange={e=>updStudent(st.id,'characterization',e.target.value)} onBlur={()=>save('students',students)}
                    className="flex-1 min-w-[160px] p-2 bg-purple-50/50 rounded-xl border-none outline-none focus:ring-2 focus:ring-purple-300 text-sm resize-none"/>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={()=>toggleExpand(st.id,'attendance')}
                    className={`flex items-center gap-1 px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${showAtt?'bg-purple-500 text-white':'bg-purple-50 text-purple-500 hover:bg-purple-100'}`}>
                    <Calendar size={14}/> დასწრება {showAtt?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
                  </button>
                  <button onClick={()=>toggleExpand(st.id,'incidents')}
                    className={`flex items-center gap-1 px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${showInc?'bg-rose-400 text-white':'bg-rose-50 text-rose-400 hover:bg-rose-100'}`}>
                    <AlertCircle size={14}/> შემთხვევები ({studInc.length}) {showInc?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
                  </button>
                </div>
                {showAtt && (
                  <div className="mt-3 p-4 bg-purple-50/60 rounded-2xl flex flex-wrap gap-2 items-center">
                    <span className="text-sm font-medium text-purple-700 mr-2">{date}</span>
                    {[['present','✅ დასწრება','bg-purple-500'],['late','⏰ დაგვიანება','bg-yellow-400'],['absent','❌ გაცდენა','bg-rose-400']].map(([s,label,col])=>(
                      <button key={s} onClick={()=>markAtt(st.id,s,classId)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all ${attStatus(st.id,classId)===s?col+' shadow-md opacity-100':col+' opacity-30 hover:opacity-70'}`}>
                        {label}
                      </button>
                    ))}
                    {attStatus(st.id,classId)&&<button onClick={()=>markAtt(st.id,null,classId)} className="text-xs text-purple-400 hover:text-purple-600 underline">გასუფთავება</button>}
                  </div>
                )}
                {showInc && (
                  <div className="mt-3 space-y-3">
                    {studInc.map(inc=>(
                      <div key={inc.id} className="p-4 bg-rose-50/60 rounded-2xl space-y-2 border border-rose-100">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <select value={inc.type} onChange={e=>updIncident(inc.id,'type',e.target.value)} onBlur={saveIncidents}
                            className="bg-white border border-rose-200 rounded-xl px-3 py-1.5 text-sm text-rose-700 outline-none">
                            <option>ქცევითი</option><option>აკადემიური</option><option>დისციპლინური</option><option>სხვა</option>
                          </select>
                          <input type="date" value={inc.date} onChange={e=>updIncident(inc.id,'date',e.target.value)} onBlur={saveIncidents}
                            className="border border-rose-200 rounded-xl px-3 py-1.5 text-sm text-rose-700 outline-none bg-white"/>
                          <button onClick={()=>delIncident(inc.id)} className="text-rose-400 hover:text-rose-600 p-1 hover:bg-rose-100 rounded-lg"><Trash2 size={16}/></button>
                        </div>
                        <textarea placeholder="აღწერა..." value={inc.description} rows={2}
                          onChange={e=>updIncident(inc.id,'description',e.target.value)} onBlur={saveIncidents}
                          className="w-full p-2 bg-white rounded-xl border border-rose-100 outline-none focus:ring-2 focus:ring-rose-300 text-sm resize-none"/>
                        <textarea placeholder="განხორციელებული ქმედებები..." value={inc.actions} rows={2}
                          onChange={e=>updIncident(inc.id,'actions',e.target.value)} onBlur={saveIncidents}
                          className="w-full p-2 bg-white rounded-xl border border-rose-100 outline-none focus:ring-2 focus:ring-rose-300 text-sm resize-none"/>
                      </div>
                    ))}
                    <button onClick={()=>addIncident(st.id)}
                      className="w-full border-2 border-dashed border-rose-200 rounded-2xl p-2 text-rose-500 hover:bg-rose-50 text-sm flex items-center justify-center gap-1 transition-all">
                      <Plus size={16}/> ახალი შემთხვევა
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fafaff] p-4 md:p-8">

      {/* Banner */}
      <div className="max-w-6xl mx-auto mb-8 bg-gradient-to-r from-purple-500 to-indigo-400 rounded-[2rem] p-8 text-white shadow-xl shadow-purple-100">
        <div className="flex items-center gap-3 mb-4">
          {editTitle?(
            <div className="flex items-center gap-3">
              <input value={portfolioTitle} onChange={e=>setPortfolioTitle(e.target.value)}
                onBlur={()=>{save('portfolioTitle',portfolioTitle);setEditTitle(false);}}
                onKeyPress={e=>{if(e.key==='Enter'){save('portfolioTitle',portfolioTitle);setEditTitle(false);}}}
                className="text-3xl font-bold bg-white/20 text-white px-4 py-2 rounded-xl border-2 border-white/40 outline-none" autoFocus/>
              <button onClick={()=>{save('portfolioTitle',portfolioTitle);setEditTitle(false);}} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg"><Save size={20}/></button>
            </div>
          ):(
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{portfolioTitle}</h1>
              <button onClick={()=>setEditTitle(true)} className="text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-lg"><Edit2 size={18}/></button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mb-3 text-purple-100 uppercase text-xs font-bold tracking-widest"><Sparkles size={16}/> ჩემი ინსპირაცია</div>
        {editInsp?(
          <div className="space-y-2">
            <textarea placeholder="ჩაწერეთ თქვენი ინსპირაციული ციტატა..." value={inspiration.text}
              onChange={e=>setInspiration(i=>({...i,text:e.target.value}))} rows={3}
              className="w-full bg-white/20 text-white placeholder-white/50 rounded-2xl px-4 py-3 outline-none border-2 border-white/30 focus:border-white/60 resize-none text-lg font-light italic"/>
            <input placeholder="ავტორი (სურვილისამებრ)..." value={inspiration.author}
              onChange={e=>setInspiration(i=>({...i,author:e.target.value}))}
              className="w-full bg-white/20 text-white placeholder-white/50 rounded-xl px-4 py-2 outline-none border-2 border-white/30 focus:border-white/60 text-sm"/>
            <button onClick={()=>{save('inspiration',inspiration);setEditInsp(false);}}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white text-sm font-medium transition-all">
              <Save size={16}/> შენახვა
            </button>
          </div>
        ):(
          <div className="group relative cursor-pointer" onClick={()=>setEditInsp(true)}>
            {inspiration.text?(
              <>
                <p className="text-xl font-light italic mb-1 leading-relaxed">"{inspiration.text}"</p>
                {inspiration.author&&<p className="text-sm opacity-80">— {inspiration.author}</p>}
              </>
            ):(
              <p className="text-white/50 italic text-lg border-2 border-dashed border-white/30 rounded-2xl px-4 py-3 hover:border-white/50 transition-all">
                ✏️ დააჭირეთ და ჩაწერეთ თქვენი ინსპირაცია...
              </p>
            )}
            {inspiration.text&&<span className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-all bg-white/20 rounded-lg p-1"><Edit2 size={14} className="text-white"/></span>}
          </div>
        )}
      </div>

      {/* AI Modal */}
      {showReport&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b bg-purple-50/60 flex justify-between items-center">
              <h2 className="text-xl font-bold text-purple-800">AI ანგარიში</h2>
              <button onClick={()=>setShowReport(false)} className="text-purple-500 hover:bg-purple-100 p-2 rounded-full"><X size={22}/></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {generating?(<div className="flex flex-col items-center py-12 gap-4"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"/><p className="text-purple-600">AI ანგარიშის გენერირება...</p></div>)
                :<pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">{aiReport}</pre>}
            </div>
            <div className="p-4 border-t bg-purple-50/40 flex justify-end gap-3">
              <button onClick={()=>setShowReport(false)} className="px-5 py-2 border-2 border-purple-200 rounded-xl text-purple-600 hover:bg-purple-50">დახურვა</button>
              <button onClick={()=>{navigator.clipboard.writeText(aiReport);alert('კოპირდა!');}} disabled={generating}
                className="px-5 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-lg">კოპირება</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-6xl mx-auto mb-8 flex overflow-x-auto gap-2 p-1 bg-white rounded-2xl shadow-sm border border-purple-50">
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab===t.id?'bg-purple-500 text-white shadow-lg':'text-purple-400 hover:bg-purple-50'}`}>
            <t.icon size={18}/><span className="font-medium text-sm">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto">

        {/* შესავსები ფორმები */}
        {activeTab==='forms'&&(
          <div className="bg-white rounded-3xl shadow-sm border border-purple-50 overflow-hidden">
            <div className="p-6 bg-purple-50/50 border-b">
              <h2 className="text-xl font-bold text-purple-800">შესავსები ფორმები</h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <a href="https://docs.google.com/forms/d/e/1FAIpQLSf9NeTQOnMRTORkAIG7YKUhflXqA1-7sPE619hwfKB3WEX_Jg/viewform?mibextid=xfxF2i"
                target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-4 bg-purple-50 hover:bg-purple-100 rounded-3xl p-10 transition-all group">
                <div className="text-5xl">📋</div>
                <h3 className="text-lg font-bold text-purple-800">ყოველდღიური ანგარიში</h3>
                <span className="text-purple-500 group-hover:text-purple-700 font-semibold">გახსნა ↗</span>
              </a>
              <a href="https://docs.google.com/forms/d/e/1FAIpQLSc3n4dNXwbdEjf3jp9tKuf48_yuDaCRu5sz3AVgs1YEkM4TlQ/viewform"
                target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-4 bg-indigo-50 hover:bg-indigo-100 rounded-3xl p-10 transition-all group">
                <div className="text-5xl">📄</div>
                <h3 className="text-lg font-bold text-indigo-800">პარასკევის ანგარიში</h3>
                <span className="text-indigo-500 group-hover:text-indigo-700 font-semibold">გახსნა ↗</span>
              </a>
            </div>
          </div>
        )}

        {/* Profile */}
        {activeTab==='profile'&&(
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-purple-50">
              <h2 className="text-xl font-bold text-purple-800 mb-6 flex items-center gap-2"><Settings className="text-purple-400"/> მასწავლებლის პროფილი</h2>
              <div className="space-y-4">
                {[['fullName','სახელი და გვარი'],['role','როლი'],['school','სკოლა'],['subjects','საგნები']].map(([f,ph])=>(
                  <input key={f} placeholder={ph} value={profile[f]||''} onChange={e=>setProfile({...profile,[f]:e.target.value})} onBlur={()=>save('profile',profile)}
                    className="w-full p-4 bg-purple-50/50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-purple-300"/>
                ))}
                <textarea placeholder="პედაგოგიური ხედვა..." rows={4} value={profile.bio||''} onChange={e=>setProfile({...profile,bio:e.target.value})} onBlur={()=>save('profile',profile)}
                  className="w-full p-4 bg-purple-50/50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-purple-300"/>
                <button onClick={exportPDF} className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-100 flex items-center justify-center gap-2">
                  <Download size={20}/> მთლიანი პორტფოლიო — PDF
                </button>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-dashed border-purple-200">
              <h2 className="text-lg font-bold text-purple-800 mb-3">მოწყობილობებს შორის სინქრონი</h2>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={exportData} className="flex items-center justify-center gap-2 p-4 border-2 border-purple-100 rounded-2xl text-purple-600 hover:bg-purple-50"><Download size={18}/> შენახვა</button>
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-purple-100 rounded-2xl text-purple-600 hover:bg-purple-50 cursor-pointer">
                  <Upload size={18}/> ჩატვირთვა<input type="file" className="hidden" onChange={importData} accept=".json"/>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Yearly Plan */}
        {activeTab==='yearlyPlan'&&(
          <div className="bg-white rounded-3xl shadow-sm border border-purple-50 overflow-hidden">
            <div className="p-6 bg-purple-50/50 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-purple-800">წლიური გეგმა</h2>
              <button onClick={addPlan} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-100"><Plus size={18}/>დამატება</button>
            </div>
            <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
              {yearlyPlan.map(item=>{
                const isEdit=editPlan===item.id;
                return(
                  <div key={item.id} className="border-2 border-purple-100 rounded-2xl p-4 hover:border-purple-200 transition-all">
                    <div className="flex justify-between items-center mb-3">
                      <input placeholder="თვე/პერიოდი..." value={item.month} disabled={!isEdit} onChange={e=>updPlan(item.id,'month',e.target.value)}
                        className={`text-lg font-medium flex-1 outline-none rounded-lg ${isEdit?'bg-purple-50/50 p-2':'bg-transparent'}`}/>
                      <div className="flex gap-2 ml-3">
                        {isEdit?(<><button onClick={savePlan} className="text-green-600 hover:bg-green-50 p-2 rounded-lg"><Save size={18}/></button><button onClick={()=>setEditPlan(null)} className="text-gray-500 hover:bg-gray-50 p-2 rounded-lg"><X size={18}/></button></>)
                          :(<button onClick={()=>setEditPlan(item.id)} className="text-purple-600 hover:bg-purple-50 p-2 rounded-lg"><Edit2 size={18}/></button>)}
                        <button onClick={()=>delPlan(item.id)} className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg"><Trash2 size={18}/></button>
                      </div>
                    </div>
                    {[['goals','მიზნები','ძირითადი მიზნები...'],['activities','აქტივობები','ღონისძიებები...'],['notes','შენიშვნები','დამატებითი...']].map(([f,lbl,ph])=>(
                      <div key={f} className="mb-3">
                        <label className="text-xs font-medium text-purple-600 mb-1 block">{lbl}</label>
                        <textarea placeholder={ph} value={item[f]||''} rows={2} disabled={!isEdit} onChange={e=>updPlan(item.id,f,e.target.value)}
                          className={`w-full p-3 rounded-xl text-sm border-none outline-none resize-none ${isEdit?'bg-purple-50/60 focus:ring-2 focus:ring-purple-300':'bg-gray-50'}`}/>
                      </div>
                    ))}
                  </div>
                );
              })}
              {yearlyPlan.length===0&&<div className="text-center py-12 text-purple-400"><ClipboardList size={48} className="mx-auto mb-3 opacity-50"/><p>გეგმა არ არის</p></div>}
            </div>
          </div>
        )}

        {/* Class Hour */}
        {activeTab==='classHour'&&(
          <div className="bg-white rounded-3xl shadow-sm border border-purple-50 overflow-hidden">
            <div className="p-6 bg-purple-50/50 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-purple-800">კლასის საათი</h2>
              <button onClick={addCH} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-100"><Plus size={18}/>ახალი ჩანაწერი</button>
            </div>
            <div className="p-6 space-y-4 max-h-[640px] overflow-y-auto">
              {classHours.length===0&&<div className="text-center py-12 text-purple-400"><Calendar size={48} className="mx-auto mb-3 opacity-50"/><p>კლასის საათის ჩანაწერები არ არის</p></div>}
              {classHours.map(ch=>{
                const isEdit=editCH===ch.id;
                return(
                  <div key={ch.id} className="border-2 border-purple-100 rounded-2xl p-5 hover:border-purple-200 transition-all">
                    <div className="flex justify-between items-start mb-4 gap-3">
                      <div className="grid grid-cols-2 gap-3 flex-1">
                        <div><label className="text-xs font-medium text-purple-600 mb-1 block">თარიღი</label>
                          <input type="date" value={ch.date} onChange={e=>updCH(ch.id,'date',e.target.value)} disabled={!isEdit}
                            className={`w-full p-2 rounded-xl text-sm outline-none ${isEdit?'bg-purple-50/60 focus:ring-2 focus:ring-purple-300':'bg-gray-50'}`}/></div>
                        <div><label className="text-xs font-medium text-purple-600 mb-1 block">კლასი</label>
                          <select value={ch.classId} onChange={e=>updCH(ch.id,'classId',e.target.value)} disabled={!isEdit}
                            className={`w-full p-2 rounded-xl text-sm outline-none ${isEdit?'bg-purple-50/60 focus:ring-2 focus:ring-purple-300':'bg-gray-50'}`}>
                            <option value="class1">{classNames.class1}</option>
                            <option value="class2">{classNames.class2}</option>
                          </select></div>
                      </div>
                      <div className="flex gap-2 mt-5">
                        {isEdit?(<><button onClick={saveCH} className="text-green-600 hover:bg-green-50 p-2 rounded-lg"><Save size={18}/></button><button onClick={()=>setEditCH(null)} className="text-gray-500 hover:bg-gray-50 p-2 rounded-lg"><X size={18}/></button></>)
                          :(<button onClick={()=>setEditCH(ch.id)} className="text-purple-600 hover:bg-purple-50 p-2 rounded-lg"><Edit2 size={18}/></button>)}
                        <button onClick={()=>delCH(ch.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg"><Trash2 size={18}/></button>
                      </div>
                    </div>
                    {[['topic','კლასის საათის თემა','მაგ: მეგობრობა, პატივისცემა...'],['activities','აქტივობები','ჩატარებული სავარჯიშოები...'],['notes','შენიშვნები','მოსწავლეების რეაქცია...',3]].map(([f,lbl,ph,rows=2])=>(
                      <div key={f} className="mb-3">
                        <label className="text-xs font-medium text-purple-600 mb-1 block">{lbl}</label>
                        <textarea placeholder={ph} value={ch[f]||''} rows={rows} onChange={e=>updCH(ch.id,f,e.target.value)} disabled={!isEdit}
                          className={`w-full p-3 rounded-xl text-sm border-none outline-none resize-none ${isEdit?'bg-purple-50/60 focus:ring-2 focus:ring-purple-300':'bg-gray-50'}`}/>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab==='class1'&&<ClassPanel classId="class1"/>}
        {activeTab==='class2'&&<ClassPanel classId="class2"/>}

        {/* Work Meetings */}
        {activeTab==='workMeetings'&&(
          <div className="bg-white rounded-3xl shadow-sm border border-purple-50 overflow-hidden">
            <div className="p-6 bg-purple-50/50 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-purple-800">სამუშაო შეხვედრები</h2>
              <button onClick={addWM} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-100"><Plus size={18}/>ახალი</button>
            </div>
            <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
              {workMeetings.map(m=>(
                <MeetingCard key={m.id} item={m} isEdit={editWM===m.id}
                  onEdit={()=>setEditWM(m.id)} onSave={saveWM} onCancel={()=>setEditWM(null)}
                  onDel={()=>delWM(m.id)} onUpd={(f,v)=>updWM(m.id,f,v)}/>
              ))}
              {workMeetings.length===0&&<div className="text-center py-12 text-purple-400"><FileText size={48} className="mx-auto mb-3 opacity-50"/><p>შეხვედრები არ არის</p></div>}
            </div>
          </div>
        )}

        {/* Parent Meetings */}
        {activeTab==='parentMeetings'&&(
          <div className="bg-white rounded-3xl shadow-sm border border-purple-50 overflow-hidden">
            <div className="p-6 bg-purple-50/50 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-purple-800">მასწავლებლების და მშობლების შეხვედრები</h2>
              <button onClick={addPM} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-100"><Plus size={18}/>ახალი</button>
            </div>
            <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
              {parentMeetings.map(m=>(
                <MeetingCard key={m.id} item={m} isEdit={editPM===m.id}
                  onEdit={()=>setEditPM(m.id)} onSave={savePM} onCancel={()=>setEditPM(null)}
                  onDel={()=>delPM(m.id)} onUpd={(f,v)=>updPM(m.id,f,v)}
                  extraFields={[['result','შეხვედრის შედეგი','შეთანხმებები...']]}/>
              ))}
              {parentMeetings.length===0&&<div className="text-center py-12 text-purple-400"><MessageSquare size={48} className="mx-auto mb-3 opacity-50"/><p>შეხვედრები არ არის</p></div>}
            </div>
          </div>
        )}

        {/* AI Report Tab */}
        {activeTab==='aiReport'&&(
          <AIReportPanel
            students={students} classNames={classNames} attendance={attendance}
            incidents={incidents} workMeetings={workMeetings} parentMeetings={parentMeetings}
            classHours={classHours}
          />
        )}

      </div>
    </div>
  );
}