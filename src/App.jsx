import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import {
  Users, Calendar, ClipboardList, AlertCircle,
  FileText, Settings, Download, Plus, Trash2,
  Save, MessageSquare, BookOpen, Star, Sparkles,
  Edit2, X, ChevronDown, ChevronUp, LogOut, Mail, Lock, Eye, EyeOff
} from 'lucide-react'

// ───────────────────────────── AUTH ─────────────────────────────
function AuthScreen() {
  const [mode, setMode]         = useState('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [msg, setMsg]           = useState(null)
  const [err, setErr]           = useState(null)

  const handle = async () => {
    if (!email || !password) { setErr('შეავსეთ ყველა ველი'); return }
    setLoading(true); setErr(null); setMsg(null)
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setErr('მეილი ან პაროლი არასწორია')
    } else if (mode === 'register') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setErr(error.message)
      else setMsg('რეგისტრაცია წარმატებულია! შედით სისტემაში.')
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) setErr(error.message)
      else setMsg('პაროლის აღდგენის ლინკი გაიგზავნა!')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl shadow-purple-100 p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📋</div>
          <h1 className="text-2xl font-bold text-purple-800">დამრიგებლის პორტფოლიო</h1>
          <p className="text-purple-400 mt-1 text-sm">
            {mode === 'login' ? 'შესვლა' : mode === 'register' ? 'რეგისტრაცია' : 'პაროლის აღდგენა'}
          </p>
        </div>

        {err && <div className="bg-rose-50 text-rose-600 rounded-2xl px-4 py-3 mb-4 text-sm">{err}</div>}
        {msg && <div className="bg-green-50 text-green-600 rounded-2xl px-4 py-3 mb-4 text-sm">{msg}</div>}

        <div className="space-y-4">
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300"/>
            <input type="email" placeholder="მეილი" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handle()}
              className="w-full pl-11 pr-4 py-4 bg-purple-50 rounded-2xl outline-none focus:ring-2 focus:ring-purple-300 text-purple-800"/>
          </div>
          {mode !== 'reset' && (
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300"/>
              <input type={show ? 'text' : 'password'} placeholder="პაროლი (მინ. 6 სიმბოლო)" value={password}
                onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()}
                className="w-full pl-11 pr-12 py-4 bg-purple-50 rounded-2xl outline-none focus:ring-2 focus:ring-purple-300 text-purple-800"/>
              <button onClick={() => setShow(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-300 hover:text-purple-500">
                {show ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
          )}
          <button onClick={handle} disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-bold rounded-2xl hover:from-purple-700 hover:to-indigo-600 shadow-lg transition-all disabled:opacity-50">
            {loading ? 'გთხოვთ დაიცადოთ...' : mode === 'login' ? '🔑 შესვლა' : mode === 'register' ? '✅ რეგისტრაცია' : '📧 გაგზავნა'}
          </button>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3 text-sm">
          {mode === 'login' && <>
            <button onClick={() => { setMode('register'); setErr(null); setMsg(null) }} className="text-purple-600 hover:text-purple-800 font-semibold">არ გაქვს ანგარიში? დარეგისტრირდი →</button>
            <button onClick={() => { setMode('reset'); setErr(null); setMsg(null) }} className="text-purple-300 hover:text-purple-500">პაროლი დამავიწყდა</button>
          </>}
          {mode === 'register' && <button onClick={() => { setMode('login'); setErr(null); setMsg(null) }} className="text-purple-500 hover:text-purple-700 font-medium">← უკან შესვლაზე</button>}
          {mode === 'reset' && <button onClick={() => { setMode('login'); setErr(null); setMsg(null) }} className="text-purple-500 hover:text-purple-700 font-medium">← უკან შესვლაზე</button>}
        </div>
      </div>
    </div>
  )
}

