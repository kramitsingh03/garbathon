import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity, AlertOctagon, ArrowDownRight, ArrowLeft, ArrowRight, AudioLines, Bell, Check,
  CheckCircle2, ChevronDown, CircleHelp, Clock3, FileText, Fingerprint, Globe2, Headphones,
  History, Home, Languages, Landmark, LayoutDashboard, LockKeyhole, Menu, MessageCircle,
  Mic, MicOff, Package, Play, Radio, Search, Shield, ShieldAlert, ShieldCheck, Sparkles,
  Square, TriangleAlert, UserRound, Volume2, VolumeX, X, Zap
} from 'lucide-react'
import { scenarios, initialIncidents } from './data/scenarios'
import { getIncidents, saveIncident } from './services/incidentRepository'
import { analyzeScenario } from './services/mockScamAnalysis'
import { useCallSimulation } from './hooks/useCallSimulation'
import AudioTest from "./AudioTest";

const AppContext = createContext(null)
const iconMap = { Landmark, ShieldAlert, Package }

function useApp() { return useContext(AppContext) }

function Logo({ compact = false }) {
  return <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight">
    <span className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-400/10 text-cyan-300"><ShieldCheck size={21}/></span>
    {!compact && <span className="text-lg">Scam<span className="text-cyan-300">Saathi</span></span>}
  </Link>
}

function Button({ children, variant = 'primary', className = '', ...props }) {
  return <button className={`${variant === 'primary' ? 'btn-primary' : 'btn-secondary'} ${className}`} {...props}>{children}</button>
}

