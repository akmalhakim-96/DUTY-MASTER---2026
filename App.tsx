
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
  UserCircle,
  Image as ImageIcon,
  TrendingUp,
  Download,
  FileText,
  Printer,
  Clock,
  Lock,
  Eye,
  EyeOff,
  Mail
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

  // Actions
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === settings.adminPassword) {
      setIsAdminAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const addTeacher = () => {
    if (!newTeacherName.trim()) return;
    const newT: Teacher = { id: Date.now().toString(), name: newTeacherName.toUpperCase(), role: 'Teacher' };
    setTeachers([...teachers, newT]);
    setNewTeacherName('');
  };

  const deleteTeacher = (id: string) => {
    if (!confirm('Adakah anda pasti mahu memadam guru ini?')) return;
    setTeachers(teachers.filter(t => t.id !== id));
    setSlots(slots.map(s => ({ ...s, teacherIds: s.teacherIds.filter(tid => tid !== id) })));
  };

  const updateDutyAssignment = (slotId: string, teacherIds: string[]) => {
    setSlots(slots.map(s => s.id === slotId ? { ...s, teacherIds } : s));
  };

  const addDutySlot = (category: string) => {
    const newSlot: DutySlot = {
      id: `slot-${Date.now()}`,
      categoryId: category,
      day: 'Monday',
      time: '08:00 am - 09:00 am',
      location: 'New Location',
      group: 'General',
      teacherIds: []
    };
    setSlots([...slots, newSlot]);
  };

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => {
        setActiveView(view);
        if (view !== 'admin') setIsAdminAuthenticated(false);
      }}
      className={`flex flex-col items-center justify-center sm:flex-row sm:space-x-2 px-2 py-2 rounded-xl transition-all whitespace-nowrap ${
        activeView === view 
          ? 'bg-blue-600 text-white shadow-lg' 
          : 'text-gray-600 hover:bg-white/50'
      }`}
    >
      <Icon size={18} />
      <span className="text-[10px] font-bold sm:text-sm uppercase sm:normal-case">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <style>{`
        /* Hilangkan skrol mendatar sepenuhnya */
        body { overflow-x: hidden; }
        
        /* Mobile table stacking logic */
        @media (max-width: 640px) {
          .mobile-stack { display: block; width: 100%; }
          .mobile-stack thead { display: none; }
          .mobile-stack tr { display: flex; flex-direction: column; margin-bottom: 1.5rem; border: 2px solid #f3f4f6; border-radius: 1rem; overflow: hidden; background: white; }
          .mobile-stack td { padding: 0.75rem 1rem; border: none !important; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f3f4f6 !important; }
          .mobile-stack td:last-child { border-bottom: none !important; }
          .mobile-stack td:before { 
            content: attr(data-label); 
            font-weight: 800; 
            text-transform: uppercase; 
            font-size: 10px; 
            color: #9ca3af;
            margin-right: 1rem;
          }
        }
      `}</style>

      {/* Background Layer */}
      <div className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-700" style={{ backgroundImage: `url(${settings.backgroundUrl})` }} />
      <div className="fixed inset-0 z-0 bg-gray-50/90 backdrop-blur-[1px]" />

      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 h-20 sm:h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 shrink-0" onClick={() => setActiveView('dashboard')}>
            <div className="p-1 bg-white rounded-lg shadow-sm border border-gray-100">
              <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <h1 className="text-sm font-black text-gray-900 tracking-tighter uppercase leading-none hidden xs:block">
              {settings.schoolName}
            </h1>
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
            <div className="bg-blue-600 p-6 rounded-[2rem] shadow-xl text-white flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
               <div>
                 <h2 className="text-2xl font-black uppercase italic tracking-wider">Jadual Induk</h2>
                 <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Sekolah Tinta Management System</p>
               </div>
               <div className="bg-white/20 p-2 rounded-2xl border border-white/20">
                 <Calendar size={32} />
               </div>
            </div>

            <div className="space-y-8">
              {CATEGORIES.filter(c => c.id !== 'arrival').map(cat => (
                <div key={cat.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                  <div className={`px-6 py-4 ${cat.color} border-b-2 font-black uppercase text-sm tracking-widest text-gray-800`}>
                    {cat.name}
                  </div>
                  <div className="w-full">
                    <table className="w-full text-left mobile-stack">
                      <thead className="hidden sm:table-header-group">
                        <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase border-b">
                          <th className="px-6 py-4">Hari</th>
                          <th className="px-6 py-4">Kumpulan</th>
                          <th className="px-6 py-4">Slot Masa & Lokasi</th>
                          <th className="px-6 py-4">Guru Bertugas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {DAYS.map(day => {
                          const daySlots = slots.filter(s => s.categoryId === cat.id && s.day === day);
                          if (daySlots.length === 0) return null;
                          return daySlots.map((slot) => (
                            <tr key={slot.id} className="hover:bg-blue-50/20 transition-colors">
                              <td className="px-6 py-4 font-black text-blue-700" data-label="Hari">
                                {day.toUpperCase()}
                              </td>
                              <td className="px-6 py-4" data-label="Kumpulan">
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase">
                                  {slot.group}
                                </span>
                              </td>
                              <td className="px-6 py-4" data-label="Slot">
                                <div className="font-black text-gray-900 text-xs">{slot.time}</div>
                                <div className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase italic">@{slot.location}</div>
                              </td>
                              <td className="px-6 py-4" data-label="Guru">
                                <div className="flex flex-wrap gap-1 sm:justify-start justify-end">
                                  {slot.teacherIds.map(tid => (
                                    <span key={tid} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-bold border border-blue-100 whitespace-nowrap">
                                      {teachers.find(teach => teach.id === tid)?.name || 'N/A'}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ));
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: ARRIVAL DUTY */}
        {activeView === 'arrival-duty' && (
          <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
            <div className="bg-yellow-400 p-6 rounded-[2rem] shadow-xl text-gray-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
               <div>
                 <h2 className="text-2xl font-black uppercase italic tracking-wider">Arrival Duty</h2>
                 <p className="text-xs font-bold opacity-80 uppercase tracking-widest">7.30 am – 8.00 am (Mon - Fri)</p>
               </div>
               <div className="bg-black/10 p-2 rounded-2xl">
                 <Clock size={32} />
               </div>
            </div>

            <div className="space-y-4">
               {DAYS.map(day => {
                  const daySlots = slots.filter(s => s.categoryId === 'arrival' && s.day === day);
                  return (
                    <div key={day} className="bg-white p-6 rounded-[2rem] border-2 border-yellow-400 shadow-sm">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                        <span className="text-lg font-black uppercase italic text-gray-900">{day}</span>
                        <span className="text-xs font-black text-yellow-600 uppercase tracking-widest">{daySlots[0]?.date || '-'}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                          <span className="text-[10px] font-black uppercase text-gray-400">Main Gate</span>
                          <div className="flex flex-wrap justify-end gap-1">
                            {daySlots.find(s => s.location === 'Main Gate')?.teacherIds.map(tid => (
                              <span key={tid} className="bg-white px-3 py-1 rounded-lg text-[10px] font-bold border border-gray-200 shadow-sm">{teachers.find(t => t.id === tid)?.name}</span>
                            )) || <span className="text-[10px] italic text-gray-300">Belum diisi</span>}
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                          <span className="text-[10px] font-black uppercase text-gray-400">Hall</span>
                          <div className="flex flex-wrap justify-end gap-1">
                            {daySlots.find(s => s.location === 'Hall')?.teacherIds.map(tid => (
                              <span key={tid} className="bg-white px-3 py-1 rounded-lg text-[10px] font-bold border border-gray-200 shadow-sm">{teachers.find(t => t.id === tid)?.name}</span>
                            )) || <span className="text-[10px] italic text-gray-300">Belum diisi</span>}
                          </div>
                        </div>
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
                <h2 className="text-2xl font-black uppercase italic">Teacher Workload</h2>
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-[0.3em]">Induk Schedule Only</p>
              </div>
              <BarChart3 size={32} />
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
               <div className="h-[500px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teacherWorkload} layout="vertical" margin={{ left: -10, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#6b7280' }} />
                    <Tooltip cursor={{ fill: '#f3f4f6', radius: 4 }} contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px', fontWeight: 'bold' }} />
                    <Bar dataKey="duties" radius={[0, 4, 4, 0]} barSize={14}>
                      {teacherWorkload.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.duties > 4 ? '#ef4444' : entry.duties > 2 ? '#f59e0b' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                 {teacherWorkload.slice(0, 10).map((tw, i) => (
                   <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <span className="font-bold text-xs text-gray-700 truncate">{tw.name}</span>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white ${tw.duties > 4 ? 'bg-red-500' : 'bg-blue-600'}`}>{tw.duties}</span>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: TEACHER SEARCH */}
        {activeView === 'teacher-view' && (
          <div className="max-w-md mx-auto space-y-6 animate-fadeIn">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border-2 border-white text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl rotate-3">
                <Search size={32} />
              </div>
              <h2 className="text-2xl font-black mb-1 uppercase italic text-gray-900">Semak Jadual</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Pilih nama untuk melihat tugasan peribadi</p>
              
              <select 
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-700 transition-all text-center text-sm appearance-none outline-none focus:border-blue-500" 
                value={selectedTeacherId} 
                onChange={(e) => setSelectedTeacherId(e.target.value)}
              >
                <option value="">-- CARI NAMA ANDA --</option>
                {teachers.sort((a,b) => a.name.localeCompare(b.name)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            {selectedTeacherId && (
              <div className="space-y-4">
                 {teacherDuties.length > 0 ? (
                    teacherDuties.map(duty => (
                      <div key={duty.id} className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col gap-3">
                         <div className="flex items-center justify-between">
                            <span className="text-lg font-black uppercase text-blue-700">{duty.day}</span>
                            <span className={`text-[8px] font-black px-2 py-1 rounded-md text-white ${duty.categoryId === 'arrival' ? 'bg-yellow-500' : 'bg-blue-600'}`}>
                              {CATEGORIES.find(c => c.id === duty.categoryId)?.name.toUpperCase()}
                            </span>
                         </div>
                         <div className="space-y-1">
                            <div className="text-xs font-black text-gray-900">{duty.time}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase">LOKASI: {duty.location}</div>
                            {duty.date && <div className="text-[10px] font-black text-indigo-600">TARIKH: {duty.date}</div>}
                         </div>
                         <a 
                          href={getGoogleCalendarLink(CATEGORIES.find(c => c.id === duty.categoryId)?.name || 'Duty', duty.day, duty.time, duty.location)} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="mt-2 flex items-center justify-center gap-2 bg-blue-600 text-white p-3 rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-blue-700 transition-all"
                        >
                          <Calendar size={14} /> Set Google Calendar
                        </a>
                      </div>
                    ))
                 ) : (
                    <div className="bg-green-50 p-10 rounded-[2rem] border-2 border-dashed border-green-100 text-center">
                      <CheckCircle2 size={48} className="mx-auto mb-2 text-green-300" />
                      <p className="font-black text-green-800 uppercase italic">Anda Tiada Tugasan</p>
                    </div>
                 )}
              </div>
            )}
          </div>
        )}

        {/* VIEW: ADMIN (Password Protected) */}
        {activeView === 'admin' && (
          <div className="animate-fadeIn">
            {!isAdminAuthenticated ? (
              <div className="max-w-md mx-auto bg-white p-10 rounded-[2.5rem] shadow-2xl border-4 border-blue-600 text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <Lock size={32} />
                </div>
                <h2 className="text-2xl font-black mb-1 uppercase italic text-gray-900">Admin Login</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-8 tracking-widest">Akses terhad untuk pentadbir sahaja</p>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      className={`w-full p-5 bg-gray-50 border-2 ${loginError ? 'border-red-500' : 'border-gray-100'} rounded-2xl font-bold focus:ring-4 focus:ring-blue-100 outline-none text-center`}
                      placeholder="KATA LALUAN"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {loginError && <p className="text-red-500 text-[9px] font-black uppercase">Password salah!</p>}
                  <button type="submit" className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase shadow-lg hover:bg-blue-700 transition-all">Masuk</button>
                  <a href="mailto:akmal@sekolahtinta.edu.my?subject=Reset Password Duty Master" className="inline-flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase hover:text-blue-600 transition-colors mt-4">
                    <Mail size={12} /> Lupa Password? Hubungi Akmal
                  </a>
                </form>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
                {/* Admin Sections Stacked on Mobile */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white p-6 rounded-[2rem] border shadow-xl">
                    <h3 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-tight text-blue-600"><Users size={20} /> Pengurusan Guru</h3>
                    <div className="flex gap-2 mb-4">
                      <input type="text" placeholder="NAMA BARU..." className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-bold focus:border-blue-500 outline-none" value={newTeacherName} onChange={(e) => setNewTeacherName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addTeacher()} />
                      <button onClick={addTeacher} className="bg-blue-600 text-white p-3 rounded-xl shadow-md"><Plus size={20} /></button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {teachers.sort((a,b) => a.name.localeCompare(b.name)).map(t => (
                        <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-transparent hover:border-gray-200 transition-all">
                          <span className="font-bold text-xs text-gray-700 uppercase">{t.name}</span>
                          <button onClick={() => deleteTeacher(t.id)} className="text-gray-300 hover:text-red-600"><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-[2rem] border shadow-xl">
                    <h3 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-tight text-indigo-600"><Settings size={20} /> Konfigurasi</h3>
                    <div className="space-y-4 text-[10px] font-black uppercase">
                      <div>
                        <label className="text-gray-400 mb-1 block">Nama Sekolah</label>
                        <input className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none" value={settings.schoolName} onChange={(e) => setSettings({...settings, schoolName: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-gray-400 mb-1 block">Admin Password</label>
                        <input className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none" type="text" value={settings.adminPassword} onChange={(e) => setSettings({...settings, adminPassword: e.target.value})} />
                      </div>
                      <p className="text-[8px] text-gray-300 normal-case italic">Sila pastikan kata laluan disimpan dengan selamat.</p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                   <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border shadow-xl">
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                        <h3 className="text-xl font-black uppercase italic text-gray-900">Master Control</h3>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <select id="cat-selector" className="flex-1 sm:flex-none text-[10px] font-black uppercase border-2 border-gray-100 rounded-xl px-4 py-3 bg-gray-50">
                            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          <button onClick={() => { const sel = document.getElementById('cat-selector') as HTMLSelectElement; addDutySlot(sel.value); }} className="bg-blue-600 text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shrink-0">
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {CATEGORIES.map(cat => (
                          <div key={cat.id} className="border-2 border-gray-100 rounded-2xl overflow-hidden bg-white">
                            <div className={`px-4 py-3 font-black uppercase text-[10px] ${cat.color} border-b-2`}>{cat.name}</div>
                            <div className="divide-y divide-gray-100">
                              {slots.filter(s => s.categoryId === cat.id).map(slot => (
                                <div key={slot.id} className="p-4 sm:p-6 hover:bg-gray-50/50">
                                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                    <div className="grid grid-cols-2 gap-2 sm:col-span-3">
                                      <div>
                                        <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">Hari</label>
                                        <select className="w-full text-xs font-bold bg-transparent p-0 border-none focus:ring-0 outline-none" value={slot.day} onChange={(e) => setSlots(slots.map(s => s.id === slot.id ? {...s, day: e.target.value as Day} : s))}>
                                          {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">Date/Group</label>
                                        <input className="w-full text-xs font-bold bg-transparent p-0 border-none focus:ring-0 outline-none text-blue-600" value={slot.date || slot.group} onChange={(e) => setSlots(slots.map(s => s.id === slot.id ? {...s, date: e.target.value, group: e.target.value} : s))} />
                                      </div>
                                      <div>
                                        <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">Masa</label>
                                        <input className="w-full text-xs font-bold bg-transparent p-0 border-none focus:ring-0 outline-none" value={slot.time} onChange={(e) => setSlots(slots.map(s => s.id === slot.id ? {...s, time: e.target.value} : s))} />
                                      </div>
                                      <div>
                                        <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">Lokasi</label>
                                        <input className="w-full text-xs font-bold bg-transparent p-0 border-none focus:ring-0 outline-none" value={slot.location} onChange={(e) => setSlots(slots.map(s => s.id === slot.id ? {...s, location: e.target.value} : s))} />
                                      </div>
                                    </div>
                                    <div className="border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-4">
                                      <label className="block text-[8px] font-black text-gray-400 uppercase mb-2">Guru</label>
                                      <div className="flex flex-wrap gap-1 mb-2">
                                        {slot.teacherIds.map(tid => (
                                          <span key={tid} className="inline-flex items-center bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-md">
                                            {teachers.find(t => t.id === tid)?.name.split(' ')[0]}
                                            <button onClick={() => updateDutyAssignment(slot.id, slot.teacherIds.filter(id => id !== tid))} className="ml-1 opacity-60">×</button>
                                          </span>
                                        ))}
                                      </div>
                                      <select className="w-full text-[9px] font-black bg-gray-100 rounded-lg p-2 border-none outline-none" onChange={(e) => { if (e.target.value && !slot.teacherIds.includes(e.target.value)) updateDutyAssignment(slot.id, [...slot.teacherIds, e.target.value]); }} value="">
                                        <option value="">+ Tambah</option>
                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                      </select>
                                      <button onClick={() => setSlots(slots.filter(s => s.id !== slot.id))} className="mt-4 text-[9px] font-black text-gray-300 hover:text-red-500 uppercase flex items-center gap-1 transition-colors">
                                        <Trash2 size={10} /> Padam
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
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
        <div className="pt-8 border-t border-gray-200/50">
          <p className="text-gray-400 text-[8px] font-black uppercase tracking-[0.2em]">&copy; 2024 {settings.schoolName} • Master Duty v3.5 Platinum</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