// ───────────────────────────── AI REPORT ─────────────────────────────
function AIReportPanel({ students, classNames, attendance, incidents, classHours }) {
  const [mode, setMode]           = useState('class')
  const [selectedClass, setSelectedClass] = useState('class1')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [report, setReport]       = useState('')
  const [loading, setLoading]     = useState(false)
  const [copied, setCopied]       = useState(false)

  const cls = students.filter(s => s.class_id === selectedClass)

  const buildPrompt = () => {
    if (mode === 'class') {
      const att = attendance.filter(a => cls.some(s => s.id === a.student_id))
      const inc = incidents.filter(i => cls.some(s => s.id === i.student_id))
      const ch  = classHours.filter(c => c.class_id === selectedClass)
      return `შენ ხარ გამოცდილი პედაგოგიური მრჩეველი. შექმენი სრული პროფესიონალური ანგარიში ქართულ ენაზე.
კლასი: ${classNames[selectedClass]} | მოსწავლეები: ${cls.length}
დასწრება: სულ ${att.length}, დამსწრე ${att.filter(a=>a.status==='present').length}, დაგვიანება ${att.filter(a=>a.status==='late').length}, გაცდენა ${att.filter(a=>a.status==='absent').length}
შემთხვევები: ${inc.map(i=>`${i.date} ${i.type}: ${i.description||'—'}`).join('; ')||'არ არის'}
კლასის საათები: ${ch.map(c=>`${c.date}: ${c.topic||'—'}`).join('; ')||'არ არის'}
მოსწავლეები: ${cls.map(s=>`${s.name}: ${s.characterization||'—'}`).join('; ')}
## 1. კლასის ზოგადი მიმოხილვა
## 2. დასწრების ანალიზი
## 3. შემთხვევების შეჯამება
## 4. ძლიერი მხარეები
## 5. გამოწვევები
## 6. რეკომენდაციები`
    } else {
      const st  = students.find(s => s.id === selectedStudent)
      if (!st) return ''
      const att = attendance.filter(a => a.student_id === st.id)
      const inc = incidents.filter(i => i.student_id === st.id)
      return `შენ ხარ გამოცდილი პედაგოგიური მრჩეველი. შექმენი სრული ანგარიში მოსწავლის შესახებ ქართულ ენაზე.
მოსწავლე: ${st.name} | კლასი: ${classNames[st.class_id]} | დახასიათება: ${st.characterization||'—'}
დასწრება: სულ ${att.length}, დამსწრე ${att.filter(a=>a.status==='present').length}, დაგვიანება ${att.filter(a=>a.status==='late').length}, გაცდენა ${att.filter(a=>a.status==='absent').length}
შემთხვევები: ${inc.map(i=>`${i.date} ${i.type}: ${i.description||'—'}`).join('; ')||'არ არის'}
## 1. ზოგადი დახასიათება
## 2. დასწრების ანალიზი
## 3. ქცევა და შემთხვევები
## 4. ძლიერი მხარეები
## 5. გასაუმჯობესებელი სფეროები
## 6. რეკომენდაციები`
    }
  }

  const generate = async () => {
    if (mode === 'student' && !selectedStudent) return
    setLoading(true); setReport('')
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: buildPrompt() }] })
      })
      const d = await r.json()
      setReport(d.content.filter(c => c.type === 'text').map(c => c.text).join('\n'))
    } catch { setReport('შეცდომა. სცადეთ თავიდან.') }
    setLoading(false)
  }

  const printReport = () => {
    const w = window.open('', '_blank')
    const title = mode === 'class' ? classNames[selectedClass] : students.find(s => s.id === selectedStudent)?.name
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>AI ანგარიში — ${title}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px;line-height:1.8}h2{color:#6d28d9;margin-top:24px}pre{white-space:pre-wrap;font-family:Arial}</style></head>
    <body><h1>AI ანგარიში — ${title}</h1><pre>${report}</pre><script>window.onload=()=>window.print();<\/script></body></html>`)
    w.document.close()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-purple-50 p-6">
        <h2 className="text-xl font-bold text-purple-800 mb-5 flex items-center gap-2"><Star className="text-purple-400"/> AI ანგარიში</h2>
        <div className="flex gap-2 mb-5 p-1 bg-purple-50 rounded-2xl w-fit">
          {['class','student'].map(m => (
            <button key={m} onClick={() => { setMode(m); setReport('') }}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${mode===m?'bg-purple-600 text-white shadow-lg':'text-purple-500 hover:text-purple-700'}`}>
              {m==='class'?'🏫 კლასი':'👤 მოსწავლე'}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 mb-5">
          <div>
            <label className="text-xs font-medium text-purple-600 mb-1 block">კლასი</label>
            <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedStudent(''); setReport('') }}
              className="bg-purple-50 rounded-xl px-4 py-2.5 text-purple-800 font-medium outline-none focus:ring-2 focus:ring-purple-300">
              <option value="class1">{classNames.class1}</option>
              <option value="class2">{classNames.class2}</option>
            </select>
          </div>
          {mode === 'student' && (
            <div>
              <label className="text-xs font-medium text-purple-600 mb-1 block">მოსწავლე</label>
              <select value={selectedStudent} onChange={e => { setSelectedStudent(e.target.value); setReport('') }}
                className="bg-purple-50 rounded-xl px-4 py-2.5 text-purple-800 font-medium outline-none focus:ring-2 focus:ring-purple-300 min-w-[200px]">
                <option value="">— აირჩიეთ —</option>
                {cls.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <button onClick={generate} disabled={loading || (mode==='student' && !selectedStudent)}
          className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-bold rounded-2xl hover:from-purple-700 hover:to-indigo-600 shadow-xl transition-all disabled:opacity-50">
          {loading ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"/>გენერირება...</> : <><Sparkles size={20}/>ანგარიშის გენერირება</>}
        </button>
      </div>

      {(report || loading) && (
        <div className="bg-white rounded-3xl shadow-sm border border-purple-50 overflow-hidden">
          <div className="p-5 bg-purple-50/50 border-b flex justify-between items-center">
            <h3 className="font-bold text-purple-800">შედეგი</h3>
            {report && !loading && (
              <div className="flex gap-2">
                <button onClick={() => { navigator.clipboard.writeText(report); setCopied(true); setTimeout(()=>setCopied(false),2000) }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${copied?'bg-green-500 text-white':'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}>
                  {copied ? '✅ კოპირდა' : '📋 კოპირება'}
                </button>
                <button onClick={printReport} className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium bg-purple-600 text-white hover:bg-purple-700">
                  <Download size={16}/> PDF
                </button>
              </div>
            )}
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center py-16 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"/>
                <p className="text-purple-500 font-medium">AI ანგარიშს ამზადებს...</p>
              </div>
            ) : (
              <div>
                {report.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-purple-800 mt-6 mb-2">{line.replace('## ','')}</h2>
                  if (line.trim() === '') return <div key={i} className="h-2"/>
                  return <p key={i} className="text-gray-700 mb-2 leading-relaxed">{line}</p>
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ───────────────────────────── TABS ─────────────────────────────
const TABS = [
  { id: 'forms',         label: 'შესავსები ფორმები',    icon: ClipboardList },
  { id: 'profile',       label: 'პროფილი',              icon: Settings },
  { id: 'yearlyPlan',    label: 'წლიური გეგმა',         icon: ClipboardList },
  { id: 'classHour',     label: 'კლასის საათი',         icon: Calendar },
  { id: 'class1',        label: 'კლასი 1',              icon: BookOpen },
  { id: 'class2',        label: 'კლასი 2',              icon: BookOpen },
  { id: 'workMeetings',  label: 'სამუშაო შეხვედრები',  icon: FileText },
  { id: 'parentMeetings',label: 'მშობლების შეხვედრები', icon: MessageSquare },
  { id: 'aiReport',      label: 'AI ანგარიში',          icon: Star },
]

// ───────────────────────────── MAIN APP ─────────────────────────────
export default function App() {
  const [session, setSession]               = useState(null)
  const [loading, setLoading]               = useState(true)
  const [activeTab, setActiveTab]           = useState('forms')
  const [students, setStudents]             = useState([])
  const [attendance, setAttendance]         = useState([])
  const [incidents, setIncidents]           = useState([])
  const [workMeetings, setWorkMeetings]     = useState([])
  const [parentMeetings, setParentMeetings] = useState([])
  const [classHours, setClassHours]         = useState([])
  const [yearlyPlan, setYearlyPlan]         = useState([])
  const [profile, setProfile]               = useState({
    full_name:'', role:'', school:'', subjects:'', bio:'',
    portfolio_title:'დამრიგებლის პორტფოლიო',
    inspiration:{text:'',author:''},
    class_names:{class1:'კლასი 1',class2:'კლასი 2'}
  })
  const [expanded, setExpanded]   = useState({})
  const [saving, setSaving]       = useState({})
  const [editItems, setEditItems] = useState({})
  const [editClassName, setEditClassName] = useState(null)
  const [editTitle, setEditTitle] = useState(false)
  const [editInsp, setEditInsp]   = useState(false)
  const [dateMap, setDateMap]     = useState({
    class1: new Date().toISOString().split('T')[0],
    class2: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (!s) setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => { if (session) loadAll() }, [session])

  const loadAll = async () => {
    const uid = session.user.id
    const [
      { data: prof }, { data: studs }, { data: att },
      { data: inc }, { data: wm }, { data: pm },
      { data: ch }, { data: yp }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('students').select('*').eq('user_id', uid).order('sort_order'),
      supabase.from('attendance').select('*').eq('user_id', uid),
      supabase.from('incidents').select('*').eq('user_id', uid),
      supabase.from('work_meetings').select('*').eq('user_id', uid).order('date', { ascending: false }),
      supabase.from('parent_meetings').select('*').eq('user_id', uid).order('date', { ascending: false }),
      supabase.from('class_hours').select('*').eq('user_id', uid).order('date', { ascending: false }),
      supabase.from('yearly_plan').select('*').eq('user_id', uid),
    ])
    if (prof) setProfile(p => ({
      ...p, ...prof,
      inspiration: prof.inspiration || {text:'',author:''},
      class_names: prof.class_names || {class1:'კლასი 1',class2:'კლასი 2'}
    }))
    setStudents(studs || [])
    setAttendance(att || [])
    setIncidents(inc || [])
    setWorkMeetings(wm || [])
    setParentMeetings(pm || [])
    setClassHours(ch || [])
    setYearlyPlan(yp || [])
  }

  const saveProfile = async (updates) => {
    await supabase.from('profiles').update({ ...updates, updated_at: new Date() }).eq('id', session.user.id)
  }

  // ── Students ──
  const addStudent = async (classId) => {
    const { data } = await supabase.from('students').insert({
      user_id: session.user.id, name: 'ახალი მოსწავლე',
      class_id: classId, sort_order: students.filter(s=>s.class_id===classId).length
    }).select().single()
    if (data) setStudents(s => [...s, data])
  }
  const updStudent = (id, field, val) => setStudents(s => s.map(st => st.id===id ? {...st,[field]:val} : st))
  const saveStudent = async (id) => {
    const st = students.find(s => s.id===id); if (!st) return
    setSaving(s => ({...s,[id]:true}))
    await supabase.from('students').update({ name:st.name, characterization:st.characterization, notes:st.notes }).eq('id', id)
    setSaving(s => ({...s,[id]:false}))
  }
  const delStudent = async (id) => {
    if (!window.confirm('წაიშალოს მოსწავლე?')) return
    await supabase.from('students').delete().eq('id', id)
    setStudents(s => s.filter(st => st.id!==id))
  }

  // ── Attendance ──
  const markAtt = async (studentId, status, classId) => {
    const date = dateMap[classId]
    const existing = attendance.find(a => a.student_id===studentId && a.date===date)
    if (existing) {
      if (status === null) {
        await supabase.from('attendance').delete().eq('id', existing.id)
        setAttendance(a => a.filter(x => x.id!==existing.id))
      } else {
        await supabase.from('attendance').update({ status }).eq('id', existing.id)
        setAttendance(a => a.map(x => x.id===existing.id ? {...x,status} : x))
      }
    } else if (status !== null) {
      const { data } = await supabase.from('attendance').insert({ user_id:session.user.id, student_id:studentId, date, status }).select().single()
      if (data) setAttendance(a => [...a, data])
    }
  }
  const attStatus = (studentId, classId) => attendance.find(a => a.student_id===studentId && a.date===dateMap[classId])?.status

  // ── Incidents ──
  const addIncident = async (studentId) => {
    const date = dateMap[students.find(s=>s.id===studentId)?.class_id] || new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('incidents').insert({ user_id:session.user.id, student_id:studentId, date, type:'ქცევითი', description:'', actions:'' }).select().single()
    if (data) { setIncidents(i => [...i, data]); setExpanded(e => ({...e,[`${studentId}-incidents`]:true})) }
  }
  const updIncident = (id, field, val) => setIncidents(i => i.map(x => x.id===id ? {...x,[field]:val} : x))
  const saveIncident = async (id) => {
    const inc = incidents.find(i => i.id===id); if (!inc) return
    await supabase.from('incidents').update({ type:inc.type, date:inc.date, description:inc.description, actions:inc.actions }).eq('id', id)
  }
  const delIncident = async (id) => {
    await supabase.from('incidents').delete().eq('id', id)
    setIncidents(i => i.filter(x => x.id!==id))
  }

  // ── Generic meetings ──
  const addMeeting = async (table, setter, extra={}) => {
    const { data } = await supabase.from(table).insert({ user_id:session.user.id, date:new Date().toISOString().split('T')[0], time:'', topic:'', participants:'', notes:'', ...extra }).select().single()
    if (data) { setter(m => [data,...m]); setEditItems(e => ({...e,[data.id]:true})) }
  }
  const updMeeting = (setter, id, field, val) => setter(m => m.map(x => x.id===id ? {...x,[field]:val} : x))
  const saveMeeting = async (table, items, id, setter) => {
    const item = items.find(x => x.id===id); if (!item) return
    setSaving(s => ({...s,[id]:true}))
    const { id:_, user_id, ...rest } = item
    await supabase.from(table).update(rest).eq('id', id)
    setSaving(s => ({...s,[id]:false}))
    setEditItems(e => ({...e,[id]:false}))
  }
  const delMeeting = async (table, setter, id) => {
    if (!window.confirm('წაიშალოს?')) return
    await supabase.from(table).delete().eq('id', id)
    setter(m => m.filter(x => x.id!==id))
  }

  // ── Yearly Plan ──
  const addPlan = async () => {
    const { data } = await supabase.from('yearly_plan').insert({ user_id:session.user.id, month:'', goals:'', activities:'', notes:'' }).select().single()
    if (data) { setYearlyPlan(p => [...p,data]); setEditItems(e => ({...e,[data.id]:true})) }
  }
  const updPlan = (id, field, val) => setYearlyPlan(p => p.map(x => x.id===id ? {...x,[field]:val} : x))
  const savePlan = async (id) => {
    const item = yearlyPlan.find(x => x.id===id); if (!item) return
    setSaving(s => ({...s,[id]:true}))
    await supabase.from('yearly_plan').update({ month:item.month, goals:item.goals, activities:item.activities, notes:item.notes }).eq('id', id)
    setSaving(s => ({...s,[id]:false}))
    setEditItems(e => ({...e,[id]:false}))
  }
  const delPlan = async (id) => {
    if (!window.confirm('წაიშალოს?')) return
    await supabase.from('yearly_plan').delete().eq('id', id)
    setYearlyPlan(p => p.filter(x => x.id!==id))
  }

  // ── Class Hours ──
  const addCH = async () => {
    const { data } = await supabase.from('class_hours').insert({ user_id:session.user.id, date:new Date().toISOString().split('T')[0], class_id:'class1', topic:'', activities:'', notes:'' }).select().single()
    if (data) { setClassHours(c => [data,...c]); setEditItems(e => ({...e,[data.id]:true})) }
  }
  const updCH = (id, field, val) => setClassHours(c => c.map(x => x.id===id ? {...x,[field]:val} : x))
  const saveCH = async (id) => {
    const item = classHours.find(x => x.id===id); if (!item) return
    setSaving(s => ({...s,[id]:true}))
    await supabase.from('class_hours').update({ date:item.date, class_id:item.class_id, topic:item.topic, activities:item.activities, notes:item.notes }).eq('id', id)
    setSaving(s => ({...s,[id]:false}))
    setEditItems(e => ({...e,[id]:false}))
  }
  const delCH = async (id) => {
    if (!window.confirm('წაიშალოს?')) return
    await supabase.from('class_hours').delete().eq('id', id)
    setClassHours(c => c.filter(x => x.id!==id))
  }

  const toggleExpand = (sid, section) => setExpanded(e => ({...e,[`${sid}-${section}`]:!e[`${sid}-${section}`]}))
  const isExpanded   = (sid, section) => !!expanded[`${sid}-${section}`]

  const exportPDF = () => {
    const w = window.open('', '_blank')
    const cn = profile.class_names || {class1:'კლასი 1',class2:'კლასი 2'}
    const renderStudents = (classId) => students.filter(s=>s.class_id===classId).map(s => {
      const att = attendance.filter(a=>a.student_id===s.id)
      const inc = incidents.filter(i=>i.student_id===s.id)
      return `<tr style="background:#f3f0ff"><td colspan="3"><b>${s.name}</b></td></tr>
        <tr><td>დახასიათება: ${s.characterization||'—'}</td>
        <td>✅${att.filter(a=>a.status==='present').length} ⏰${att.filter(a=>a.status==='late').length} ❌${att.filter(a=>a.status==='absent').length}</td>
        <td>შემთხვევები: ${inc.length}</td></tr>`
    }).join('')
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${profile.portfolio_title}</title>
    <style>body{font-family:Arial;padding:30px;font-size:13px}h1{color:#7c3aed;border-bottom:3px solid #7c3aed;padding-bottom:8px}h2{color:#6d28d9;margin:20px 0 8px}table{width:100%;border-collapse:collapse;margin-bottom:12px}td,th{border:1px solid #e0d7ff;padding:7px 10px}th{background:#7c3aed;color:#fff}</style></head>
    <body><h1>📋 ${profile.portfolio_title}</h1>
    <h2>პროფილი</h2><table><tr><th>სახელი</th><th>როლი</th><th>სკოლა</th><th>საგნები</th></tr>
    <tr><td>${profile.full_name||'—'}</td><td>${profile.role||'—'}</td><td>${profile.school||'—'}</td><td>${profile.subjects||'—'}</td></tr></table>
    <h2>${cn.class1}</h2><table><tr><th>მოსწავლე</th><th>დასწრება</th><th>შემთხვევები</th></tr>${renderStudents('class1')}</table>
    <h2>${cn.class2}</h2><table><tr><th>მოსწავლე</th><th>დასწრება</th><th>შემთხვევები</th></tr>${renderStudents('class2')}</table>
    <script>window.onload=()=>window.print();<\/script></body></html>`)
    w.document.close()
  }

  // ── Meeting Card Component ──
  const MeetingCard = ({ item, table, setter, items, extraFields=[] }) => {
    const isEdit = !!editItems[item.id]
    const isSav  = !!saving[item.id]
    const fields = [['topic','თემა','თემა...'],['participants','მონაწილეები','სახელები...'],...extraFields,['notes','შენიშვნები','დეტალები...']]
    return (
      <div className="border-2 border-purple-100 rounded-2xl p-4 hover:border-purple-200 transition-all">
        <div className="flex justify-between items-start mb-3">
          <div className="grid grid-cols-2 gap-3 flex-1">
            <div><label className="text-xs font-medium text-purple-600 mb-1 block">თარიღი</label>
              <input type="date" value={item.date||''} disabled={!isEdit} onChange={e=>updMeeting(setter,item.id,'date',e.target.value)}
                className={`w-full p-2 rounded-xl text-sm outline-none ${isEdit?'bg-purple-50 focus:ring-2 focus:ring-purple-300':'bg-gray-50'}`}/></div>
            <div><label className="text-xs font-medium text-purple-600 mb-1 block">დრო</label>
              <input type="time" value={item.time||''} disabled={!isEdit} onChange={e=>updMeeting(setter,item.id,'time',e.target.value)}
                className={`w-full p-2 rounded-xl text-sm outline-none ${isEdit?'bg-purple-50 focus:ring-2 focus:ring-purple-300':'bg-gray-50'}`}/></div>
          </div>
          <div className="flex gap-2 ml-3">
            {isEdit ? (
              <>
                <button onClick={() => saveMeeting(table, items, item.id, setter)} disabled={isSav} className="text-green-600 hover:bg-green-50 p-2 rounded-lg">
                  {isSav ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"/> : <Save size={18}/>}
                </button>
                <button onClick={() => setEditItems(e=>({...e,[item.id]:false}))} className="text-gray-500 hover:bg-gray-50 p-2 rounded-lg"><X size={18}/></button>
              </>
            ) : (
              <button onClick={() => setEditItems(e=>({...e,[item.id]:true}))} className="text-purple-600 hover:bg-purple-50 p-2 rounded-lg"><Edit2 size={18}/></button>
            )}
            <button onClick={() => delMeeting(table, setter, item.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg"><Trash2 size={18}/></button>
          </div>
        </div>
        {fields.map(([f,lbl,ph]) => (
          <div key={f} className="mb-3">
            <label className="text-xs font-medium text-purple-600 mb-1 block">{lbl}</label>
            <textarea placeholder={ph} value={item[f]||''} rows={2} disabled={!isEdit}
              onChange={e=>updMeeting(setter,item.id,f,e.target.value)}
              className={`w-full p-3 rounded-xl text-sm border-none outline-none resize-none ${isEdit?'bg-purple-50 focus:ring-2 focus:ring-purple-300':'bg-gray-50'}`}/>
          </div>
        ))}
      </div>
    )
  }

  // ── Class Panel ──
  const ClassPanel = ({ classId }) => {
    const cn  = profile.class_names || {class1:'კლასი 1',class2:'კლასი 2'}
    const cls = students.filter(s => s.class_id===classId)
    const date = dateMap[classId]
    const pres = attendance.filter(a=>a.date===date&&a.status==='present'&&cls.some(s=>s.id===a.student_id)).length
    const late = attendance.filter(a=>a.date===date&&a.status==='late'&&cls.some(s=>s.id===a.student_id)).length
    const abs  = attendance.filter(a=>a.date===date&&a.status==='absent'&&cls.some(s=>s.id===a.student_id)).length

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-3xl shadow-sm border border-purple-50 p-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              {editClassName===classId ? (
                <input value={cn[classId]} autoFocus
                  onChange={e => { const c={...cn,[classId]:e.target.value}; setProfile(p=>({...p,class_names:c})) }}
                  onBlur={() => { saveProfile({class_names:cn}); setEditClassName(null) }}
                  className="text-xl font-bold text-purple-800 bg-white px-3 py-2 rounded-lg border-2 border-purple-300 outline-none"/>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-purple-800">{cn[classId]}</h2>
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
              <button onClick={()=>addStudent(classId)} className="flex items-center gap-1 px-3 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 text-sm shadow-lg">
                <Plus size={16}/> მოსწავლე
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-purple-50 overflow-hidden divide-y divide-purple-50">
          {cls.map(st => {
            const studInc = incidents.filter(i=>i.student_id===st.id)
            const showAtt = isExpanded(st.id,'attendance')
            const showInc = isExpanded(st.id,'incidents')
            const isSav   = !!saving[st.id]
            return (
              <div key={st.id} className="p-5">
                <div className="flex flex-wrap gap-3 items-start mb-3">
                  <input value={st.name} onChange={e=>updStudent(st.id,'name',e.target.value)} onBlur={()=>saveStudent(st.id)}
                    className="text-base font-semibold text-slate-700 bg-transparent border-b-2 border-transparent hover:border-purple-200 focus:border-purple-400 outline-none"/>
                  <textarea placeholder="დახასიათება..." value={st.characterization||''} rows={1}
                    onChange={e=>updStudent(st.id,'characterization',e.target.value)} onBlur={()=>saveStudent(st.id)}
                    className="flex-1 min-w-[160px] p-2 bg-purple-50/50 rounded-xl border-none outline-none focus:ring-2 focus:ring-purple-300 text-sm resize-none"/>
                  {isSav && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400 mt-2"/>}
                  <button onClick={()=>delStudent(st.id)} className="text-rose-300 hover:text-rose-500 p-1"><Trash2 size={16}/></button>
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
                    {attStatus(st.id,classId) && <button onClick={()=>markAtt(st.id,null,classId)} className="text-xs text-purple-400 hover:text-purple-600 underline">გასუფთავება</button>}
                  </div>
                )}

                {showInc && (
                  <div className="mt-3 space-y-3">
                    {studInc.map(inc => (
                      <div key={inc.id} className="p-4 bg-rose-50/60 rounded-2xl space-y-2 border border-rose-100">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <select value={inc.type} onChange={e=>updIncident(inc.id,'type',e.target.value)} onBlur={()=>saveIncident(inc.id)}
                            className="bg-white border border-rose-200 rounded-xl px-3 py-1.5 text-sm text-rose-700 outline-none">
                            <option>ქცევითი</option><option>აკადემიური</option><option>დისციპლინური</option><option>სხვა</option>
                          </select>
                          <input type="date" value={inc.date||''} onChange={e=>updIncident(inc.id,'date',e.target.value)} onBlur={()=>saveIncident(inc.id)}
                            className="border border-rose-200 rounded-xl px-3 py-1.5 text-sm text-rose-700 outline-none bg-white"/>
                          <button onClick={()=>delIncident(inc.id)} className="text-rose-400 hover:text-rose-600 p-1 hover:bg-rose-100 rounded-lg"><Trash2 size={16}/></button>
                        </div>
                        <textarea placeholder="აღწერა..." value={inc.description||''} rows={2}
                          onChange={e=>updIncident(inc.id,'description',e.target.value)} onBlur={()=>saveIncident(inc.id)}
                          className="w-full p-2 bg-white rounded-xl border border-rose-100 outline-none focus:ring-2 focus:ring-rose-300 text-sm resize-none"/>
                        <textarea placeholder="განხორციელებული ქმედებები..." value={inc.actions||''} rows={2}
                          onChange={e=>updIncident(inc.id,'actions',e.target.value)} onBlur={()=>saveIncident(inc.id)}
                          className="w-full p-2 bg-white rounded-xl border border-rose-100 outline-none focus:ring-2 focus:ring-rose-300 text-sm resize-none"/>
                      </div>
                    ))}
                    <button onClick={()=>addIncident(st.id)}
                      className="w-full border-2 border-dashed border-rose-200 rounded-2xl p-2 text-rose-500 hover:bg-rose-50 text-sm flex items-center justify-center gap-1">
                      <Plus size={16}/> ახალი შემთხვევა
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          {cls.length===0 && (
            <div className="text-center py-12 text-purple-400">
              <Users size={48} className="mx-auto mb-3 opacity-50"/>
              <p>მოსწავლეები არ არის — დაამატე პირველი!</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"/>
    </div>
  )
  if (!session) return <AuthScreen/>

  const cn = profile.class_names || {class1:'კლასი 1',class2:'კლასი 2'}

  return (
    <div className="min-h-screen bg-[#fafaff] p-4 md:p-8">

      {/* Banner */}
      <div className="max-w-6xl mx-auto mb-8 bg-gradient-to-r from-purple-500 to-indigo-400 rounded-[2rem] p-8 text-white shadow-xl shadow-purple-100">
        <div className="flex items-center justify-between mb-4">
          {editTitle ? (
            <input value={profile.portfolio_title} autoFocus
              onChange={e=>setProfile(p=>({...p,portfolio_title:e.target.value}))}
              onBlur={()=>{saveProfile({portfolio_title:profile.portfolio_title});setEditTitle(false)}}
              className="text-3xl font-bold bg-white/20 text-white px-4 py-2 rounded-xl border-2 border-white/40 outline-none flex-1"/>
          ) : (
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{profile.portfolio_title}</h1>
              <button onClick={()=>setEditTitle(true)} className="text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-lg"><Edit2 size={18}/></button>
            </div>
          )}
          <button onClick={()=>supabase.auth.signOut()} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-medium ml-4">
            <LogOut size={16}/> გასვლა
          </button>
        </div>

        <div className="flex items-center gap-2 mb-2 text-purple-100 uppercase text-xs font-bold tracking-widest"><Sparkles size={16}/> ჩემი ინსპირაცია</div>
        {editInsp ? (
          <div className="space-y-2">
            <textarea placeholder="ჩაწერეთ თქვენი ინსპირაციული ციტატა..." value={profile.inspiration?.text||''} rows={3}
              onChange={e=>setProfile(p=>({...p,inspiration:{...p.inspiration,text:e.target.value}}))}
              className="w-full bg-white/20 text-white placeholder-white/50 rounded-2xl px-4 py-3 outline-none border-2 border-white/30 resize-none text-lg font-light italic"/>
            <input placeholder="ავტორი..." value={profile.inspiration?.author||''}
              onChange={e=>setProfile(p=>({...p,inspiration:{...p.inspiration,author:e.target.value}}))}
              className="w-full bg-white/20 text-white placeholder-white/50 rounded-xl px-4 py-2 outline-none border-2 border-white/30"/>
            <button onClick={()=>{saveProfile({inspiration:profile.inspiration});setEditInsp(false)}}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white text-sm font-medium">
              <Save size={16}/> შენახვა
            </button>
          </div>
        ) : (
          <div className="group relative cursor-pointer" onClick={()=>setEditInsp(true)}>
            {profile.inspiration?.text ? (
              <>
                <p className="text-xl font-light italic mb-1">"{profile.inspiration.text}"</p>
                {profile.inspiration.author && <p className="text-sm opacity-80">— {profile.inspiration.author}</p>}
              </>
            ) : (
              <p className="text-white/50 italic text-lg border-2 border-dashed border-white/30 rounded-2xl px-4 py-3 hover:border-white/50">✏️ დააჭირეთ და ჩაწერეთ თქვენი ინსპირაცია...</p>
            )}
            {profile.inspiration?.text && <span className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 bg-white/20 rounded-lg p-1"><Edit2 size={14}/></span>}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto mb-8 flex overflow-x-auto gap-2 p-1 bg-white rounded-2xl shadow-sm border border-purple-50">
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab===t.id?'bg-purple-500 text-white shadow-lg':'text-purple-400 hover:bg-purple-50'}`}>
            <t.icon size={18}/><span className="font-medium text-sm">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto">

        {activeTab==='forms' && (
          <div className="bg-white rounded-3xl shadow-sm border border-purple-50 overflow-hidden">
            <div className="p-6 bg-purple-50/50 border-b"><h2 className="text-xl font-bold text-purple-800">შესავსები ფორმები</h2></div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <a href="https://docs.google.com/forms/d/e/1FAIpQLSf9NeTQOnMRTORkAIG7YKUhflXqA1-7sPE619hwfKB3WEX_Jg/viewform" target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-4 bg-purple-50 hover:bg-purple-100 rounded-3xl p-10 transition-all group">
                <div className="text-5xl">📋</div>
                <h3 className="text-lg font-bold text-purple-800">ყოველდღიური ანგარიში</h3>
                <span className="text-purple-500 group-hover:text-purple-700 font-semibold">გახსნა ↗</span>
              </a>
              <a href="https://docs.google.com/forms/d/e/1FAIpQLSc3n4dNXwbdEjf3jp9tKuf48_yuDaCRu5sz3AVgs1YEkM4TlQ/viewform" target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-4 bg-indigo-50 hover:bg-indigo-100 rounded-3xl p-10 transition-all group">
                <div className="text-5xl">📄</div>
                <h3 className="text-lg font-bold text-indigo-800">პარასკევის ანგარიში</h3>
                <span className="text-indigo-500 group-hover:text-indigo-700 font-semibold">გახსნა ↗</span>
              </a>
            </div>
          </div>
        )}

        {activeTab==='profile' && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-[2rem] shadow-sm border border-purple-50">
            <h2 className="text-xl font-bold text-purple-800 mb-6 flex items-center gap-2"><Settings className="text-purple-400"/> მასწავლებლის პროფილი</h2>
            <div className="space-y-4">
              {[['full_name','სახელი და გვარი'],['role','როლი'],['school','სკოლა'],['subjects','საგნები']].map(([f,ph])=>(
                <input key={f} placeholder={ph} value={profile[f]||''}
                  onChange={e=>setProfile(p=>({...p,[f]:e.target.value}))}
                  onBlur={()=>saveProfile({[f]:profile[f]})}
                  className="w-full p-4 bg-purple-50/50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-purple-300"/>
              ))}
              <textarea placeholder="პედაგოგიური ხედვა..." rows={4} value={profile.bio||''}
                onChange={e=>setProfile(p=>({...p,bio:e.target.value}))}
                onBlur={()=>saveProfile({bio:profile.bio})}
                className="w-full p-4 bg-purple-50/50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-purple-300 resize-none"/>
              <p className="text-xs text-green-500 font-medium">✅ ცვლილებები ავტომატურად ინახება</p>
              <button onClick={exportPDF} className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold hover:bg-purple-700 shadow-lg flex items-center justify-center gap-2">
                <Download size={20}/> მთლიანი პორტფოლიო — PDF
              </button>
            </div>
          </div>
        )}

        {activeTab==='yearlyPlan' && (
          <div className="bg-white rounded-3xl shadow-sm border border-purple-50 overflow-hidden">
            <div className="p-6 bg-purple-50/50 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-purple-800">წლიური გეგმა</h2>
              <button onClick={addPlan} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-lg"><Plus size={18}/>დამატება</button>
            </div>
            <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
              {yearlyPlan.map(item => {
                const isEdit = !!editItems[item.id]
                const isSav  = !!saving[item.id]
                return (
                  <div key={item.id} className="border-2 border-purple-100 rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <input placeholder="თვე/პერიოდი..." value={item.month||''} disabled={!isEdit}
                        onChange={e=>updPlan(item.id,'month',e.target.value)}
                        className={`text-lg font-medium flex-1 outline-none rounded-lg ${isEdit?'bg-purple-50 p-2':'bg-transparent'}`}/>
                      <div className="flex gap-2 ml-3">
                        {isEdit ? (
                          <>
                            <button onClick={()=>savePlan(item.id)} disabled={isSav} className="text-green-600 hover:bg-green-50 p-2 rounded-lg">
                              {isSav?<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"/>:<Save size={18}/>}
                            </button>
                            <button onClick={()=>setEditItems(e=>({...e,[item.id]:false}))} className="text-gray-500 p-2 rounded-lg"><X size={18}/></button>
                          </>
                        ) : <button onClick={()=>setEditItems(e=>({...e,[item.id]:true}))} className="text-purple-600 hover:bg-purple-50 p-2 rounded-lg"><Edit2 size={18}/></button>}
                        <button onClick={()=>delPlan(item.id)} className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg"><Trash2 size={18}/></button>
                      </div>
                    </div>
                    {[['goals','მიზნები','ძირითადი მიზნები...'],['activities','აქტივობები','ღონისძიებები...'],['notes','შენიშვნები','დამატებითი...']].map(([f,lbl,ph])=>(
                      <div key={f} className="mb-3">
                        <label className="text-xs font-medium text-purple-600 mb-1 block">{lbl}</label>
                        <textarea placeholder={ph} value={item[f]||''} rows={2} disabled={!isEdit} onChange={e=>updPlan(item.id,f,e.target.value)}
                          className={`w-full p-3 rounded-xl text-sm border-none outline-none resize-none ${isEdit?'bg-purple-50 focus:ring-2 focus:ring-purple-300':'bg-gray-50'}`}/>
                      </div>
                    ))}
                  </div>
                )
              })}
              {yearlyPlan.length===0 && <div className="text-center py-12 text-purple-400"><ClipboardList size={48} className="mx-auto mb-3 opacity-50"/><p>გეგმა არ არის</p></div>}
            </div>
          </div>
        )}

        {activeTab==='classHour' && (
          <div className="bg-white rounded-3xl shadow-sm border border-purple-50 overflow-hidden">
            <div className="p-6 bg-purple-50/50 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-purple-800">კლასის საათი</h2>
              <button onClick={addCH} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-lg"><Plus size={18}/>ახალი</button>
            </div>
            <div className="p-6 space-y-4 max-h-[640px] overflow-y-auto">
              {classHours.map(ch => {
                const isEdit = !!editItems[ch.id]
                const isSav  = !!saving[ch.id]
                return (
                  <div key={ch.id} className="border-2 border-purple-100 rounded-2xl p-5">
                    <div className="flex justify-between items-start mb-4 gap-3">
                      <div className="grid grid-cols-2 gap-3 flex-1">
                        <div><label className="text-xs font-medium text-purple-600 mb-1 block">თარიღი</label>
                          <input type="date" value={ch.date||''} disabled={!isEdit} onChange={e=>updCH(ch.id,'date',e.target.value)}
                            className={`w-full p-2 rounded-xl text-sm outline-none ${isEdit?'bg-purple-50 focus:ring-2 focus:ring-purple-300':'bg-gray-50'}`}/></div>
                        <div><label className="text-xs font-medium text-purple-600 mb-1 block">კლასი</label>
                          <select value={ch.class_id||'class1'} disabled={!isEdit} onChange={e=>updCH(ch.id,'class_id',e.target.value)}
                            className={`w-full p-2 rounded-xl text-sm outline-none ${isEdit?'bg-purple-50 focus:ring-2 focus:ring-purple-300':'bg-gray-50'}`}>
                            <option value="class1">{cn.class1}</option>
                            <option value="class2">{cn.class2}</option>
                          </select></div>
                      </div>
                      <div className="flex gap-2 mt-5">
                        {isEdit ? (
                          <>
                            <button onClick={()=>saveCH(ch.id)} disabled={isSav} className="text-green-600 hover:bg-green-50 p-2 rounded-lg">
                              {isSav?<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"/>:<Save size={18}/>}
                            </button>
                            <button onClick={()=>setEditItems(e=>({...e,[ch.id]:false}))} className="text-gray-500 p-2 rounded-lg"><X size={18}/></button>
                          </>
                        ) : <button onClick={()=>setEditItems(e=>({...e,[ch.id]:true}))} className="text-purple-600 hover:bg-purple-50 p-2 rounded-lg"><Edit2 size={18}/></button>}
                        <button onClick={()=>delCH(ch.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg"><Trash2 size={18}/></button>
                      </div>
                    </div>
                    {[['topic','თემა','კლასის საათის თემა...'],['activities','აქტივობები','ჩატარებული სავარჯიშოები...'],['notes','შენიშვნები','მოსწავლეების რეაქცია...']].map(([f,lbl,ph])=>(
                      <div key={f} className="mb-3">
                        <label className="text-xs font-medium text-purple-600 mb-1 block">{lbl}</label>
                        <textarea placeholder={ph} value={ch[f]||''} rows={2} disabled={!isEdit} onChange={e=>updCH(ch.id,f,e.target.value)}
                          className={`w-full p-3 rounded-xl text-sm border-none outline-none resize-none ${isEdit?'bg-purple-50 focus:ring-2 focus:ring-purple-300':'bg-gray-50'}`}/>
                      </div>
                    ))}
                  </div>
                )
              })}
              {classHours.length===0 && <div className="text-center py-12 text-purple-400"><Calendar size={48} className="mx-auto mb-3 opacity-50"/><p>ჩანაწერები არ არის</p></div>}
            </div>
          </div>
        )}

        {activeTab==='class1' && <ClassPanel classId="class1"/>}
        {activeTab==='class2' && <ClassPanel classId="class2"/>}

        {activeTab==='workMeetings' && (
          <div className="bg-white rounded-3xl shadow-sm border border-purple-50 overflow-hidden">
            <div className="p-6 bg-purple-50/50 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-purple-800">სამუშაო შეხვედრები</h2>
              <button onClick={()=>addMeeting('work_meetings',setWorkMeetings)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-lg"><Plus size={18}/>ახალი</button>
            </div>
            <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
              {workMeetings.map(m=><MeetingCard key={m.id} item={m} table="work_meetings" setter={setWorkMeetings} items={workMeetings}/>)}
              {workMeetings.length===0 && <div className="text-center py-12 text-purple-400"><FileText size={48} className="mx-auto mb-3 opacity-50"/><p>შეხვედრები არ არის</p></div>}
            </div>
          </div>
        )}

        {activeTab==='parentMeetings' && (
          <div className="bg-white rounded-3xl shadow-sm border border-purple-50 overflow-hidden">
            <div className="p-6 bg-purple-50/50 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-purple-800">მშობლების შეხვედრები</h2>
              <button onClick={()=>addMeeting('parent_meetings',setParentMeetings)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-lg"><Plus size={18}/>ახალი</button>
            </div>
            <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
              {parentMeetings.map(m=><MeetingCard key={m.id} item={m} table="parent_meetings" setter={setParentMeetings} items={parentMeetings} extraFields={[['result','შედეგი','შეთანხმებები...']]}/>)}
              {parentMeetings.length===0 && <div className="text-center py-12 text-purple-400"><MessageSquare size={48} className="mx-auto mb-3 opacity-50"/><p>შეხვედრები არ არის</p></div>}
            </div>
          </div>
        )}

        {activeTab==='aiReport' && (
          <AIReportPanel students={students} classNames={cn} attendance={attendance} incidents={incidents} classHours={classHours}/>
        )}

      </div>
    </div>
  )
}