
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ViewState, 
  Teacher, 
  DutySlot, 
  DutyCategory, 
  AppSettings,
  Day 
} from './types';
import { 
  INITIAL_TEACHERS, 
  INITIAL_SLOTS, 
  CATEGORIES, 
  DAYS 
} from './constants';
import { getGoogleCalendarLink } from './utils';
import { 
  Calendar, 
  Users, 
  Settings, 
  LayoutDashboard, 
  Plus, 
  Trash2, 
  ExternalLink, 
  BarChart3,
  Search,
  CheckCircle2,
  ChevronRight,
  Clock,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Github,
  Upload,
  Database,
  RefreshCw,
  Eraser,
  // Added missing Download icon
  Download
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

const App: React.FC = () => {
  // State
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem('dm_teachers');
    return saved ? JSON.parse(saved) : INITIAL_TEACHERS;
  });
  const [slots, setSlots] = useState<DutySlot[]>(() => {
    const saved = localStorage.getItem('dm_slots');
    return saved ? JSON.parse(saved) : INITIAL_SLOTS;
  });
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('dm_settings');
    const defaultSettings = {
      schoolName: 'Sekolah Tinta',
      logoUrl: 'https://cdn-icons-png.flaticon.com/512/2854/2854580.png',
      primaryColor: '#2563eb',
      backgroundUrl: 'https://images.unsplash.com/photo-1510070112810-d4e9a46d9e91?q=80&w=2069&auto=format&fit=crop',
      adminPassword: 'Tinta12345'
    };
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [newTeacherName, setNewTeacherName] = useState('');

  // Persist state
  useEffect(() => { localStorage.setItem('dm_teachers', JSON.stringify(teachers)); }, [teachers]);
  useEffect(() => { localStorage.setItem('dm_slots', JSON.stringify(slots)); }, [slots]);
  useEffect(() => { localStorage.setItem('dm_settings', JSON.stringify(settings)); }, [settings]);

  // Calculations
  const teacherWorkload = useMemo(() => {
    return teachers.map(t => ({
      name: t.name,
      duties: slots.filter(s => s.categoryId !== 'arrival' && s.teacherIds.includes(t.id)).length
    })).sort((a, b) => b.duties - a.duties);
  }, [teachers, slots]);

  const teacherDuties = useMemo(() => {
    if (!selectedTeacherId) return [];
    return slots.filter(s => s.teacherIds.includes(selectedTeacherId))
                .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day));
  }, [selectedTeacherId, slots]);

  // Helper: Get Day from Date string
  const getDayFromDate = (dateStr: string): Day => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Monday';
      const dayNames: Day[] = ['Monday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Monday'];
      const dayIdx = date.getDay();
      return dayNames[dayIdx] || 'Monday';
    } catch {
      return 'Monday';
    }
  };

  // Data Export/Import Actions
  const handleExportData = () => {
    const data = { teachers, slots, settings, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DutyMaster_Backup_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.teachers && json.slots && json.settings) {
          if (confirm('Amaran: Semua data sedia ada akan diganti. Teruskan?')) {
            setTeachers(json.teachers);
            setSlots(json.slots);
            setSettings(json.settings);
            alert('Data berjaya diimport!');
          }
        }
      } catch { alert('Fail tidak sah.'); }
    };
    reader.readAsText(file);
  };

  // Login Logic
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === settings.adminPassword) {
      setIsAdminAuthenticated(true);
      setLoginError(false);
    } else { setLoginError(true); }
  };

  // CRUD Actions
  const addTeacher = () => {
    if (!newTeacherName.trim()) return;
    setTeachers([...teachers, { id: Date.now().toString(), name: newTeacherName.toUpperCase(), role: 'Teacher' }]);
    setNewTeacherName('');
  };

  const deleteTeacher = (id: string) => {
    if (!confirm('Padam guru?')) return;
    setTeachers(teachers.filter(t => t.id !== id));
    setSlots(slots.map(s => ({ ...s, teacherIds: s.teacherIds.filter(tid => tid !== id) })));
  };

  const updateDutyAssignment = (slotId: string, teacherIds: string[]) => {
    setSlots(slots.map(s => s.id === slotId ? { ...s, teacherIds } : s));
  };

  const clearAllAssignments = () => {
    if (confirm('Padam SEMUA nama guru yang telah diassign dalam jadual?')) {
      setSlots(slots.map(s => ({ ...s, teacherIds: [] })));
    }
  };

  const addDutySlot = (category: string) => {
    setSlots([...slots, {
      id: `slot-${Date.now()}`,
      categoryId: category,
      day: 'Monday',
      time: category === 'arrival' ? '07:30 am - 08:00 am' : '08:00 am - 09:00 am',
      location: category === 'arrival' ? 'Main Gate' : 'New Location',
      group: 'General',
      teacherIds: []
    }]);
  };

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => { setActiveView(view); if (view !== 'admin') setIsAdminAuthenticated(false); }}
      className={`flex flex-col items-center justify-center sm:flex-row sm:space-x-2 px-2 py-2 rounded-xl transition-all whitespace-nowrap ${
        activeView === view ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:bg-white/50'
      }`}
    >
      <Icon size={18} />
      <span className="text-[10px] font-bold sm:text-sm uppercase sm:normal-case">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <style>{`
        body { overflow-x: hidden; width: 100vw; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @media (max-width: 640px) {
          .mobile-stack tr { display: flex; flex-direction: column; margin-bottom: 1rem; border: 1px solid #f3f4f6; border-radius: 1rem; overflow: hidden; background: white; }
          .mobile-stack td { padding: 0.5rem 1rem; border: none !important; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f8fafc !important; }
          .mobile-stack td:before { content: attr(data-label); font-weight: 800; text-transform: uppercase; font-size: 8px; color: #9ca3af; }
        }
      `}</style>

      <div className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-700" style={{ backgroundImage: `url(${settings.backgroundUrl})` }} />
      <div className="fixed inset-0 z-0 bg-gray-50/90 backdrop-blur-[1px]" />

      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 shrink-0 cursor-pointer" onClick={() => setActiveView('dashboard')}>
            <div className="p-1 bg-white rounded-lg shadow-sm border border-gray-100">
              <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <h1 className="text-xs font-black text-gray-900 tracking-tighter uppercase hidden xs:block">{settings.schoolName}</h1>
          </div>
          <nav className="flex items-center space-x-2 sm:space-x-1 overflow-x-auto no-scrollbar py-2">
            <NavItem view="dashboard" icon={LayoutDashboard} label="Induk" />
            <NavItem view="arrival-duty" icon={Clock} label="Arrival" />
            <NavItem view="teacher-view" icon={Search} label="Semak" />
            <NavItem view="tracker" icon={BarChart3} label="Workload" />
            <NavItem view="admin" icon={Settings} label="Admin" />
          </nav>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        
        {/* VIEW: DASHBOARD */}
        {activeView === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-blue-600 p-6 rounded-[2rem] shadow-xl text-white flex justify-between items-center text-center sm:text-left">
               <div>
                 <h2 className="text-2xl font-black uppercase italic tracking-wider">Jadual Induk</h2>
                 <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Sekolah Tinta</p>
               </div>
               <Calendar size={32} />
            </div>
            <div className="space-y-6">
              {CATEGORIES.filter(c => c.id !== 'arrival').map(cat => (
                <div key={cat.id} className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden">
                  <div className={`px-5 py-3 ${cat.color} border-b-2 font-black uppercase text-[10px] sm:text-xs tracking-widest text-gray-800`}>{cat.name}</div>
                  <table className="w-full text-left mobile-stack">
                    <thead className="hidden sm:table-header-group bg-gray-50/50 text-[9px] font-black text-gray-400 uppercase border-b">
                      <tr><th className="px-5 py-3">Hari</th><th className="px-5 py-3">Kumpulan</th><th className="px-5 py-3">Slot</th><th className="px-5 py-3">Guru</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {DAYS.map(day => slots.filter(s => s.categoryId === cat.id && s.day === day).map(slot => (
                        <tr key={slot.id} className="hover:bg-blue-50/20 transition-colors">
                          <td className="px-5 py-3 font-black text-blue-700 text-xs sm:text-sm" data-label="Hari">{day.toUpperCase()}</td>
                          <td className="px-5 py-3" data-label="Kumpulan"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[9px] font-black uppercase">{slot.group}</span></td>
                          <td className="px-5 py-3" data-label="Slot"><div className="font-black text-gray-900 text-[11px]">{slot.time}</div><div className="text-[9px] font-bold text-gray-400 uppercase italic">@{slot.location}</div></td>
                          <td className="px-5 py-3" data-label="Guru"><div className="flex flex-wrap gap-1 sm:justify-start justify-end">{slot.teacherIds.map(tid => <span key={tid} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-bold border border-blue-100">{teachers.find(teach => teach.id === tid)?.name || 'N/A'}</span>)}</div></td>
                        </tr>
                      )))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: ARRIVAL DUTY */}
        {activeView === 'arrival-duty' && (
          <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
            <div className="bg-yellow-400 p-6 rounded-[2rem] shadow-xl text-gray-900 flex justify-between items-center">
               <div>
                 <h2 className="text-2xl font-black uppercase italic tracking-wider">Arrival Duty</h2>
                 <p className="text-[10px] font-black opacity-80 uppercase tracking-widest tracking-widest">7.30 am – 8.00 am</p>
               </div>
               <Clock size={32} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {DAYS.map(day => {
                  const daySlots = slots.filter(s => s.categoryId === 'arrival' && s.day === day);
                  return (
                    <div key={day} className="bg-white p-5 rounded-[1.5rem] border-2 border-yellow-400 shadow-sm">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
                        <span className="text-sm font-black uppercase italic text-gray-900">{day}</span>
                        <span className="text-[9px] font-black text-yellow-600 uppercase">{daySlots[0]?.date || '-'}</span>
                      </div>
                      <div className="space-y-3">
                        {['Main Gate', 'Hall'].map(loc => {
                          const s = daySlots.find(slot => slot.location === loc);
                          return (
                          <div key={loc} className="flex flex-col gap-1 p-2 bg-gray-50 rounded-xl">
                            <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">{loc}</span>
                            <div className="flex flex-wrap gap-1">
                              {s?.teacherIds.map(tid => (
                                <span key={tid} className="bg-white px-2 py-0.5 rounded text-[9px] font-bold border border-gray-200">{teachers.find(t => t.id === tid)?.name}</span>
                              )) || <span className="text-[9px] text-gray-300 italic">Belum diassign</span>}
                            </div>
                          </div>
                        )})}
                      </div>
                    </div>
                  );
               })}
            </div>
          </div>
        )}

        {/* VIEW: TRACKER */}
        {activeView === 'tracker' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <div className="bg-indigo-600 p-6 rounded-[2rem] shadow-xl text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Teacher Tracker</h2>
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Workload Analysis</p>
              </div>
              <BarChart3 size={32} />
            </div>
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teacherWorkload} layout="vertical" margin={{ left: -10, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 8, fontWeight: 'bold', fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f1f5f9', radius: 4 }} contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px' }} />
                  <Bar dataKey="duties" radius={[0, 4, 4, 0]} barSize={12}>
                    {teacherWorkload.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.duties > 4 ? '#ef4444' : entry.duties > 2 ? '#f59e0b' : '#3b82f6'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* VIEW: TEACHER SEARCH */}
        {activeView === 'teacher-view' && (
          <div className="max-w-md mx-auto space-y-6 animate-fadeIn">
            <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl rotate-3"><Search size={32} /></div>
              <h2 className="text-xl font-black mb-1 uppercase italic text-gray-900">Semak Jadual</h2>
              <select className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-700 text-xs sm:text-sm text-center outline-none" value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)}>
                <option value="">-- PILIH NAMA GURU --</option>
                {teachers.sort((a,b) => a.name.localeCompare(b.name)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            {selectedTeacherId && (
              <div className="space-y-3">
                 {teacherDuties.map(duty => (
                    <div key={duty.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2">
                       <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                          <span className="text-sm font-black uppercase text-blue-700 italic">{duty.day}</span>
                          <span className={`text-[7px] font-black px-1.5 py-0.5 rounded text-white ${duty.categoryId === 'arrival' ? 'bg-yellow-500' : 'bg-blue-600'}`}>{CATEGORIES.find(c => c.id === duty.categoryId)?.name.toUpperCase()}</span>
                       </div>
                       <div className="text-[11px] font-black text-gray-900">{duty.time}</div>
                       <div className="text-[9px] font-bold text-gray-400 uppercase">Lokasi: {duty.location}</div>
                       <a href={getGoogleCalendarLink(CATEGORIES.find(c => c.id === duty.categoryId)?.name || 'Duty', duty.day, duty.time, duty.location)} target="_blank" rel="noreferrer" className="mt-1 flex items-center justify-center gap-2 bg-blue-600 text-white p-2.5 rounded-xl font-black text-[9px] uppercase shadow-lg"><Calendar size={12} /> Google Calendar</a>
                    </div>
                 ))}
                 {teacherDuties.length === 0 && <div className="bg-green-50 p-10 rounded-[2rem] border-2 border-dashed border-green-100 text-center"><CheckCircle2 size={40} className="mx-auto mb-2 text-green-300" /><p className="font-black text-green-800 uppercase text-[10px]">Tiada Tugasan</p></div>}
              </div>
            )}
          </div>
        )}

        {/* VIEW: ADMIN */}
        {activeView === 'admin' && (
          <div className="animate-fadeIn">
            {!isAdminAuthenticated ? (
              <div className="max-w-md mx-auto bg-white p-10 rounded-[2.5rem] shadow-2xl border-4 border-blue-600 text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl"><Lock size={32} /></div>
                <h2 className="text-2xl font-black mb-8 uppercase italic text-gray-900">Admin Login</h2>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} className={`w-full p-4 bg-gray-50 border-2 ${loginError ? 'border-red-500' : 'border-gray-100'} rounded-2xl font-bold outline-none text-center text-sm`} placeholder="PASSWORD" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} autoFocus />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase shadow-lg hover:bg-blue-700 text-sm">Masuk</button>
                  <a href="mailto:akmal@sekolahtinta.edu.my" className="inline-flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase hover:text-blue-600 mt-4"><Mail size={12} /> Emel Akmal</a>
                </form>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white p-6 rounded-[2rem] border shadow-xl">
                    <h3 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-tight text-blue-600"><Users size={20} /> Guru</h3>
                    <div className="flex gap-2 mb-4">
                      <input type="text" placeholder="NAMA..." className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none" value={newTeacherName} onChange={(e) => setNewTeacherName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addTeacher()} />
                      <button onClick={addTeacher} className="bg-blue-600 text-white p-2.5 rounded-xl"><Plus size={18} /></button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {teachers.sort((a,b) => a.name.localeCompare(b.name)).map(t => (
                        <div key={t.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-transparent hover:border-gray-200">
                          <span className="font-bold text-[10px] text-gray-700 uppercase">{t.name}</span>
                          <button onClick={() => deleteTeacher(t.id)} className="text-gray-300 hover:text-red-600"><Trash2 size={12} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border shadow-xl">
                    <h3 className="text-lg font-black mb-4 uppercase tracking-tight text-indigo-600 flex items-center gap-2"><Database size={20} /> Backup & Reset</h3>
                    <button onClick={handleExportData} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white p-3 rounded-xl font-black text-[10px] uppercase shadow-md mb-2"><Download size={14} /> Backup</button>
                    <button onClick={clearAllAssignments} className="w-full flex items-center justify-center gap-2 bg-red-600 text-white p-3 rounded-xl font-black text-[10px] uppercase shadow-md hover:bg-red-700"><RefreshCw size={14} /> Reset Semua Nama</button>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-6 rounded-[2.5rem] border shadow-xl">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                      <h3 className="text-xl font-black uppercase italic text-gray-900">Duty Master Editor</h3>
                      <div className="flex gap-2">
                        <select id="cat-selector" className="text-[10px] font-black uppercase border-2 border-gray-100 rounded-xl px-4 bg-gray-50">
                          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button onClick={() => addDutySlot((document.getElementById('cat-selector') as HTMLSelectElement).value)} className="bg-blue-600 text-white p-3 rounded-xl shadow-lg"><Plus size={20} /></button>
                      </div>
                    </div>
                    <div className="space-y-6">
                      {CATEGORIES.map(cat => (
                        <div key={cat.id} className="border border-gray-100 rounded-2xl overflow-hidden">
                          <div className={`px-4 py-2 font-black uppercase text-[9px] ${cat.color} border-b`}>{cat.name}</div>
                          <div className="divide-y divide-gray-100">
                            {slots.filter(s => s.categoryId === cat.id).map(slot => (
                              <div key={slot.id} className="p-4 sm:p-5 hover:bg-gray-50/30">
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                  <div className="grid grid-cols-2 gap-2 sm:col-span-3">
                                    <div>
                                      <label className="block text-[7px] font-black text-gray-400 uppercase mb-1">Tarikh (YYYY-MM-DD)</label>
                                      <input type="date" className="w-full text-xs font-bold bg-transparent p-0 border-none outline-none text-blue-600" value={slot.date || ''} onChange={(e) => {
                                        const newDate = e.target.value;
                                        const newDay = getDayFromDate(newDate);
                                        setSlots(slots.map(s => s.id === slot.id ? {...s, date: newDate, day: newDay} : s));
                                      }} />
                                    </div>
                                    <div>
                                      <label className="block text-[7px] font-black text-gray-400 uppercase mb-1">Hari</label>
                                      <select className="w-full text-xs font-bold bg-transparent p-0 border-none outline-none font-black text-gray-700" value={slot.day} onChange={(e) => setSlots(slots.map(s => s.id === slot.id ? {...s, day: e.target.value as Day} : s))}>
                                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[7px] font-black text-gray-400 uppercase mb-1">Masa</label>
                                      <input className="w-full text-xs font-bold bg-transparent p-0 border-none outline-none" value={slot.time} onChange={(e) => setSlots(slots.map(s => s.id === slot.id ? {...s, time: e.target.value} : s))} />
                                    </div>
                                    <div>
                                      <label className="block text-[7px] font-black text-gray-400 uppercase mb-1">Lokasi</label>
                                      <input className="w-full text-xs font-bold bg-transparent p-0 border-none outline-none" value={slot.location} onChange={(e) => setSlots(slots.map(s => s.id === slot.id ? {...s, location: e.target.value} : s))} />
                                    </div>
                                  </div>
                                  <div className="border-t sm:border-t-0 sm:border-l border-gray-100 pt-3 sm:pt-0 sm:pl-3">
                                    <div className="flex flex-wrap gap-1 mb-2">
                                      {slot.teacherIds.map(tid => (
                                        <span key={tid} className="bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                                          {teachers.find(t => t.id === tid)?.name.split(' ')[0]}
                                          <button onClick={() => updateDutyAssignment(slot.id, slot.teacherIds.filter(id => id !== tid))} className="opacity-60">×</button>
                                        </span>
                                      ))}
                                    </div>
                                    <select className="w-full text-[9px] font-black bg-gray-50 rounded p-1.5 border-none outline-none" onChange={(e) => { if (e.target.value && !slot.teacherIds.includes(e.target.value)) updateDutyAssignment(slot.id, [...slot.teacherIds, e.target.value]); }} value="">
                                      <option value="">+ Assign</option>
                                      {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                    <div className="flex gap-2 mt-4">
                                      <button onClick={() => updateDutyAssignment(slot.id, [])} className="text-[8px] font-black text-gray-400 hover:text-orange-500 uppercase flex items-center gap-1 transition-colors">
                                        <Eraser size={10} /> Kosongkan Guru
                                      </button>
                                      <button onClick={() => { if(confirm('Padam slot ini terus?')) setSlots(slots.filter(s => s.id !== slot.id)); }} className="text-[8px] font-black text-gray-300 hover:text-red-500 uppercase flex items-center gap-1">
                                        <Trash2 size={10} /> Padam Slot
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="relative z-10 max-w-7xl mx-auto w-full px-4 pb-10 text-center no-print">
        <div className="pt-8 border-t border-gray-200/50 flex flex-col items-center gap-3">
          <p className="text-gray-400 text-[8px] font-black uppercase tracking-[0.2em]">&copy; 2024 {settings.schoolName} • Master Duty v5.0 Elite</p>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors">
            <Github size={16} /><span className="text-[9px] font-black uppercase tracking-widest">Visit GitHub</span>
          </a>
        </div>
      </footer>
    </div>
  );
};

export default App;