function Badge({ children, tone = 'neutral' }) {
  const tones = {
    high: 'border-rose-400/20 bg-rose-500/10 text-rose-300',
    medium: 'border-amber-400/20 bg-amber-500/10 text-amber-300',
    low: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300',
    live: 'border-rose-400/20 bg-rose-500/10 text-rose-300',
    neutral: 'border-white/10 bg-white/[0.05] text-slate-300',
    cyan: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300',
  }
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${tones[tone] || tones.neutral}`}>{tone === 'live' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400"/>}{children}</span>
}

function PageTitle({ eyebrow, title, description, action }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div><div className="eyebrow mb-2">{eyebrow}</div><h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>}</div>
    {action}
  </div>
}

function AppLayout({ children }) {
  const location = useLocation()
  const [mobileMenu, setMobileMenu] = useState(false)
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/audio-test', label: 'AI Scam Detector', icon: AudioLines },
    { to: '/history', label: 'Incident history', icon: History },
    { to: '/safety', label: 'Safety tips', icon: ShieldCheck },
  ]
  const workflow = [
    { label: 'Choose scenario', to: '/scenarios', n: '01' },
    { label: 'Select language', to: '/language', n: '02' },
    { label: 'Start call', to: '/call', n: '03' },
    { label: 'Live analysis', to: '/analysis', n: '04' },
    { label: 'Get guidance', to: '/guidance', n: '05' },
    { label: 'Save incident', to: '/incidents/new', n: '06' },
  ]
  const currentStep = workflow.findIndex(s => s.to === location.pathname)
  return <div className="min-h-screen bg-ink">
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#050b16]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[70px] max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8"><Logo/><div className="hidden items-center gap-1 md:flex">{navItems.map(item => <NavLink key={item.to} to={item.to} end={item.end} className={({isActive})=>`rounded-lg px-3 py-2 text-sm transition ${isActive?'bg-white/[0.07] text-white':'text-slate-400 hover:text-white'}`}>{item.label}</NavLink>)}</div></div>
        <div className="flex items-center gap-3"><div className="hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-2 text-xs text-emerald-300 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/> Live</div><button className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-slate-300" aria-label="Profile"><UserRound size={17}/></button><button className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 md:hidden" onClick={()=>setMobileMenu(!mobileMenu)} aria-label="Toggle menu"><Menu size={20}/></button></div>
      </div>
      {mobileMenu && <div className="border-t border-white/10 px-4 py-3 md:hidden">{navItems.map(item=><NavLink key={item.to} to={item.to} end={item.end} onClick={()=>setMobileMenu(false)} className="block rounded-lg px-3 py-3 text-sm text-slate-300">{item.label}</NavLink>)}</div>}
    </header>
    <div className="mx-auto flex max-w-[1600px]">
      <aside className="sticky top-[70px] hidden h-[calc(100vh-70px)] w-[245px] shrink-0 border-r border-white/[0.06] px-4 py-6 lg:block">
        <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Protection workflow</div>
        <div className="space-y-1">{workflow.map((step,i)=>{
          const active = location.pathname === step.to
          const complete = currentStep > i
          return <Link key={step.to} to={step.to} className={`group flex items-center gap-3 rounded-xl px-3 py-3 transition ${active?'border border-cyan-400/15 bg-cyan-400/[0.08] text-cyan-200':'text-slate-400 hover:bg-white/[0.04] hover:text-white'}`}>
            <span className={`grid h-7 w-7 place-items-center rounded-lg text-[10px] font-bold ${active?'bg-cyan-400 text-ink':complete?'bg-emerald-400/10 text-emerald-300':'bg-white/[0.05] text-slate-500'}`}>{complete?<Check size={14}/>:step.n}</span><span className="text-[13px] font-medium">{step.label}</span>{active&&<span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-300"/>}
          </Link>
        })}</div>
        <div className="mt-8 rounded-2xl border border-cyan-400/10 bg-gradient-to-br from-cyan-400/[0.08] to-violet-500/[0.06] p-4"><div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300"><LockKeyhole size={18}/></div><p className="text-sm font-semibold text-slate-200">Stay one step ahead</p><p className="mt-1 text-xs leading-5 text-slate-500">Never share OTPs, PINs, or passwords with an unverified caller.</p><Link to="/safety" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-cyan-300">Safety guide <ArrowRight size={13}/></Link></div>
        <div className="absolute bottom-5 left-7 right-5 text-[10px] text-slate-600">ScamSaathi prototype · Google stack planned</div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-7 sm:px-6 sm:py-9 lg:px-10">{children}<footer className="mt-12 flex flex-col justify-between gap-3 border-t border-white/[0.06] pt-5 text-[11px] text-slate-600 sm:flex-row"><span>© 2026 ScamSaathi · Demo prototype</span><span className="flex items-center gap-2"><Shield size={12}/> Built for safety awareness, not official fraud verification</span></footer></main>
    </div>
  </div>
}

function AppProvider({ children }) {
  const [scenarioId, setScenarioId] = useState(() => sessionStorage.getItem('ss.scenario') || 'kyc')
  const [language, setLanguage] = useState(() => sessionStorage.getItem('ss.language') || 'Hindi')
  const [incidents, setIncidents] = useState(() => {
    const saved = getIncidents()
    return saved.length ? saved : initialIncidents
  })
  const [transcript, setTranscript] = useState([])
  const [toast, setToast] = useState(null)
  const scenario = scenarios.find(s => s.id === scenarioId) || scenarios[0]
  const analysis = useMemo(() => analyzeScenario(scenario), [scenario])
  useEffect(() => { sessionStorage.setItem('ss.scenario', scenarioId) }, [scenarioId])
  useEffect(() => { sessionStorage.setItem('ss.language', language) }, [language])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])
  const addIncident = (incident) => {
    const saved = { ...incident, id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), date: new Date().toISOString() }
    saveIncident(saved)
    setIncidents(prev => [saved, ...prev])
    setToast({ type: 'success', message: 'Incident saved successfully' })
    return saved
  }
  const value = { scenarioId, setScenarioId, language, setLanguage, scenario, analysis, incidents, addIncident, transcript, setTranscript, toast, setToast }
  return <AppContext.Provider value={value}>{children}{toast&&<div role="status" className="fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-3 rounded-xl border border-emerald-400/20 bg-[#0d241f] px-4 py-3 text-sm text-emerald-200 shadow-2xl"><CheckCircle2 size={18}/>{toast.message}</div>}</AppContext.Provider>
}

function Landing() {
  const { incidents, setScenarioId } = useApp()
  const navigate = useNavigate()
  const features = [
    { icon: AudioLines, title: 'Voice-first protection', text: 'Understand suspicious conversations as they unfold.' },
    { icon: Languages, title: 'Made for India', text: 'Guidance designed for Hindi, Gujarati, and English.' },
    { icon: Fingerprint, title: 'Evidence, not guesses', text: 'See the phrases behind every demo warning.' },
  ]
  return <><section className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#081526] px-6 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
    <div className="hero-glow pointer-events-none absolute -right-24 -top-32 h-[430px] w-[430px] rounded-full bg-cyan-500/10 blur-[90px]"/><div className="pointer-events-none absolute -right-16 bottom-[-100px] h-[320px] w-[320px] rounded-full bg-violet-600/15 blur-[80px]"/>
    <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr]"><div><Badge tone="cyan"><Sparkles size={12}/> AI-powered scam awareness</Badge><h1 className="mt-6 max-w-2xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl xl:text-6xl">Your AI call companion <span className="text-gradient">against scams.</span></h1><p className="mt-5 max-w-xl text-base leading-7 text-slate-400">Detect suspicious pressure tactics, understand why they matter, and get clear next steps in a language you trust.</p><div className="mt-7 flex flex-wrap gap-3"><Button onClick={()=>navigate('/scenarios')}>Start protection <ArrowRight size={17}/></Button><Button variant="secondary" onClick={()=>navigate('/audio-test')}><AudioLines size={16}/> Analyze a recording</Button><Button variant="secondary" onClick={()=>navigate('/safety')}><ShieldCheck size={16}/> Explore safety tips</Button></div><div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400"><span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-cyan-300"/> Simulated call demo</span><span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-cyan-300"/> Multilingual guidance</span><span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-cyan-300"/> Incident history</span></div></div>
      <div className="relative mx-auto w-full max-w-[430px]"><div className="absolute inset-5 rounded-full bg-cyan-400/10 blur-3xl"/><div className="relative rounded-[28px] border border-cyan-300/15 bg-[#07111f]/90 p-5 shadow-glow"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300"><ShieldCheck size={18}/></span><span className="text-sm font-bold">ScamSaathi AI</span></div><Badge tone="live">DEMO READY</Badge></div><div className="my-8 flex justify-center"><div className="relative grid h-44 w-44 place-items-center rounded-full border border-cyan-300/30 bg-gradient-to-br from-cyan-400/10 to-violet-600/20"><div className="absolute inset-3 rounded-full border border-violet-400/20"/><div className="absolute inset-7 rounded-full border border-cyan-300/20"/><AudioLines size={62} className="text-cyan-300 drop-shadow-[0_0_18px_rgba(0,212,255,.55)]"/><span className="absolute -right-1 top-8 h-3 w-3 rounded-full bg-violet-400 shadow-[0_0_15px_#8b5cf6]"/><span className="absolute -left-2 bottom-12 h-2.5 w-2.5 rounded-full bg-cyan-300"/></div></div><div className="text-center"><div className="text-lg font-bold">Listen. Understand. Stay safe.</div><p className="mt-1 text-xs text-slate-500">A calmer response to suspicious calls.</p></div><div className="mt-5 rounded-xl border border-rose-400/15 bg-rose-400/[0.06] p-3"><div className="flex items-center gap-2 text-sm font-semibold text-rose-300"><TriangleAlert size={16}/> Example warning sign</div><p className="mt-1 text-xs leading-5 text-slate-400">“Please share your OTP or your account will be blocked.”</p></div><div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-xl bg-white/[0.04] p-3 text-center"><ShieldCheck className="mx-auto text-cyan-300" size={17}/><p className="mt-2 text-[10px] text-slate-400">Detect</p></div><div className="rounded-xl bg-white/[0.04] p-3 text-center"><MessageCircle className="mx-auto text-violet-300" size={17}/><p className="mt-2 text-[10px] text-slate-400">Explain</p></div><div className="rounded-xl bg-white/[0.04] p-3 text-center"><Zap className="mx-auto text-emerald-300" size={17}/><p className="mt-2 text-[10px] text-slate-400">Act safely</p></div></div></div></div>
    </div>
  </section>
  <section className="mt-9"><div className="mb-5 flex items-end justify-between gap-3"><div><div className="eyebrow">How we help</div><h2 className="mt-2 text-2xl font-bold">Protection that explains itself</h2></div><span className="hidden text-xs text-slate-500 sm:block">Built for everyday users</span></div><div className="grid gap-4 md:grid-cols-3">{features.map(({icon:Icon,title,text},i)=><div key={title} className="surface p-5"><div className={`mb-4 grid h-11 w-11 place-items-center rounded-xl ${i===0?'bg-cyan-400/10 text-cyan-300':i===1?'bg-violet-400/10 text-violet-300':'bg-emerald-400/10 text-emerald-300'}`}><Icon size={21}/></div><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{text}</p></div>)}</div></section>
  <section className="mt-10"><div className="mb-5 flex items-end justify-between"><div><div className="eyebrow">Try a demo</div><h2 className="mt-2 text-2xl font-bold">Choose a scenario</h2></div><button onClick={()=>navigate('/scenarios')} className="flex items-center gap-1 text-sm font-semibold text-cyan-300">View all <ArrowRight size={15}/></button></div><div className="grid gap-4 md:grid-cols-3">{scenarios.map(s=><ScenarioCard key={s.id} scenario={s} onSelect={()=>{setScenarioId(s.id);navigate('/language')}}/>)}</div></section>
  <section className="mt-10 grid gap-4 md:grid-cols-[1fr_1fr]"><div className="surface p-5"><div className="flex items-center justify-between"><h3 className="font-bold">Recent incidents</h3><Link to="/history" className="text-xs text-cyan-300">View history <ArrowRight size={13} className="inline"/></Link></div><div className="mt-4 space-y-3">{incidents.slice(0,2).map(i=><IncidentRow key={i.id} incident={i}/>)}</div></div><div className="surface flex items-center gap-4 p-5"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300"><LockKeyhole size={23}/></div><div><h3 className="font-bold">Pause before you share</h3><p className="mt-1 text-sm leading-6 text-slate-400">Never share OTPs, PINs, passwords, or remote-access permissions with an unverified caller.</p><Link to="/safety" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-cyan-300">Read safety guide <ArrowRight size={13}/></Link></div></div></section></>
}

function ScenarioCard({ scenario, onSelect, selected = false }) {
  const Icon = iconMap[scenario.icon] || ShieldAlert
  const color = scenario.tone === 'cyan' ? 'text-cyan-300 bg-cyan-400/10 border-cyan-300/20' : scenario.tone === 'violet' ? 'text-violet-300 bg-violet-400/10 border-violet-300/20' : 'text-amber-300 bg-amber-400/10 border-amber-300/20'
  return <div className={`surface flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/20 ${selected?'border-cyan-300/40 ring-1 ring-cyan-300/10':''}`}><div className={`grid h-12 w-12 place-items-center rounded-2xl border ${color}`}><Icon size={22}/></div><div className="mt-4 flex items-center justify-between gap-2"><h3 className="font-bold">{scenario.title}</h3><Badge tone={scenario.risk.toLowerCase()}>{scenario.risk} risk</Badge></div><p className="mt-1 text-xs text-slate-500">{scenario.subtitle}</p><p className="mt-3 flex-1 text-sm leading-6 text-slate-400">{scenario.description}</p><Button className="mt-5 w-full" onClick={onSelect}>Select scenario <ArrowRight size={15}/></Button></div>
}

function ScenariosPage() {
  const { scenarioId, setScenarioId } = useApp()
  const navigate = useNavigate()
  return <><PageTitle eyebrow="Step 01 · Scenario" title="Choose a demo scenario" description="Experience how ScamSaathi responds to common suspicious-call patterns. All scenarios are simulated."/><div className="grid gap-4 xl:grid-cols-3">{scenarios.map(s=><ScenarioCard key={s.id} scenario={s} selected={scenarioId===s.id} onSelect={()=>{setScenarioId(s.id);navigate('/language')}}/>)}</div><div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-400/10 bg-amber-400/[0.04] p-4 text-xs leading-5 text-slate-400"><TriangleAlert size={17} className="mt-0.5 shrink-0 text-amber-300"/> These scenarios are fictional examples for awareness and testing. A warning is not proof that a real caller is fraudulent.</div></>
}

function LanguagePage() {
  const { language, setLanguage } = useApp()
  const navigate = useNavigate()
  const languages = [{name:'Hindi',native:'हिन्दी',region:'भारत',flag:'🇮🇳'},{name:'Gujarati',native:'ગુજરાતી',region:'ગુજરાત',flag:'🇮🇳'},{name:'English',native:'English',region:'Global',flag:'🌐'}]
  return <><PageTitle eyebrow="Step 02 · Language" title="Choose your language" description="Select the language you want ScamSaathi to use for its demo guidance."/><div className="grid max-w-4xl gap-4 md:grid-cols-3">{languages.map(l=><button key={l.name} onClick={()=>setLanguage(l.name)} className={`relative rounded-2xl border p-6 text-left transition ${language===l.name?'border-cyan-300/50 bg-cyan-400/[0.07] shadow-glow':'border-white/[0.08] bg-[#0b1728] hover:border-white/20'}`}><div className="flex items-center justify-between"><span className="text-3xl">{l.flag}</span>{language===l.name&&<span className="grid h-6 w-6 place-items-center rounded-full bg-cyan-400 text-ink"><Check size={14}/></span>}</div><div className="mt-8 text-xl font-bold">{l.native}</div><div className="mt-1 text-sm text-slate-400">{l.name}</div><div className="mt-4 text-xs text-slate-600">{l.region}</div></button>)}</div><div className="mt-7 flex max-w-4xl flex-col justify-between gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:flex-row sm:items-center"><div><div className="font-semibold">Selected language: {language}</div><p className="mt-1 text-xs text-slate-500">This prototype uses sample text. Live multilingual AI will be integrated separately.</p></div><Button onClick={()=>navigate('/call')}>Continue to call <ArrowRight size={16}/></Button></div></>
}

function CallSimulatorPage() {
  const { scenario, language, setTranscript, setToast } = useApp()
  const navigate = useNavigate()
  const simulation = useCallSimulation(scenario.transcript)
  const [muted, setMuted] = useState(false)
  const [startedAt, setStartedAt] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!simulation.active || !startedAt) return
    const timer = window.setInterval(()=>setElapsed(Math.floor((Date.now()-startedAt)/1000)), 1000)
    return ()=>window.clearInterval(timer)
  }, [simulation.active, startedAt])
  useEffect(() => {
    if (simulation.index >= 0) setTranscript(simulation.visibleMessages)
  }, [simulation.index, simulation.visibleMessages.length, setTranscript])
  useEffect(() => {
    if (!simulation.active && simulation.index === scenario.transcript.length - 1) {
      setTranscript(scenario.transcript)
      setToast({type:'info',message:'Demo call completed. Review the analysis.'})
    }
  }, [simulation.active, simulation.index, scenario, setTranscript, setToast])
  const start = () => { setElapsed(0); setStartedAt(Date.now()); simulation.start(); setTranscript([]) }
  const end = () => { simulation.stop(); setTranscript(simulation.visibleMessages); setToast({type:'info',message:'Call simulation ended'}); }
  const mmss = `${String(Math.floor(elapsed/60)).padStart(2,'0')}:${String(elapsed%60).padStart(2,'0')}`
  return <><PageTitle eyebrow="Step 03 · Call simulator" title="Experience a suspicious call" description="Run a fictional scenario. No real telephone call is placed or intercepted." action={<Badge tone={simulation.active?'live':'cyan'}>{simulation.active?'SIMULATION LIVE':'SIMULATED CALL'}</Badge>}/><div className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]"><section className="surface flex min-h-[460px] flex-col items-center justify-center p-6 text-center"><div className="mb-5 grid h-20 w-20 place-items-center rounded-3xl border border-white/10 bg-white/[0.04] text-slate-300"><UserRound size={36}/></div><h2 className="text-xl font-bold">{scenario.caller}</h2><p className="mt-1 text-sm text-slate-500">{scenario.phone}</p><div className="mt-5 font-mono text-2xl tabular-nums">{mmss}</div><p className="mt-1 text-xs text-slate-500">{simulation.active?'Demo audio scenario is playing':'Ready when you are'}</p><div className={`waveform my-8 ${simulation.active?'is-active':''}`} aria-label={simulation.active?'Audio simulation active':'Audio simulation idle'}>{Array.from({length:31},(_,i)=><span key={i} style={{'--i':i}}/>)}</div><div className="flex items-center gap-4"><button onClick={()=>setMuted(!muted)} className={`grid h-12 w-12 place-items-center rounded-full border ${muted?'border-amber-400/30 bg-amber-400/10 text-amber-300':'border-white/10 bg-white/[0.05] text-slate-300'}`} aria-label={muted?'Unmute demo':'Mute demo'}>{muted?<MicOff size={19}/>:<Mic size={19}/>}</button>{!simulation.active?<button onClick={start} className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-900/30" aria-label="Start call simulation"><Play size={24} fill="currentColor"/></button>:<button onClick={end} className="grid h-16 w-16 place-items-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-950/40" aria-label="End call simulation"><Square size={20} fill="currentColor"/></button>}<button onClick={()=>setToast({type:'info',message:'This is a scripted demo; no live audio is sent.'})} className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-slate-300" aria-label="Audio information"><Volume2 size={19}/></button></div><p className="mt-6 max-w-xs text-xs leading-5 text-slate-500">Language: {language}. This version simulates transcript timing; Gemini Live is not connected yet.</p></section><section className="surface p-5 sm:p-6"><div className="flex items-center justify-between border-b border-white/[0.07] pb-4"><div><h2 className="font-bold">Call transcript</h2><p className="mt-1 text-xs text-slate-500">{simulation.visibleMessages.length} of {scenario.transcript.length} sample messages</p></div><Badge tone={simulation.active?'live':'neutral'}>{simulation.active?'LIVE DEMO':'SAMPLE'}</Badge></div><div className="mt-5 space-y-3">{simulation.visibleMessages.length===0?<div className="grid min-h-[260px] place-items-center text-center"><div><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300"><MessageCircle size={22}/></div><p className="mt-3 text-sm font-semibold">Transcript will appear here</p><p className="mt-1 text-xs text-slate-500">Start the simulated call to reveal the dialogue.</p></div></div>:simulation.visibleMessages.map((m,i)=><TranscriptBubble key={`${m.time}-${i}`} message={m}/>)}</div>{!simulation.active&&simulation.index===scenario.transcript.length-1&&<div className="mt-5 rounded-xl border border-rose-400/15 bg-rose-400/[0.05] p-4"><div className="flex items-center gap-2 text-sm font-bold text-rose-300"><TriangleAlert size={17}/> Suspicious indicators found</div><p className="mt-1 text-xs leading-5 text-slate-400">Continue to review the evidence and safe next steps.</p><Button className="mt-4 w-full" onClick={()=>navigate('/analysis')}>Review analysis <ArrowRight size={15}/></Button></div>}{!simulation.active&&simulation.index>=0&&simulation.index<scenario.transcript.length-1&&<Button className="mt-4 w-full" onClick={start}>Replay full demo <Play size={15}/></Button>}</section></div></>
}

function TranscriptBubble({ message }) {
  const caller = message.speaker === 'Caller'
  return <div className={`flex gap-3 ${caller?'':'flex-row-reverse'}`}><div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${caller?'bg-rose-400/10 text-rose-300':'bg-cyan-400/10 text-cyan-300'}`}><UserRound size={15}/></div><div className={`max-w-[88%] rounded-2xl border p-3 ${caller?'border-rose-400/10 bg-rose-400/[0.05]':'border-cyan-400/10 bg-cyan-400/[0.05]'}`}><div className={`mb-1 flex items-center gap-2 text-[10px] font-bold ${caller?'text-rose-300':'text-cyan-300'}`}>{message.speaker}<span className="font-normal text-slate-600">{message.time}</span></div><p className="text-sm leading-6 text-slate-300">{message.text}</p></div></div>
}

