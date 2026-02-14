
import React, { useState, useEffect, useMemo, useRef } from 'react';
// Firebase SDK via CDN (ESM)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc, 
  enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
  Settings, 
  LayoutDashboard, 
  Plus, 
  BarChart3,
  Search,
  Clock,
  Lock,
  FileText,
  Save,
  AlertCircle,
  Cloud,
  RefreshCw,
  CheckCircle2,
  Gamepad2,
  Users,
  Trash2,
  Image as ImageIcon,
  Type,
  Edit3,
  Upload
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

// ==========================================
// 1. FIREBASE CONFIGURATION (duty-master-99e14)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBxCV54DUF2VrMD_jhPgYvgZ-8ugkG__og",
  authDomain: "duty-master-99e14.firebaseapp.com",
  projectId: "duty-master-99e14",
  storageBucket: "duty-master-99e14.firebasestorage.app",
  messagingSenderId: "590089976223",
  appId: "1:590089976223:web:df5d36d6782dd1f6e8e5aa",
  measurementId: "G-JQY4CGK265"
};

// Initialize Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enable Offline Persistence
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Firestore persistence failed: Multiple tabs open.");
    } else if (err.code === 'unimplemented') {
      console.warn("Firestore persistence is not supported by this browser.");
    }
  });
} catch (err) {
  console.error("Firebase persistence error", err);
}

declare const html2canvas: any;
declare const jspdf: any;