function AnalysisPage() {
  const { scenario, analysis, transcript } = useApp()
  const navigate = useNavigate()
  const shownTranscript = transcript.length ? transcript : scenario.transcript
  return <><PageTitle eyebrow="Step 04 · Evidence review" title="Scam analysis" description="Review the phrases and context behind this simulated risk assessment." action={<Badge tone="neutral">Simulated analysis</Badge>}/><div className={`mb-5 rounded-2xl border p-5 sm:p-6 ${analysis.risk==='High'?'border-rose-400/20 bg-gradient-to-r from-rose-500/[0.13] to-rose-500/[0.04]':'border-amber-400/20 bg-gradient-to-r from-amber-500/[0.1] to-amber-500/[0.03]'}`}><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-400/10 text-rose-300"><AlertOctagon size={24}/></div><div><div className="text-xl font-black tracking-tight">{analysis.risk==='High'?'Suspicious scam indicators detected':'Caution: verify this request'}</div><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{analysis.explanation}</p></div></div><Badge tone={analysis.risk.toLowerCase()}>{analysis.risk} risk</Badge></div></div><div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]"><section className="surface p-5"><div className="flex items-center justify-between"><h2 className="font-bold">Suspicious phrases</h2><Badge tone="cyan">{analysis.phrases.length} indicators</Badge></div><p className="mt-1 text-xs text-slate-500">Phrases from the sample transcript, not an independently verified recording.</p><div className="mt-5 space-y-3">{analysis.phrases.map((p,i)=><div key={p.phrase} className="rounded-xl border border-rose-400/10 bg-rose-400/[0.04] p-4"><div className="flex items-start gap-3"><div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-rose-400/10 text-rose-300"><TriangleAlert size={14}/></div><div><p className="text-sm font-bold text-rose-200">“{p.phrase}”</p><p className="mt-2 text-xs leading-5 text-slate-400">{p.reason}</p></div></div></div>)}</div></section><section className="space-y-5"><div className="surface p-5"><h2 className="flex items-center gap-2 font-bold"><MessageCircle size={17} className="text-cyan-300"/> Why it matters</h2><ul className="mt-4 space-y-3">{['Creates pressure to act quickly','Requests sensitive information or money','Discourages independent verification'].map(t=><li key={t} className="flex gap-2.5 text-sm text-slate-300"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400"/>{t}</li>)}</ul></div><div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.05] p-5"><h2 className="flex items-center gap-2 font-bold text-emerald-200"><ShieldCheck size={18}/> Recommended next step</h2><p className="mt-3 text-sm leading-6 text-slate-300">{analysis.action}</p></div><div className="rounded-xl border border-amber-400/10 bg-amber-400/[0.04] p-4 text-xs leading-5 text-slate-400"><TriangleAlert size={14} className="mr-2 inline text-amber-300"/> This is a sample rule-based analysis, not a live Gemini result or a verified fraud determination.</div></section></div><div className="mt-6 flex flex-wrap justify-end gap-3"><Button variant="secondary" onClick={()=>navigate('/call')}><ArrowLeft size={15}/> Back to transcript</Button><Button onClick={()=>navigate('/guidance')}>Get safety guidance <ArrowRight size={15}/></Button></div><details className="surface mt-6 p-5"><summary className="cursor-pointer text-sm font-semibold">View transcript used for this analysis</summary><div className="mt-4 space-y-3">{shownTranscript.map((m,i)=><TranscriptBubble key={`${m.time}-${i}`} message={m}/>)}</div></details></>
}

const guidanceText = {
  Hindi: 'यह एक संदिग्ध कॉल हो सकती है। किसी भी कॉलर को OTP, PIN या पासवर्ड न बताएं। कॉल काटें और बैंक के आधिकारिक ऐप या वेबसाइट पर दिए गए नंबर से संपर्क करें।',
  Gujarati: 'આ શંકાસ્પદ કૉલ હોઈ શકે છે. કોઈને પણ OTP, PIN અથવા પાસવર્ડ આપશો નહીં. કૉલ બંધ કરો અને બેંકની સત્તાવાર એપ અથવા વેબસાઇટ પર આપેલા નંબરથી સંપર્ક કરો.',
  English: 'This call has suspicious warning signs. Do not share an OTP, PIN, or password. End the call and contact your bank using the official number in its app or website.',
}
function GuidancePage() {
  const { language, scenario, analysis, setToast } = useApp()
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([{role:'assistant',text:guidanceText[language]}])
  const [speaking, setSpeaking] = useState(false)
  useEffect(()=>{setMessages([{role:'assistant',text:guidanceText[language]}])},[language])
  useEffect(()=>()=>{if('speechSynthesis' in window)window.speechSynthesis.cancel()},[])
  const questions = language==='Hindi'?['मुझे अभी क्या करना चाहिए?','मैं अपने बैंक से कैसे पुष्टि करूँ?','अगर वे फिर से कॉल करें तो?']:language==='Gujarati'?['હવે મારે શું કરવું જોઈએ?','હું મારી બેંકની પુષ્ટિ કેવી રીતે કરું?','ફરીથી કૉલ આવે તો શું કરું?']:['What should I do now?','How can I verify my bank?','What if they call again?']
  const answer = (q) => {
    const lower=q.toLowerCase()
    if(lower.includes('otp')||lower.includes('share')||lower.includes('કોડ')) return language==='Hindi'?'OTP या कोई भी गोपनीय कोड साझा न करें। बैंक के आधिकारिक चैनल से स्वतंत्र रूप से पुष्टि करें।':language==='Gujarati'?'OTP અથવા કોઈપણ ગુપ્ત કોડ શેર કરશો નહીં. બેંકની સત્તાવાર ચેનલથી સ્વતંત્ર રીતે ખાતરી કરો.':'Never share an OTP or secret code. Verify independently through your bank’s official channel.'
    if(lower.includes('bank')||lower.includes('बैंक')||lower.includes('બેંક')) return language==='Hindi'?'कॉल काटें और बैंक की आधिकारिक ऐप, कार्ड या वेबसाइट पर दिए गए नंबर से संपर्क करें। कॉलर द्वारा दिए गए नंबर पर भरोसा न करें।':language==='Gujarati'?'કૉલ બંધ કરો અને બેંકની સત્તાવાર એપ, કાર્ડ અથવા વેબસાઇટ પર આપેલા નંબરથી સંપર્ક કરો. કૉલરે આપેલા નંબર પર આધાર રાખશો નહીં.':'End the call and contact your bank using the number in its official app, card, or website. Do not rely on a number supplied by the caller.'
    return guidanceText[language]
  }
  const ask = (q=question) => {
    const clean=q.trim()
    if(!clean)return
    setMessages(prev=>[...prev,{role:'user',text:clean},{role:'assistant',text:answer(clean)}])
    setQuestion('')
  }
  const speak = () => {
    if(!('speechSynthesis' in window)){setToast({type:'info',message:'Speech synthesis is not available in this browser.'});return}
    if(speaking){window.speechSynthesis.cancel();setSpeaking(false);return}
    const utterance = new SpeechSynthesisUtterance(guidanceText[language])
    utterance.lang = language==='Hindi'?'hi-IN':language==='Gujarati'?'gu-IN':'en-IN'
    utterance.onend=()=>setSpeaking(false)
    utterance.onerror=()=>setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }
  return <><PageTitle eyebrow="Step 05 · Safety guidance" title="Get clear, calm guidance" description="Ask a question and explore the safest next step. Sample responses are used in this prototype."/><div className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]"><section className="surface flex flex-col items-center justify-center p-7 text-center"><div className={`voice-orb ${speaking?'speaking':''}`}><AudioLines size={42}/></div><Badge tone="cyan" >{speaking?'BROWSER DEMO VOICE':`GUIDANCE · ${language.toUpperCase()}`}</Badge><h2 className="mt-5 text-xl font-bold">ScamSaathi is here to help</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">{guidanceText[language]}</p><div className="mt-5 flex gap-3"><Button onClick={speak}>{speaking?<VolumeX size={16}/>:<Volume2 size={16}/>} {speaking?'Stop voice':'Play demo response'}</Button><Button variant="secondary" onClick={()=>{window.speechSynthesis?.cancel();setSpeaking(false)}}><Square size={14}/> Stop</Button></div><p className="mt-5 max-w-xs text-[11px] leading-5 text-slate-600">Uses your browser's speech synthesis when available. This is not Gemini Live voice.</p></section><section className="surface flex min-h-[480px] flex-col p-5"><div className="flex items-center gap-3 border-b border-white/[0.07] pb-4"><div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-400/10 text-violet-300"><MessageCircle size={19}/></div><div><h2 className="font-bold">Ask a follow-up question</h2><p className="mt-1 text-xs text-slate-500">Sample safety assistant · {language}</p></div></div><div className="flex-1 space-y-3 overflow-y-auto py-4">{messages.map((m,i)=><div key={i} className={`flex ${m.role==='user'?'justify-end':''}`}><div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${m.role==='user'?'bg-cyan-500/15 text-cyan-100':'border border-white/[0.07] bg-white/[0.035] text-slate-300'}`}>{m.text}</div></div>)}</div><div className="mb-3 flex flex-wrap gap-2">{questions.map(q=><button key={q} onClick={()=>ask(q)} className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-200">{q}</button>)}</div><form onSubmit={e=>{e.preventDefault();ask()}} className="flex gap-2"><input className="field" value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Type your question…" aria-label="Ask a safety question"/><Button type="submit" disabled={!question.trim()}><ArrowRight size={17}/></Button></form></section></div><div className="mt-6 flex justify-end"><Button onClick={()=>navigate('/incidents/new')}>Save incident <ArrowRight size={15}/></Button></div></>
}