const App: React.FC = () => {
  // --- STATE UTAMA ---
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [slots, setSlots] = useState<DutySlot[]>(INITIAL_SLOTS);
  const [settings, setSettings] = useState<AppSettings>({
    schoolName: 'Sekolah Tinta',
    logoUrl: 'https://cdn-icons-png.flaticon.com/512/2854/2854580.png',
    primaryColor: '#2563eb',
    backgroundUrl: 'https://images.unsplash.com/photo-1510070112810-d4e9a46d9e91?q=80&w=2069&auto=format&fit=crop',
    adminPassword: 'Tinta12345',
    masterTitle: 'DUTY MASTER',
    masterSubtitle: 'GROUP'
  });

  // --- STATE SYSTEM ---
  const [isCloudLoading, setIsCloudLoading] = useState(true);
  const [cloudStatus, setCloudStatus] = useState<'synced' | 'pending' | 'offline' | 'error'>('pending');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [adminTab, setAdminTab] = useState<'slots' | 'teachers' | 'settings'>('slots');
  
  // --- DRAFT STATES ---
  const [draftSlots, setDraftSlots] = useState<DutySlot[]>([]);
  const [draftTeachers, setDraftTeachers] = useState<Teacher[]>([]);
  const [draftSettings, setDraftSettings] = useState<AppSettings>(settings);
  
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const teacherScheduleRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // 2. REAL-TIME DATA SYNC
  // ==========================================
  useEffect(() => {
    const docRef = doc(db, "dutyMaster", "state");
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.teachers) setTeachers(data.teachers);
        if (data.slots) setSlots(data.slots);
        if (data.settings) setSettings(prev => ({ 
          ...prev, 
          ...data.settings, 
          masterTitle: data.settings.masterTitle || 'DUTY MASTER', 
          masterSubtitle: data.settings.masterSubtitle || 'GROUP' 
        }));
        setCloudStatus('synced');
      } else {
        saveToFirestore(INITIAL_TEACHERS, INITIAL_SLOTS, settings);
      }
      setIsCloudLoading(false);
    }, (error) => {
      console.error("Firestore Sync Error:", error);
      setCloudStatus('error');
      setIsCloudLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (activeView === 'admin' && isAdminAuthenticated) {
      setDraftSlots(JSON.parse(JSON.stringify(slots)));
      setDraftTeachers(JSON.parse(JSON.stringify(teachers)));
      setDraftSettings(JSON.parse(JSON.stringify(settings)));
    }
  }, [activeView, isAdminAuthenticated, slots, teachers, settings]);

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(slots) !== JSON.stringify(draftSlots) ||
           JSON.stringify(teachers) !== JSON.stringify(draftTeachers) ||
           JSON.stringify(settings) !== JSON.stringify(draftSettings);
  }, [slots, draftSlots, teachers, draftTeachers, settings, draftSettings]);

  // Helper for image upload and resizing
  const resizeImage = (file: File, maxWidth: number): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'background') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const maxWidth = type === 'logo' ? 400 : 1200;
      const base64 = await resizeImage(file, maxWidth);
      setDraftSettings(prev => ({
        ...prev,
        [type === 'logo' ? 'logoUrl' : 'backgroundUrl']: base64
      }));
    } catch (err) {
      console.error("Upload Error:", err);
      alert("Gagal muat naik imej.");
    }
  };

  // ==========================================
  // 3. FIRESTORE WRITE OPERATIONS
  // ==========================================
  const saveToFirestore = async (t: Teacher[], s: DutySlot[], sett: AppSettings) => {
    setIsCloudLoading(true);
    try {
      await setDoc(doc(db, "dutyMaster", "state"), {
        teachers: t,
        slots: s,
        settings: sett,
        lastUpdated: new Date().toISOString()
      });
      setCloudStatus('synced');
    } catch (error) {
      console.error("Firestore Save Error:", error);
      setCloudStatus('error');
    } finally {
      setIsCloudLoading(false);
    }
  };

  const handleApplyChanges = async () => {
    if (confirm("Simpan semua perubahan ke pangkalan data? Semua peranti akan dikemaskini.")) {
      await saveToFirestore(draftTeachers, draftSlots, draftSettings);
      setSlots(draftSlots);
      setTeachers(draftTeachers);
      setSettings(draftSettings);
      setActiveView('dashboard');
    }
  };

  // --- UI HANDLERS ---
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === settings.adminPassword) {
      setIsAdminAuthenticated(true);
      setLoginError(false);
    } else { setLoginError(true); }
  };

  const updateDraftAssignment = (slotId: string, teacherIds: string[]) => {
    setDraftSlots(draftSlots.map(s => s.id === slotId ? { ...s, teacherIds } : s));
  };

  const addDraftDutySlot = (category: string) => {
    setDraftSlots([...draftSlots, {
      id: `slot-${Date.now()}`,
      categoryId: category,
      day: 'Monday',
      time: '12:45 pm - 1:10 pm',
      location: 'Hall',
      group: 'General',
      teacherIds: []
    }]);
  };

  const handleAddTeacher = () => {
    const name = prompt("Masukkan Nama Guru Baru:");
    if (!name) return;
    const role = prompt("Masukkan Peranan (e.g. Teacher, Sir, Ustad):", "Teacher");
    if (!role) return;
    
    setDraftTeachers([...draftTeachers, {
      id: `t-${Date.now()}`,
      name: name.toUpperCase(),
      role: role
    }]);
  };

  const handleDeleteTeacher = (id: string) => {
    if (confirm("Adakah anda pasti mahu memadam guru ini?")) {
      setDraftTeachers(draftTeachers.filter(t => t.id !== id));
      setDraftSlots(draftSlots.map(s => ({
        ...s,
        teacherIds: s.teacherIds.filter(tid => tid !== id)
      })));
    }
  };

  const downloadTeacherPdf = async () => {
    if (!teacherScheduleRef.current || !selectedTeacherId) return;
    try {
      const element = teacherScheduleRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = jspdf;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Jadual_${teachers.find(t=>t.id===selectedTeacherId)?.name}.pdf`);
    } catch (error) {
      alert('Gagal menjana PDF.');
    }
  };

  // --- ANALYTICS & WORKLOAD ---
  const chartData = useMemo(() => {
    return teachers.map(t => ({ 
      name: t.name, 
      duties: slots.filter(s => s.teacherIds.includes(t.id) && s.categoryId !== 'arrival').length 
    })).sort((a, b) => b.duties - a.duties);
  }, [teachers, slots]);

  const teacherWorkloadCount = useMemo(() => {
    if (!selectedTeacherId) return 0;
    return slots.filter(s => s.teacherIds.includes(selectedTeacherId) && s.categoryId !== 'arrival').length;
  }, [selectedTeacherId, slots]);

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => { setActiveView(view); if (view !== 'admin') setIsAdminAuthenticated(false); }}
      className={`flex flex-col items-center justify-center sm:flex-row sm:space-x-2 px-2 py-2 rounded-xl transition-all ${
        activeView === view ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:bg-white/50'
      }`}
    >
      <Icon size={18} />
      <span className="text-[10px] font-bold sm:text-xs uppercase sm:normal-case">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <style>{`
        body { overflow-x: hidden; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .glow-blue { border-left: 4px solid #2563eb !important; background: #f0f7ff !important; }
        @media (max-width: 640px) {
          .mobile-stack tr { display: flex; flex-direction: column; margin-bottom: 1rem; border: 1px solid #f3f4f6; border-radius: 1rem; overflow: hidden; background: white; }
          .mobile-stack td { padding: 0.5rem 1rem; border: none !important; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f8fafc !important; }
          .mobile-stack td:before { content: attr(data-label); font-weight: 800; text-transform: uppercase; font-size: 8px; color: #9ca3af; }
        }
      `}</style>

      <div className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-700" style={{ backgroundImage: `url(${settings.backgroundUrl})` }} />
      <div className="fixed inset-0 z-0 bg-gray-50/90 backdrop-blur-[1px]" />

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 shrink-0 cursor-pointer" onClick={() => setActiveView('dashboard')}>
            <div className="p-1 bg-white rounded-lg shadow-sm border border-gray-100">
              <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <div className="hidden xs:block">
              <h1 className="text-xs font-black text-gray-900 tracking-tighter uppercase">{settings.schoolName}</h1>
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${cloudStatus === 'synced' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                <span className="text-[7px] font-black uppercase text-gray-400">
                  {isCloudLoading ? 'Syncing...' : 'Live Firestore'}
                </span>
              </div>
            </div>
          </div>

          <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-2">
            <NavItem view="dashboard" icon={LayoutDashboard} label="MASTER" />
            <NavItem view="arrival-duty" icon={Clock} label="Arrival" />
            <NavItem view="teacher-view" icon={Search} label="Semak" />
            <NavItem view="tracker" icon={BarChart3} label="Tracker" />
            <NavItem view="admin" icon={Settings} label="Admin" />
          </nav>

          <div className="flex items-center ml-2">
             <div className={`p-2 rounded-xl transition-all ${cloudStatus === 'synced' ? 'text-green-600' : 'text-amber-500'}`}>
                {isCloudLoading ? <RefreshCw className="animate-spin" size={18} /> : <Cloud size={18} />}
             </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 py-6 mb-24">
        {/* DASHBOARD VIEW (MASTER) */}
        {activeView === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-blue-600 p-6 rounded-[2rem] shadow-xl text-white flex justify-between items-center">
               <div>
                 <h2 className="text-2xl font-black uppercase italic tracking-wider">{settings.masterTitle}</h2>
                 <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{settings.masterSubtitle}</p>
               </div>
               <Calendar size={32} />
            </div>

            <div className="space-y-6">
              {(() => {
                const categoryOrder = ['breakfast', 'playtime', 'lunch', 'zuhur', 'dismissal'];
                return CATEGORIES
                  .filter(c => categoryOrder.includes(c.id))
                  .sort((a, b) => categoryOrder.indexOf(a.id) - categoryOrder.indexOf(b.id))
                  .map(cat => (
                    <div key={cat.id} className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden">
                      <div className={`px-5 py-3 ${cat.color} border-b-2 font-black uppercase text-[10px] tracking-widest text-gray-800`}>{cat.name}</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left mobile-stack">
                          <thead className="hidden sm:table-header-group bg-gray-50/50 text-[9px] font-black text-gray-400 uppercase border-b">
                            <tr><th className="px-5 py-3">Hari</th><th className="px-5 py-3">Kumpulan</th><th className="px-5 py-3">Slot</th><th className="px-5 py-3">Guru</th></tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {DAYS.map(day => slots.filter(s => s.categoryId === cat.id && s.day === day).map(slot => (
                              <tr key={slot.id} className="hover:bg-blue-50/20 transition-colors">
                                <td className="px-5 py-3 font-black text-blue-700 text-xs" data-label="Hari">{day.toUpperCase()}</td>
                                <td className="px-5 py-3" data-label="Kumpulan"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[9px] font-black uppercase">{slot.group}</span></td>
                                <td className="px-5 py-3" data-label="Slot"><div className="font-black text-gray-900 text-[11px]">{slot.time}</div><div className="text-[9px] font-bold text-gray-400 uppercase italic">@{slot.location}</div></td>
                                <td className="px-5 py-3" data-label="Guru">
                                  <div className="flex flex-wrap gap-1 sm:justify-start justify-end">
                                    {slot.teacherIds.map(tid => <span key={tid} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-bold border border-blue-100">{teachers.find(teach => teach.id === tid)?.name || 'N/A'}</span>)}
                                  </div>
                                </td>
                              </tr>
                            )))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ));
              })()}
            </div>
          </div>
        )}

        {/* ARRIVAL DUTY */}
        {activeView === 'arrival-duty' && (
          <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
            <div className="bg-yellow-400 p-6 rounded-[2rem] shadow-xl text-gray-900 flex justify-between items-center">
               <div>
                 <h2 className="text-2xl font-black uppercase italic tracking-wider">Arrival Duty</h2>
                 <p className="text-[10px] font-black opacity-80 uppercase tracking-widest">7.30 am – 8.00 am</p>
               </div>
               <Clock size={32} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {DAYS.map(day => {
                  const daySlots = slots.filter(s => s.categoryId === 'arrival' && s.day === day);
                  return (
                    <div key={day} className="bg-white p-5 rounded-[1.5rem] border-2 border-yellow-400 shadow-sm">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
                        <span className="text-sm font-black uppercase text-gray-900">{day}</span>
                      </div>
                      <div className="space-y-3">
                        {['Main Gate', 'Hall'].map(loc => (
                          <div key={loc} className="flex flex-col gap-1 p-2 bg-gray-50 rounded-xl">
                            <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">{loc}</span>
                            <div className="flex flex-wrap gap-1">
                              {daySlots.find(s => s.location === loc)?.teacherIds.map(tid => (
                                <span key={tid} className="bg-white px-2 py-0.5 rounded text-[9px] font-bold border border-gray-200">{teachers.find(t => t.id === tid)?.name}</span>
                              )) || <span className="text-[9px] text-gray-300 italic">Empty</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
               })}
            </div>
          </div>
        )}

        {/* TRACKER VIEW */}
        {activeView === 'tracker' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <div className="bg-indigo-600 p-6 rounded-[2rem] shadow-xl text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Teacher Tracker</h2>
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Analisis Beban Kerja Mingguan (Kecuali Arrival)</p>
              </div>
              <BarChart3 size={32} />
            </div>
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: -10, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 8, fontWeight: 'bold', fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f1f5f9', radius: 4 }} contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px' }} />
                  <Bar dataKey="duties" radius={[0, 4, 4, 0]} barSize={12}>
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.duties > 4 ? '#ef4444' : '#3b82f6'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TEACHER SEARCH */}
        {activeView === 'teacher-view' && (
          <div className="max-w-md mx-auto space-y-6 animate-fadeIn">
            <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl rotate-3"><Search size={32} /></div>
              <h2 className="text-xl font-black mb-1 uppercase italic text-gray-900">Semak Jadual</h2>
              <div className="space-y-4">
                <select className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-700 text-xs text-center outline-none" value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)}>
                  <option value="">-- PILIH NAMA GURU --</option>
                  {teachers.sort((a,b) => a.name.localeCompare(b.name)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>

                {selectedTeacherId && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <div className="text-left">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Workload (Excl. Arrival)</p>
                      <h4 className="text-lg font-black text-blue-800">{teacherWorkloadCount} Tugasan</h4>
                    </div>
                    <button 
                      onClick={downloadTeacherPdf}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-blue-700 transition-all"
                    >
                      <FileText size={14} /> PDF
                    </button>
                  </div>
                )}
              </div>
            </div>

            {selectedTeacherId && (
              <div className="space-y-3" ref={teacherScheduleRef}>
                {slots.filter(s => s.teacherIds.includes(selectedTeacherId)).sort((a,b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day)).map(duty => (
                  <div key={duty.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-sm font-black uppercase text-blue-700 italic">{duty.day}</span>
                       <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase text-white ${duty.categoryId === 'arrival' ? 'bg-yellow-500' : duty.categoryId === 'playtime' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                         {CATEGORIES.find(c => c.id === duty.categoryId)?.name}
                       </span>
                    </div>
                    <div className="text-[11px] font-black text-gray-900">{duty.time}</div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase italic">@{duty.location}</div>
                    
                    {/* GOOGLE CALENDAR LINK */}
                    <a 
                      href={getGoogleCalendarLink(
                        CATEGORIES.find(c => c.id === duty.categoryId)?.name || 'Tugasan',
                        duty.day,
                        duty.time,
                        duty.location
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 px-3 py-2 rounded-xl border border-gray-100 hover:border-blue-200 transition-all text-[9px] font-black uppercase mt-3 w-fit"
                    >
                      <Calendar size={12} /> Tambah ke Kalendar
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ADMIN EDITOR */}
        {activeView === 'admin' && isAdminAuthenticated && (
          <div className="animate-fadeIn max-w-5xl mx-auto space-y-6">
            <div className="bg-white p-4 rounded-[2rem] shadow-xl border flex gap-2 overflow-x-auto no-scrollbar">
               <button onClick={() => setAdminTab('slots')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${adminTab === 'slots' ? 'bg-blue-600 text-white' : 'text-gray-500 bg-gray-50'}`}><Calendar size={14}/> Duty Slots</button>
               <button onClick={() => setAdminTab('teachers')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${adminTab === 'teachers' ? 'bg-blue-600 text-white' : 'text-gray-500 bg-gray-50'}`}><Users size={14}/> Senarai Guru</button>
               <button onClick={() => setAdminTab('settings')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${adminTab === 'settings' ? 'bg-blue-600 text-white' : 'text-gray-500 bg-gray-50'}`}><ImageIcon size={14}/> Visual Settings</button>
               <button onClick={() => setIsAdminAuthenticated(false)} className="ml-auto px-4 py-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase">Logout</button>
            </div>

            {adminTab === 'slots' && (
              <div className="bg-white p-8 rounded-[2.5rem] border shadow-2xl space-y-8">
                 <h3 className="text-xl font-black uppercase italic text-gray-900 tracking-tight">Editor Jadual Utama</h3>
                 {CATEGORIES.map(cat => (
                  <div key={cat.id} className="border border-gray-100 rounded-[2rem] overflow-hidden">
                    <div className={`px-6 py-3 font-black uppercase text-xs ${cat.color} flex justify-between items-center border-b`}>
                      <span>{cat.name} ({draftSlots.filter(s => s.categoryId === cat.id).length})</span>
                      <button onClick={() => addDraftDutySlot(cat.id)} className="bg-white/50 hover:bg-white p-2 rounded-xl"><Plus size={16} /></button>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {draftSlots.filter(s => s.categoryId === cat.id).map(slot => (
                          <div key={slot.id} className="p-6 hover:bg-gray-50/50">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                              <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                  <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">Hari</label>
                                  <select className="w-full text-xs font-black bg-gray-50 p-2 rounded-xl outline-none" value={slot.day} onChange={(e) => setDraftSlots(draftSlots.map(s => s.id === slot.id ? {...s, day: e.target.value as Day} : s))}>
                                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">Masa</label>
                                  <input className="w-full text-xs font-black bg-gray-50 p-2 rounded-xl outline-none" value={slot.time} onChange={(e) => setDraftSlots(draftSlots.map(s => s.id === slot.id ? {...s, time: e.target.value} : s))} />
                                </div>
                                <div>
                                  <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">Lokasi</label>
                                  <input className="w-full text-xs font-black bg-gray-50 p-2 rounded-xl outline-none" value={slot.location} onChange={(e) => setDraftSlots(draftSlots.map(s => s.id === slot.id ? {...s, location: e.target.value} : s))} />
                                </div>
                                <div>
                                  <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">{cat.id === 'arrival' ? 'Tarikh' : 'Group'}</label>
                                  <input 
                                    type={cat.id === 'arrival' ? "date" : "text"}
                                    className="w-full text-xs font-black bg-gray-50 p-2 rounded-xl outline-none" 
                                    value={cat.id === 'arrival' ? (slot.date || '') : slot.group} 
                                    onChange={(e) => setDraftSlots(draftSlots.map(s => s.id === slot.id ? (cat.id === 'arrival' ? {...s, date: e.target.value} : {...s, group: e.target.value}) : s))} 
                                  />
                                </div>
                              </div>
                              <div className="border-l border-gray-100 pl-4">
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {slot.teacherIds.map(tid => (
                                    <span key={tid} className="bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-lg flex items-center gap-1">
                                      {draftTeachers.find(t => t.id === tid)?.name || 'N/A'}
                                      <button onClick={() => updateDraftAssignment(slot.id, slot.teacherIds.filter(id => id !== tid))}>×</button>
                                    </span>
                                  ))}
                                </div>
                                <select className="w-full text-[9px] font-black bg-blue-50 text-blue-700 p-2 rounded-xl border-none" onChange={(e) => { if (e.target.value) updateDraftAssignment(slot.id, [...slot.teacherIds, e.target.value]); }} value="">
                                  <option value="">+ Tambah Guru</option>
                                  {draftTeachers.sort((a,b) => a.name.localeCompare(b.name)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                <button onClick={() => setDraftSlots(draftSlots.filter(s => s.id !== slot.id))} className="text-[8px] font-black text-red-400 uppercase mt-4 block">Hapus Slot</button>
                              </div>
                            </div>
                          </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {adminTab === 'teachers' && (
               <div className="bg-white p-8 rounded-[2.5rem] border shadow-2xl space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black uppercase italic text-gray-900 tracking-tight">Pengurusan Guru</h3>
                    <button onClick={handleAddTeacher} className="bg-blue-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2"><Plus size={14}/> Tambah Guru Baru</button>
                  </div>
                  <div className="overflow-hidden border border-gray-100 rounded-2xl">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400">
                        <tr>
                          <th className="px-6 py-4">Nama Guru</th>
                          <th className="px-6 py-4">Peranan</th>
                          <th className="px-6 py-4 text-right">Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {draftTeachers.sort((a,b) => a.name.localeCompare(b.name)).map(t => (
                          <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-black text-xs text-gray-900">{t.name}</td>
                            <td className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">{t.role}</td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => handleDeleteTeacher(t.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16}/></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
            )}

            {adminTab === 'settings' && (
              <div className="bg-white p-8 rounded-[2.5rem] border shadow-2xl space-y-8">
                <h3 className="text-xl font-black uppercase italic text-gray-900 tracking-tight">Tetapan Sistem</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                     <div className="flex items-center gap-2 mb-2">
                       <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Edit3 size={18}/></div>
                       <h4 className="text-xs font-black uppercase text-gray-600 tracking-wider">Branding & Master Titles</h4>
                     </div>
                     <div className="p-6 border-2 border-dashed border-gray-100 rounded-3xl space-y-4">
                        <div className="relative group mx-auto w-20 h-20">
                          <img src={draftSettings.logoUrl} alt="Preview" className="w-20 h-20 object-contain bg-gray-50 rounded-xl p-2" />
                          <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-xl cursor-pointer transition-opacity">
                            <Upload className="text-white" size={20} />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
                          </label>
                        </div>
                        <div>
                          <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">Nama Sekolah</label>
                          <input className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold" value={draftSettings.schoolName} onChange={(e) => setDraftSettings({...draftSettings, schoolName: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">Tajuk MASTER (E.g. DUTY MASTER)</label>
                          <input className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold" value={draftSettings.masterTitle} onChange={(e) => setDraftSettings({...draftSettings, masterTitle: e.target.value.toUpperCase()})} />
                        </div>
                        <div>
                          <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">Subtajuk MASTER (E.g. GROUP)</label>
                          <input className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold" value={draftSettings.masterSubtitle} onChange={(e) => setDraftSettings({...draftSettings, masterSubtitle: e.target.value.toUpperCase()})} />
                        </div>
                     </div>
                   </div>

                   <div className="space-y-4">
                     <div className="flex items-center gap-2 mb-2">
                       <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><ImageIcon size={18}/></div>
                       <h4 className="text-xs font-black uppercase text-gray-600 tracking-wider">Latar Belakang (App)</h4>
                     </div>
                     <div className="p-6 border-2 border-dashed border-gray-100 rounded-3xl">
                        <div className="relative group aspect-video w-full">
                          <div className="w-full h-full bg-cover bg-center rounded-2xl border border-gray-200" style={{backgroundImage: `url(${draftSettings.backgroundUrl})`}}></div>
                          <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-2xl cursor-pointer transition-opacity">
                            <div className="flex flex-col items-center text-white">
                              <Upload size={32} />
                              <span className="text-[10px] font-black mt-2">UPLOAD BACKGROUND</span>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'background')} />
                          </label>
                        </div>
                        <p className="text-[7px] text-gray-400 mt-4 italic font-bold uppercase tracking-widest text-center">Imej akan dipadatkan secara automatik untuk prestasi terbaik</p>
                     </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADMIN LOGIN */}
        {activeView === 'admin' && !isAdminAuthenticated && (
          <div className="max-w-md mx-auto bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-blue-600 text-center animate-fadeIn">
            <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl"><Lock size={40} /></div>
            <h2 className="text-3xl font-black mb-8 italic tracking-tighter">أهلا وسهلا</h2>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <input type="password" className={`w-full p-4 bg-gray-50 border-2 ${loginError ? 'border-red-500' : 'border-gray-100'} rounded-[1.5rem] font-black outline-none text-center text-sm`} placeholder="ADMIN PASSWORD" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} autoFocus />
              <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-[1.5rem] font-black uppercase shadow-lg hover:bg-blue-700 transition-all">Verify & Access</button>
            </form>
          </div>
        )}
      </main>

      {/* FLOATING SAVE BAR */}
      {isAdminAuthenticated && hasUnsavedChanges && activeView === 'admin' && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-6 no-print">
          <div className="max-w-4xl mx-auto bg-gray-900/95 backdrop-blur-xl text-white p-5 rounded-[2.5rem] shadow-2xl flex items-center justify-between border border-white/10 ring-1 ring-blue-500/50">
            <div className="flex items-center gap-4">
               <AlertCircle size={24} className="text-amber-500 animate-pulse" />
               <div>
                 <p className="text-xs font-black uppercase italic tracking-tight text-amber-500">Terdapat Perubahan!</p>
                 <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Simpan untuk kemaskini Firestore Cloud</p>
               </div>
            </div>
            <div className="flex gap-4">
               <button onClick={handleApplyChanges} className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-2xl text-xs font-black uppercase flex items-center gap-2 shadow-xl shadow-blue-900/40 transition-all">
                  <Save size={18} /> SIMPAN SEMUA PERUBAHAN
               </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="relative z-10 text-center py-10 opacity-30 no-print">
        <p className="text-[8px] font-black uppercase tracking-[0.4em]">{settings.schoolName} {settings.masterTitle} v6.7</p>
      </footer>
    </div>
  );
};

export default App;