function NewIncidentPage() {
  const { scenario, language, analysis, addIncident } = useApp()
  const navigate = useNavigate()
  const [title,setTitle]=useState(scenario.title)
  const [notes,setNotes]=useState('')
  const [summary,setSummary]=useState(`${scenario.explanation} Recommended action: ${scenario.action}`)
  const [risk,setRisk]=useState(analysis.risk)
  const [error,setError]=useState('')
  const submit=(e)=>{e.preventDefault();if(!title.trim()||!summary.trim()){setError('Please provide an incident title and summary.');return}addIncident({title:title.trim(),scenario:scenario.title,risk,summary:summary.trim(),phrases:analysis.phrases.map(p=>p.phrase),language,notes:notes.trim()});navigate('/history')}
  return <><PageTitle eyebrow="Step 06 · Incident record" title="Save incident" description="Create a local demo record so you can review the details later."/><form onSubmit={submit} className="grid gap-5 xl:grid-cols-[1fr_330px]"><section className="surface space-y-5 p-5 sm:p-7"><div><label className="mb-2 block text-sm font-semibold" htmlFor="incident-title">Incident title</label><input id="incident-title" className="field" value={title} onChange={e=>setTitle(e.target.value)} required maxLength={100}/></div><div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-sm font-semibold" htmlFor="scenario">Scenario</label><input id="scenario" className="field" value={scenario.title} readOnly/></div><div><label className="mb-2 block text-sm font-semibold" htmlFor="language">Guidance language</label><input id="language" className="field" value={language} readOnly/></div></div><div><label className="mb-2 block text-sm font-semibold" htmlFor="risk">Risk level</label><select id="risk" className="field" value={risk} onChange={e=>setRisk(e.target.value)}><option>High</option><option>Medium</option><option>Low</option></select></div><div><label className="mb-2 block text-sm font-semibold" htmlFor="summary">Incident summary</label><textarea id="summary" className="field min-h-32 resize-y" value={summary} onChange={e=>setSummary(e.target.value)} required maxLength={2000}/></div><div><label className="mb-2 block text-sm font-semibold" htmlFor="notes">Notes <span className="font-normal text-slate-500">(optional)</span></label><textarea id="notes" className="field min-h-24 resize-y" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Add context without including passwords, OTPs, or other secrets." maxLength={1000}/></div>{error&&<p role="alert" className="text-sm text-rose-300">{error}</p>}<div className="flex flex-wrap justify-end gap-3"><Button type="button" variant="secondary" onClick={()=>navigate('/guidance')}>Cancel</Button><Button type="submit"><CheckCircle2 size={16}/> Save incident</Button></div></section><aside className="space-y-4"><div className="surface p-5"><div className="flex items-center gap-2 font-bold"><ShieldCheck size={18} className="text-cyan-300"/> Record preview</div><div className="mt-4 space-y-4 text-sm"><div><div className="text-xs text-slate-500">Detected phrases</div><div className="mt-2 flex flex-wrap gap-2">{analysis.phrases.slice(0,3).map(p=><span key={p.phrase} className="rounded-lg bg-rose-400/10 px-2 py-1 text-[11px] text-rose-200">{p.phrase}</span>)}</div></div><div><div className="text-xs text-slate-500">Created</div><div className="mt-1 text-slate-300">When you save</div></div><div><div className="text-xs text-slate-500">Storage</div><div className="mt-1 text-slate-300">Browser localStorage demo</div></div></div></div><div className="rounded-2xl border border-amber-400/10 bg-amber-400/[0.04] p-4 text-xs leading-5 text-slate-400"><LockKeyhole size={15} className="mr-1.5 inline text-amber-300"/> Do not include OTPs, PINs, passwords, or sensitive personal information in notes.</div></aside></form></>
}

function IncidentRow({ incident, onClick }) {
  const tone = (incident.risk||'Medium').toLowerCase()
  return <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition hover:bg-white/[0.04]"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone==='high'?'bg-rose-400/10 text-rose-300':tone==='medium'?'bg-amber-400/10 text-amber-300':'bg-emerald-400/10 text-emerald-300'}`}><ShieldAlert size={18}/></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{incident.title}</div><div className="mt-1 truncate text-xs text-slate-500">{incident.scenario} · {formatDate(incident.date)}</div></div><Badge tone={tone}>{incident.risk}</Badge></button>
}
function formatDate(value) { const d=new Date(value); return Number.isNaN(d.getTime())?'Date unavailable':d.toLocaleString([], {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) }

function IncidentHistoryPage() {
  const { incidents } = useApp()
  const [search,setSearch]=useState('')
  const [risk,setRisk]=useState('All')
  const [selected,setSelected]=useState(null)
  const filtered=incidents.filter(i=>(i.title+' '+i.scenario+' '+i.summary).toLowerCase().includes(search.toLowerCase())&&(risk==='All'||i.risk===risk))
  return <><PageTitle eyebrow="Your records" title="Incident history" description="Review saved demo incidents. Records stay in this browser until its local storage is cleared." action={<Badge>{incidents.length} records</Badge>}/><div className="surface mb-5 flex flex-col gap-3 p-4 sm:flex-row"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input className="field pl-9" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search incidents…" aria-label="Search incidents"/></div><select className="field sm:w-44" value={risk} onChange={e=>setRisk(e.target.value)} aria-label="Filter by risk"><option>All</option><option>High</option><option>Medium</option><option>Low</option></select></div><div className="grid gap-4 xl:grid-cols-[1fr_340px]"><section className="surface p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold">Saved records</h2><span className="text-xs text-slate-500">{filtered.length} results</span></div>{filtered.length?<div className="space-y-3">{filtered.map(i=><IncidentRow key={i.id} incident={i} onClick={()=>setSelected(i)}/>)}</div>:<div className="grid min-h-64 place-items-center text-center"><div><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.04] text-slate-400"><FileText size={22}/></div><p className="mt-3 font-semibold">No incidents found</p><p className="mt-1 text-xs text-slate-500">Try another search or save a new incident.</p></div></div>}</section><aside className="surface min-h-64 p-5"><div className="flex items-center justify-between"><h2 className="font-bold">Incident details</h2>{selected&&<button onClick={()=>setSelected(null)} className="text-slate-500 hover:text-white" aria-label="Close details"><X size={16}/></button>}</div>{selected?<div className="mt-5"><Badge tone={(selected.risk||'Medium').toLowerCase()}>{selected.risk} risk</Badge><h3 className="mt-3 text-lg font-bold">{selected.title}</h3><p className="mt-1 text-xs text-slate-500">{formatDate(selected.date)}</p><p className="mt-4 text-sm leading-6 text-slate-300">{selected.summary}</p>{selected.phrases?.length>0&&<><h4 className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-500">Phrases</h4><div className="mt-2 space-y-2">{selected.phrases.map(p=><p key={p} className="rounded-lg bg-rose-400/[0.05] p-2 text-xs text-rose-200">{p}</p>)}</div></>}{selected.notes&&<p className="mt-4 text-xs text-slate-400">{selected.notes}</p>}</div>:<div className="grid min-h-52 place-items-center text-center"><div><Clock3 size={24} className="mx-auto text-slate-600"/><p className="mt-3 text-sm text-slate-400">Select a record to see its details.</p></div></div>}</aside></div><p className="mt-5 text-xs leading-5 text-slate-600">Some initial records are sample data. They are not reports of verified real incidents.</p></>
}

const safetySections = [
  { icon: LockKeyhole, title: 'Banking and OTP safety', tone: 'cyan', tips: ['Never share OTPs, PINs, passwords, or CVV with a caller.', 'Do not install remote-access apps at a stranger’s request.', 'Check transactions using your bank’s official app or website.'] },
  { icon: Landmark, title: 'Fake KYC messages', tone: 'violet', tips: ['Do not act on account-blocking threats without verification.', 'Open your bank app directly instead of following an unexpected link.', 'Contact the bank through a number you obtained independently.'] },
  { icon: ShieldAlert, title: 'Digital arrest threats', tone: 'rose', tips: ['Do not transfer money because someone threatens arrest.', 'Be cautious if a caller tells you to keep the conversation secret.', 'Contact a trusted person and verify official claims independently.'] },
  { icon: Package, title: 'Courier and parcel scams', tone: 'amber', tips: ['Check tracking through the courier’s official site or app.', 'Be cautious of unexpected release fees or verification codes.', 'Do not use contact details supplied only by the suspicious caller.'] },
]
function SafetyTipsPage() {
  const [expanded,setExpanded]=useState(0)
  return <><PageTitle eyebrow="Stay informed" title="Simple safety tips" description="Small steps can help you pause, verify, and avoid pressure-based fraud attempts."/><div className="mb-6 rounded-2xl border border-cyan-400/15 bg-gradient-to-r from-cyan-400/[0.08] to-violet-400/[0.04] p-5 sm:p-6"><div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300"><ShieldCheck size={24}/></div><div><h2 className="text-lg font-bold">Pause. Verify. Then act.</h2><p className="mt-2 text-sm leading-6 text-slate-400">Scammers often rely on urgency and fear. You can end a suspicious call and independently contact the relevant organization before taking action.</p></div></div></div><div className="space-y-3">{safetySections.map((s,i)=>{const Icon=s.icon;const open=expanded===i;return <section key={s.title} className="surface overflow-hidden"><button onClick={()=>setExpanded(open?-1:i)} className="flex w-full items-center gap-4 p-5 text-left"><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${s.tone==='cyan'?'bg-cyan-400/10 text-cyan-300':s.tone==='violet'?'bg-violet-400/10 text-violet-300':s.tone==='rose'?'bg-rose-400/10 text-rose-300':'bg-amber-400/10 text-amber-300'}`}><Icon size={21}/></div><span className="flex-1 font-bold">{s.title}</span><ChevronDown size={18} className={`text-slate-500 transition ${open?'rotate-180':''}`}/></button>{open&&<div className="border-t border-white/[0.06] px-5 pb-5 pt-4"><ul className="space-y-3">{s.tips.map(t=><li key={t} className="flex gap-3 text-sm leading-6 text-slate-300"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-300"/>{t}</li>)}</ul></div>}</section>})}</div><div className="mt-6 rounded-xl border border-amber-400/10 bg-amber-400/[0.04] p-4 text-xs leading-5 text-slate-400"><CircleHelp size={15} className="mr-2 inline text-amber-300"/> This is general awareness guidance, not official legal or financial advice. For urgent threats or suspected financial loss, contact the appropriate official support channels.</div></>
}

function NotFound() { return <div className="surface mx-auto max-w-xl p-10 text-center"><div className="eyebrow">404 · Not found</div><h1 className="mt-3 text-3xl font-bold">This page doesn't exist</h1><p className="mt-2 text-sm text-slate-400">Let's get you back to safety.</p><Link to="/" className="btn-primary mt-6">Back to dashboard <ArrowRight size={16}/></Link></div> }

export default function App() {
  return <AppProvider><AppLayout><Routes>
    <Route path="/" element={<Landing/>}/>
    <Route path="/scenarios" element={<ScenariosPage/>}/>
    <Route path="/language" element={<LanguagePage/>}/>
    <Route path="/call" element={<CallSimulatorPage/>}/>
    <Route path="/analysis" element={<AnalysisPage/>}/>
    <Route path="/guidance" element={<GuidancePage/>}/>
    <Route path="/incidents/new" element={<NewIncidentPage/>}/>
    <Route path="/history" element={<IncidentHistoryPage/>}/>
    <Route path="/safety" element={<SafetyTipsPage/>}/>
    <Route path="/audio-test" element={<AudioTest />} />
    <Route path="*" element={<NotFound/>}/>
  </Routes></AppLayout></AppProvider>
}