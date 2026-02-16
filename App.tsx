
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

// Google GenAI SDK
import { GoogleGenAI } from "@google/genai";

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
  Users,
  Trash2,
  Image as ImageIcon,
  Volume2,
  VolumeX,
  MessageSquare,
  Send,
  X,
  Bot,
  Loader2,
  TrendingUp,
  Upload,
  Sparkles,
  Info,
  Quote,
  Layout,
  Trophy,
  CheckCircle2
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
// FIREBASE CONFIGURATION
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') console.warn("Firestore persistence failed.");
  });
} catch (err) {}

declare const html2canvas: any;
declare const jspdf: any;

// MASTER PASSWORD FOR SAFETY
const MASTER_PASSWORD = "Wanhakim5";

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [slots, setSlots] = useState<DutySlot[]>(INITIAL_SLOTS);
  const [settings, setSettings] = useState<AppSettings>({
    schoolName: 'Sekolah Tinta',
    logoUrl: 'https://cdn-icons-png.flaticon.com/512/2854/2854580.png',
    primaryColor: '#2563eb',
    backgroundUrl: 'https://images.unsplash.com/photo-1510070112810-d4e9a46d9e91?q=80&w=2069&auto=format&fit=crop',
    musicUrl: '',
    adminPassword: 'Tinta12345',
    masterTitle: 'DUTY MASTER',
    masterSubtitle: 'GROUP B'
  });

  const [isCloudLoading, setIsCloudLoading] = useState(true);
  const [cloudStatus, setCloudStatus] = useState<'synced' | 'pending' | 'offline' | 'error'>('pending');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [adminTab, setAdminTab] = useState<'slots' | 'teachers' | 'settings'>('slots');
  
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Assalamualaikum! Hamba SIR AKMAL (AI). Ada apa-apa yang boleh hamba bantu tentang jadual tugasan hari ini?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [draftSlots, setDraftSlots] = useState<DutySlot[]>([]);
  const [draftTeachers, setDraftTeachers] = useState<Teacher[]>([]);
  const [draftSettings, setDraftSettings] = useState<AppSettings>(settings);
  
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');

  const formatDisplayDate = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);
      const monthNames = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];
      return `${day} ${monthNames[month - 1]} ${year}`;
    }
    return dateStr;
  };

  const getDayFromDate = (dateStr: string): Day => {
    const d = new Date(dateStr);
    const dayNames: Day[] = ['Sunday' as any, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' as any];
    return dayNames[d.getDay()] || 'Monday';
  };

  const dutyInfo = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    const weekDates = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split('T')[0];
    });

    const arrivalSlots = slots.filter(s => s.categoryId === 'arrival' && s.date);
    const workingNow = arrivalSlots.some(s => s.date && weekDates.includes(s.date));

    const allDates = arrivalSlots.map(s => s.date as string).filter(Boolean).sort();
    const startDate = allDates.length > 0 ? formatDisplayDate(allDates[0]) : 'Tiada Data';
    const endDate = allDates.length > 0 ? formatDisplayDate(allDates[allDates.length - 1]) : 'Tiada Data';

    return {
      isWorkingThisWeek: workingNow,
      startDate,
      endDate,
      hasArrivalData: allDates.length > 0
    };
  }, [slots]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      setIsMusicPlaying(true);
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  useEffect(() => {
    const docRef = doc(db, "dutyMaster", "state");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.teachers) setTeachers(data.teachers);
        if (data.slots) setSlots(data.slots);
        if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
        setCloudStatus('synced');
      }
      setIsCloudLoading(false);
    }, (error) => {
      console.error("Firebase Sync Error:", error);
      setCloudStatus('error');
      setIsCloudLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // MASTER_PASSWORD works as a safety override
    if (passwordInput === settings.adminPassword || passwordInput === MASTER_PASSWORD) {
      setIsAdminAuthenticated(true);
      setLoginError(false);
      // Initialize drafts
      setDraftSlots(JSON.parse(JSON.stringify(slots)));
      setDraftTeachers(JSON.parse(JSON.stringify(teachers)));
      setDraftSettings(JSON.parse(JSON.stringify(settings)));
    } else {
      setLoginError(true);
    }
  };

  const handleApplyChanges = async () => {
    if (confirm("Simpan semua perubahan ke armada? Semua peranti lain akan dikemaskini secara automatik.")) {
      setIsCloudLoading(true);
      try {
        await setDoc(doc(db, "dutyMaster", "state"), {
          teachers: draftTeachers,
          slots: draftSlots,
          settings: draftSettings,
          lastUpdated: new Date().toISOString()
        });
        
        // Update local state to match cloud
        setSlots(draftSlots);
        setTeachers(draftTeachers);
        setSettings(draftSettings);
        
        setCloudStatus('synced');
        alert("Berjaya! Data telah disimpan ke armada.");
      } catch (error) {
        console.error("Save Error:", error);
        setCloudStatus('error');
        alert("Gagal menyimpan ke armada. Sila semak sambungan internet anda.");
      } finally {
        setIsCloudLoading(false);
      }
    }
  };

  const downloadTeacherPdf = async () => {
    if (!selectedTeacherId) return;
    setIsGeneratingPdf(true);
    
    let aiQuote = "Lelahmu adalah ibadah, sabarmu kunci syurga. Teruskan menyemai cahaya buat anak bangsa.";
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Berikan satu kata-kata semangat atau hikmah yang mendalam untuk seorang guru, sertakan rujukan ringkas dari Al-Quran atau Hadis. Gunakan Bahasa Melayu yang puitis. Maksimum 50 patah perkataan.",
      });
      if (response.text) aiQuote = response.text;
    } catch (e) {
      console.warn("AI Quote generation failed.");
    }

    const printContainer = document.createElement('div');
    printContainer.style.position = 'fixed';
    printContainer.style.left = '-9999px';
    printContainer.style.top = '0';
    printContainer.style.width = '800px'; 
    printContainer.style.backgroundColor = 'white';
    document.body.appendChild(printContainer);

    const teacher = teachers.find(t => t.id === selectedTeacherId);
    const teacherSlots = slots.filter(s => s.teacherIds.includes(selectedTeacherId)).sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day));

    printContainer.innerHTML = `
      <div style="padding: 60px; display: flex; flex-direction: column; background: white; font-family: 'Inter', sans-serif;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 5px solid #2563eb; padding-bottom: 25px; margin-bottom: 40px;">
          <div style="display: flex; align-items: center; gap: 20px;">
            <img src="${settings.logoUrl}" style="width: 100px; height: 100px; object-fit: contain;">
            <div>
              <h1 style="font-size: 32px; font-weight: 900; color: #111827; margin: 0; text-transform: uppercase;">${settings.schoolName}</h1>
              <p style="font-size: 14px; font-weight: 800; color: #2563eb; margin: 4px 0 0 0; text-transform: uppercase;">Jadual Tugasan Rasmi</p>
            </div>
          </div>
        </div>
        <div style="background: #eff6ff; padding: 35px; border-radius: 30px; border: 2px solid #dbeafe; margin-bottom: 40px;">
          <h2 style="font-size: 26px; font-weight: 900; color: #1e40af; margin: 0; text-transform: uppercase;">${teacher?.name}</h2>
          <p style="font-size: 14px; font-weight: 700; color: #60a5fa; margin: 5px 0 0 0; text-transform: uppercase;">SENARAI TUGASAN</p>
        </div>
        <div style="flex: 1;">
          <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
            ${teacherSlots.map(duty => `
              <div style="background: white; padding: 25px; border-radius: 20px; border: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; break-inside: avoid;">
                <div>
                  <span style="font-size: 16px; font-weight: 900; color: #2563eb; text-transform: uppercase;">${duty.day}</span><br/>
                  <span style="font-size: 15px; font-weight: 900; color: #111827;">${duty.time}</span><br/>
                  <span style="font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase;">LOKASI: ${duty.location}</span>
                  ${duty.date ? `<br/><span style="font-size: 10px; font-weight: 800; color: #3b82f6;">TARIKH: ${formatDisplayDate(duty.date)}</span>` : ''}
                </div>
                <span style="font-size: 10px; font-weight: 900; padding: 8px 15px; border-radius: 12px; background: #2563eb; color: white; text-transform: uppercase;">
                  ${CATEGORIES.find(c => c.id === duty.categoryId)?.name}
                </span>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="margin-top: 60px; padding: 40px; border-radius: 40px; border: 1px dashed #cbd5e1; text-align: center; background: #f8fafc;">
          <p style="font-size: 18px; font-weight: 700; color: #334155; line-height: 1.8; font-style: italic; margin-bottom: 25px;">"${aiQuote}"</p>
          <div style="width: 80px; height: 3px; background: #2563eb; margin: 0 auto 20px auto;"></div>
          <p style="font-size: 14px; font-weight: 900; color: #2563eb; text-transform: uppercase; letter-spacing: 0.2em; margin: 0;">IKHLAS DARIPADA SIR AKMAL</p>
        </div>
      </div>
    `;

    try {
      await new Promise(r => setTimeout(r, 1000));
      const canvas = await html2canvas(printContainer, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pageWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add the first page
      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add more pages if content is taller than one A4
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Jadual_${teacher?.name}.pdf`);
    } catch (error) {
      console.error(error);
      alert("Gagal muat turun PDF.");
    } finally {
      document.body.removeChild(printContainer);
      setIsGeneratingPdf(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || isAiLoading) return;
    const currentInput = userInput;
    setUserInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: currentInput }]);
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Nama sekolah: ${settings.schoolName}. Anda adalah SIR AKMAL. Beri bantuan tentang tugasan: ${currentInput}. Cakap gaya melayu yang santai.`,
      });
      setChatMessages(prev => [...prev, { role: 'ai', text: response.text || "saya pun tak pasti la sahabat." }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'ai', text: "Gagal connect AI." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

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

  const isVideoUrl = (url: string) => url?.startsWith('data:video/') || url?.match(/\.(mp4|webm|ogg)$/i);
  
  const getYoutubeId = (url: string | undefined) => {
    if (!url) return null;
    // Enhanced regex for various YouTube URL formats
    const match = url.match(/^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/);
    return (match && match[1].length === 11) ? match[1] : null;
  };


  const youtubeId = useMemo(() => getYoutubeId(settings.musicUrl), [settings.musicUrl]);
  const chartData = useMemo(() => {
    return teachers.map(t => ({ 
      name: t.name, 
      duties: slots.filter(s => s.teacherIds.includes(t.id) && s.categoryId !== 'arrival').length 
    })).sort((a, b) => b.duties - a.duties);
  }, [teachers, slots]);

  const hasUnsavedChanges = useMemo(() => {
    const sCurrent = JSON.stringify(slots);
    const sDraft = JSON.stringify(draftSlots);
    const tCurrent = JSON.stringify(teachers);
    const tDraft = JSON.stringify(draftTeachers);
    const setCurrent = JSON.stringify(settings);
    const setDraft = JSON.stringify(draftSettings);
    
    return sCurrent !== sDraft || tCurrent !== tDraft || setCurrent !== setDraft;
  }, [slots, draftSlots, teachers, draftTeachers, settings, draftSettings]);

  // Specific workload for selected teacher (strictly excluding Arrival Duty)
  const selectedTeacherWorkload = useMemo(() => {
    if (!selectedTeacherId) return 0;
    return slots.filter(s => s.teacherIds.includes(selectedTeacherId) && s.categoryId !== 'arrival').length;
  }, [selectedTeacherId, slots]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        {isVideoUrl(settings.backgroundUrl) ? (
          <video src={settings.backgroundUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
        ) : (
          <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${settings.backgroundUrl})` }} />
        )}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-[0.5px]" />
      </div>

      {/* Music Layer - Fixed with allow="autoplay" */}
      {isMusicPlaying && youtubeId && (
        <div className="fixed opacity-0 pointer-events-none">
          <iframe 
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&loop=1&playlist=${youtubeId}&enablejsapi=1`} 
            allow="autoplay"
          />
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 flex items-center px-4 justify-between shadow-sm no-print">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveView('dashboard')}>
            <img src={settings.logoUrl} className="w-8 h-8 object-contain" alt="Logo" />
            <h1 className="text-xs font-black uppercase text-gray-900 hidden sm:block">{settings.schoolName}</h1>
          </div>
          <nav className="flex items-center space-x-2">
            <button onClick={() => setActiveView('dashboard')} className={`p-2 rounded-xl transition-all ${activeView === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600'}`}><LayoutDashboard size={18} /></button>
            <button onClick={() => setActiveView('arrival-duty')} className={`p-2 rounded-xl transition-all ${activeView === 'arrival-duty' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600'}`}><Clock size={18} /></button>
            <button onClick={() => setActiveView('teacher-view')} className={`p-2 rounded-xl transition-all ${activeView === 'teacher-view' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600'}`}><Search size={18} /></button>
            <button onClick={() => setActiveView('tracker')} className={`p-2 rounded-xl transition-all ${activeView === 'tracker' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600'}`}><BarChart3 size={18} /></button>
            <button onClick={() => setActiveView('admin')} className={`p-2 rounded-xl transition-all ${activeView === 'admin' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600'}`}><Settings size={18} /></button>
          </nav>
          <div className="flex items-center space-x-2">
             {youtubeId && (
               <button 
                onClick={() => setIsMusicPlaying(!isMusicPlaying)} 
                className={`p-2 rounded-xl ${isMusicPlaying ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                title={isMusicPlaying ? "Hentikan Musik" : "Pasang Musik"}
               >
                 {isMusicPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
               </button>
             )}
             <div className="p-2 text-green-600">
               {isCloudLoading ? <RefreshCw className="animate-spin" size={18} /> : (cloudStatus === 'synced' ? <Cloud size={18} /> : <AlertCircle className="text-red-500" size={18} />)}
             </div>
          </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {activeView === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-xl text-white flex justify-between items-center group overflow-hidden">
               <div className="relative z-10">
                 <h2 className="text-3xl font-black uppercase italic tracking-tight">{settings.masterTitle}</h2>
                 <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-2">{settings.masterSubtitle}</p>
               </div>
               <Calendar size={48} className="opacity-40 group-hover:scale-110 transition-transform" />
            </div>

            <div className="space-y-6">
              {['breakfast', 'playtime', 'zuhur', 'lunch', 'dismissal'].map(catId => {
                const cat = CATEGORIES.find(c => c.id === catId);
                if (!cat) return null;
                return (
                  <div key={cat.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className={`px-6 py-4 ${cat.color} border-b-2 font-black uppercase text-[11px] text-gray-800 tracking-widest`}>{cat.name}</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-[9px] font-black text-gray-400 uppercase border-b">
                          <tr><th className="px-6 py-4">Hari</th><th className="px-6 py-4">Slot</th><th className="px-6 py-4">Guru</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {DAYS.map(day => slots.filter(s => s.categoryId === cat.id && s.day === day).map(slot => (
                            <tr key={slot.id} className="hover:bg-blue-50/20 transition-colors">
                              <td className="px-6 py-4 font-black text-blue-700 text-xs">{day.toUpperCase()}</td>
                              <td className="px-6 py-4">
                                <div className="font-black text-gray-900 text-xs">{slot.time}</div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase italic">@{slot.location}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1.5">
                                  {slot.teacherIds.map(tid => <span key={tid} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black border border-blue-100 shadow-sm">{teachers.find(t => t.id === tid)?.name || 'N/A'}</span>)}
                                </div>
                              </td>
                            </tr>
                          )))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeView === 'arrival-duty' && (
          <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
            <div className="bg-yellow-400 p-8 rounded-[3rem] shadow-xl text-gray-900 flex justify-between items-center">
               <div className="relative z-10"><h2 className="text-3xl font-black uppercase italic">Arrival Duty</h2><p className="text-[10px] font-black opacity-80 uppercase mt-1">Sesi Pagi: 7.30 am – 8.00 am</p></div>
               <Clock size={48} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {DAYS.map((day, idx) => {
                 const daySlots = slots.filter(s => s.categoryId === 'arrival' && s.day === day);
                 return (
                    <div key={idx} className="bg-white p-6 rounded-[2.5rem] border-2 border-yellow-400 shadow-sm min-h-[250px]">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                        <div className="flex flex-col">
                          <span className="text-lg font-black uppercase text-gray-900">{day}</span>
                          {daySlots[0]?.date && <span className="text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-lg w-fit mt-1">{formatDisplayDate(daySlots[0].date)}</span>}
                        </div>
                      </div>
                      <div className="space-y-4">
                        {daySlots.map(s => (
                          <div key={s.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                             <span className="text-[9px] font-black uppercase text-gray-400">{s.location}</span>
                             <div className="flex flex-wrap gap-1.5 mt-1">
                                {s.teacherIds.map(tid => <span key={tid} className="bg-white px-2 rounded-lg text-[10px] font-black border border-gray-200 text-gray-700">{teachers.find(t => t.id === tid)?.name || 'N/A'}</span>)}
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
               )})}
            </div>
          </div>
        )}

        {activeView === 'teacher-view' && (
          <div className="max-w-md mx-auto space-y-6 animate-fadeIn">
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 text-center">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl"><Search size={40} /></div>
              <h2 className="text-2xl font-black mb-1 uppercase italic text-gray-900">Semak Jadual</h2>
              
              <div className="space-y-6">
                <select className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-black text-gray-700 text-xs text-center outline-none focus:border-blue-500 appearance-none transition-all" value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)}>
                  <option value="">-- PILIH NAMA GURU --</option>
                  {teachers.sort((a,b) => a.name.localeCompare(b.name)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>

                {selectedTeacherId && (
                  <div className="animate-fadeIn">
                    {/* Workload Stats Card */}
                    <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-5 mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
                          <Trophy size={20} />
                        </div>
                        <div className="text-left">
                          <p className="text-[9px] font-black uppercase text-gray-400 leading-none mb-1">BEBAN KERJA (KECUALI ARRIVAL):</p>
                          <h4 className={`text-xl font-black leading-none ${selectedTeacherWorkload > 5 ? 'text-red-600' : 'text-blue-700'}`}>
                            {selectedTeacherWorkload} TUGASAN
                          </h4>
                        </div>
                      </div>
                    </div>

                    <button onClick={downloadTeacherPdf} disabled={isGeneratingPdf} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white p-5 rounded-3xl font-black text-xs uppercase shadow-xl hover:bg-blue-700 active:scale-95 transition-all">
                      {isGeneratingPdf ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />} {isGeneratingPdf ? 'Wait...' : 'Download PDF'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {selectedTeacherId && (
              <div className="space-y-4">
                {slots.filter(s => s.teacherIds.includes(selectedTeacherId)).sort((a,b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day)).map(duty => (
                  <div key={duty.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:border-blue-200 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-black uppercase text-blue-700 italic">{duty.day}</span>
                      <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase text-white ${duty.categoryId === 'arrival' ? 'bg-yellow-500' : 'bg-blue-600'}`}>
                        {CATEGORIES.find(c => c.id === duty.categoryId)?.name}
                      </span>
                    </div>
                    {duty.date && <div className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded-lg w-fit mb-2">{formatDisplayDate(duty.date)}</div>}
                    <div className="text-sm font-black text-gray-900 mb-1">{duty.time}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">@{duty.location}</div>
                    <a href={getGoogleCalendarLink(CATEGORIES.find(c => c.id === duty.categoryId)?.name || 'Duty', duty.day, duty.time, duty.location)} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-gray-50 hover:bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase border border-gray-100 hover:border-blue-200 transition-all">
                      <Calendar size={14} /> Sync to Google Calendar
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === 'tracker' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <div className="bg-indigo-600 p-8 rounded-[3rem] shadow-xl text-white flex justify-between items-center">
              <div className="relative z-10"><h2 className="text-3xl font-black uppercase italic">Teacher Tracker</h2><p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">Workload Analysis</p></div>
              <BarChart3 size={48} />
            </div>
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 min-h-[500px]">
              <div className="h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 30, top: 20, bottom: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 9, fontWeight: 'black', fill: '#374151' }} />
                    <Tooltip contentStyle={{ borderRadius: '15px', fontWeight: 'bold', fontSize: '10px' }} />
                    <Bar dataKey="duties" radius={[0, 8, 8, 0]} barSize={16}>
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.duties > 5 ? '#ef4444' : '#3b82f6'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
                 <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                 <p className="text-[10px] font-black uppercase text-gray-500 tracking-wider">GURU DENGAN MELEBIHI 5 TUGASAN DIPAPARKAN DALAM WARNA MERAH</p>
              </div>
            </div>
          </div>
        )}

        {activeView === 'admin' && isAdminAuthenticated && (
          <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-32">
            <div className="bg-white p-4 rounded-[2.5rem] shadow-xl border flex gap-3 overflow-x-auto no-scrollbar items-center">
               <button onClick={() => setAdminTab('slots')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 ${adminTab === 'slots' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 bg-gray-50'}`}><Calendar size={16}/> Slots</button>
               <button onClick={() => setAdminTab('teachers')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 ${adminTab === 'teachers' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 bg-gray-50'}`}><Users size={16}/> Teachers</button>
               <button onClick={() => setAdminTab('settings')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 ${adminTab === 'settings' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 bg-gray-50'}`}><Layout size={16}/> Design & Settings</button>
               
               <div className="ml-auto flex items-center gap-4">
                 <div className="hidden sm:flex items-center gap-2 text-[9px] font-black uppercase text-gray-400">
                   {hasUnsavedChanges ? (
                     <span className="flex items-center gap-1 text-amber-500"><AlertCircle size={12}/> Unsaved</span>
                   ) : (
                     <span className="flex items-center gap-1 text-green-500"><CheckCircle2 size={12}/> Synced</span>
                   )}
                 </div>
                 <button onClick={() => setIsAdminAuthenticated(false)} className="px-6 py-4 text-red-500 font-black uppercase text-[10px] hover:bg-red-50 rounded-2xl transition-colors">Logout</button>
               </div>
            </div>

            {adminTab === 'slots' && (
              <div className="bg-white p-8 rounded-[3rem] border shadow-xl space-y-8">
                 {CATEGORIES.map(cat => (
                  <div key={cat.id} className="border border-gray-100 rounded-[2.5rem] overflow-hidden">
                    <div className={`px-6 py-4 font-black uppercase text-xs ${cat.color} flex justify-between items-center border-b`}>
                      <span>{cat.name}</span>
                      <button onClick={() => setDraftSlots([...draftSlots, { id: `s-${Date.now()}`, categoryId: cat.id, day: 'Monday', time: '8:00 am', location: 'Gate', group: 'All', teacherIds: [] }])} className="bg-white/50 p-2 rounded-xl hover:bg-white/70 transition-colors"><Plus size={18} /></button>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {draftSlots.filter(s => s.categoryId === cat.id).map(slot => (
                          <div key={slot.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                               {cat.id === 'arrival' ? (
                                 <div className="flex flex-col gap-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase">Tarikh Tugasan</label>
                                    <input type="date" className="p-3 bg-blue-50 rounded-xl text-xs font-black border border-blue-100 outline-none focus:ring-2 ring-blue-300" value={slot.date || ''} onChange={(e) => {
                                        const newDate = e.target.value;
                                        const newDay = getDayFromDate(newDate);
                                        setDraftSlots(draftSlots.map(ds => ds.id === slot.id ? {...ds, date: newDate, day: newDay} : ds));
                                      }} 
                                    />
                                 </div>
                               ) : (
                                 <div className="flex flex-col gap-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase">Hari</label>
                                    <select className="p-3 bg-gray-50 rounded-xl text-xs font-black border outline-none focus:ring-2 ring-blue-300" value={slot.day} onChange={(e) => setDraftSlots(draftSlots.map(ds => ds.id === slot.id ? {...ds, day: e.target.value as Day} : ds))}> {DAYS.map(d => <option key={d} value={d}>{d}</option>)} </select>
                                 </div>
                               )}
                               <div className="flex flex-col gap-1">
                                  <label className="text-[9px] font-black text-gray-400 uppercase">Masa</label>
                                  <input className="p-3 bg-gray-50 rounded-xl text-xs font-black border outline-none focus:ring-2 ring-blue-300" value={slot.time} onChange={(e) => setDraftSlots(draftSlots.map(ds => ds.id === slot.id ? {...ds, time: e.target.value} : ds))} />
                               </div>
                               <div className="flex flex-col gap-1">
                                  <label className="text-[9px] font-black text-gray-400 uppercase">Lokasi</label>
                                  <input className="p-3 bg-gray-50 rounded-xl text-xs font-black border outline-none focus:ring-2 ring-blue-300" value={slot.location} onChange={(e) => setDraftSlots(draftSlots.map(ds => ds.id === slot.id ? {...ds, location: e.target.value} : ds))} />
                               </div>
                               <div className="md:col-span-2 flex items-end justify-between">
                                  <div className="flex flex-wrap gap-1"> 
                                    {draftTeachers.sort((a,b) => a.name.localeCompare(b.name)).map(t => (
                                      <button key={t.id} onClick={() => { 
                                          const newIds = slot.teacherIds.includes(t.id) ? slot.teacherIds.filter(id => id !== t.id) : [...slot.teacherIds, t.id]; 
                                          setDraftSlots(draftSlots.map(ds => ds.id === slot.id ? {...ds, teacherIds: newIds} : ds)) 
                                        }} 
                                        className={`px-2 py-1 rounded text-[8px] font-black border transition-all ${slot.teacherIds.includes(t.id) ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                                      >
                                        {t.name}
                                      </button>
                                    ))} 
                                  </div>
                                  <button onClick={() => setDraftSlots(draftSlots.filter(ds => ds.id !== slot.id))} className="text-red-500 p-2 hover:bg-red-100 rounded-xl transition-colors"><Trash2 size={18}/></button>
                               </div>
                            </div>
                            {cat.id === 'arrival' && slot.date && (
                              <div className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg w-fit uppercase">Auto-Hari: {slot.day}</div>
                            )}
                          </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {adminTab === 'teachers' && (
              <div className="bg-white p-8 rounded-[3rem] border shadow-xl space-y-6">
                <button onClick={() => { const name = prompt("Nama Guru:"); if(name) setDraftTeachers([...draftTeachers, { id: `t-${Date.now()}`, name: name.toUpperCase(), role: 'Teacher' }]) }} className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase shadow-lg hover:bg-blue-700 transition-colors">+ New Teacher</button>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {draftTeachers.sort((a,b) => a.name.localeCompare(b.name)).map(t => (
                    <div key={t.id} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center border border-gray-100 hover:border-blue-200 transition-all">
                      <span className="text-xs font-black uppercase">{t.name}</span>
                      <button onClick={() => { if(confirm(`Hapus ${t.name}?`)) setDraftTeachers(draftTeachers.filter(teach => teach.id !== t.id)) }} className="text-red-400 hover:text-red-600 p-2 transition-colors"><Trash2 size={18}/></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {adminTab === 'settings' && (
              <div className="bg-white p-8 rounded-[3rem] border shadow-xl space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="text-[10px] font-black uppercase text-gray-400 block mb-2">School Name</label><input className="w-full p-4 bg-gray-50 rounded-2xl font-black text-xs border focus:ring-2 ring-blue-300 outline-none" value={draftSettings.schoolName} onChange={(e) => setDraftSettings({...draftSettings, schoolName: e.target.value})} /></div>
                  <div><label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Admin Password</label><input className="w-full p-4 bg-gray-50 rounded-2xl font-black text-xs border focus:ring-2 ring-blue-300 outline-none" value={draftSettings.adminPassword} onChange={(e) => setDraftSettings({...draftSettings, adminPassword: e.target.value})} /></div>
                  
                  <div><label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Master Title (Dashboard)</label><input className="w-full p-4 bg-gray-50 rounded-2xl font-black text-xs border focus:ring-2 ring-blue-300 outline-none" value={draftSettings.masterTitle} onChange={(e) => setDraftSettings({...draftSettings, masterTitle: e.target.value})} placeholder="e.g. DUTY MASTER" /></div>
                  <div><label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Master Subtitle (Dashboard)</label><input className="w-full p-4 bg-gray-50 rounded-2xl font-black text-xs border focus:ring-2 ring-blue-300 outline-none" value={draftSettings.masterSubtitle} onChange={(e) => setDraftSettings({...draftSettings, masterSubtitle: e.target.value})} placeholder="e.g. GROUP B" /></div>

                  <div className="relative">
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Music (YouTube URL)</label>
                    <div className="flex gap-2">
                      <input className="flex-1 p-4 bg-gray-50 rounded-2xl font-black text-xs border focus:ring-2 ring-blue-300 outline-none" value={draftSettings.musicUrl} onChange={(e) => setDraftSettings({...draftSettings, musicUrl: e.target.value})} placeholder="https://youtube.com/..." />
                      <button onClick={() => { setIsMusicPlaying(true); alert("Mencuba memainkan musik..."); }} className="p-4 bg-blue-100 text-blue-600 rounded-2xl hover:bg-blue-200 transition-colors" title="Test Audio"><Volume2 size={20}/></button>
                    </div>
                  </div>
                  <div><label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Background URL (Image or Direct MP4)</label><input className="w-full p-4 bg-gray-50 rounded-2xl font-black text-xs border focus:ring-2 ring-blue-300 outline-none" value={draftSettings.backgroundUrl} onChange={(e) => setDraftSettings({...draftSettings, backgroundUrl: e.target.value})} /></div>
                  
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">School Logo</label>
                    <div className="flex items-center gap-4">
                      <img src={draftSettings.logoUrl} className="w-20 h-20 object-contain bg-gray-50 rounded-2xl border" />
                      <input type="file" className="text-[10px]" onChange={async (e) => { const file = e.target.files?.[0]; if(file) { const b64 = await resizeImage(file, 400); setDraftSettings({...draftSettings, logoUrl: b64}); } }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {hasUnsavedChanges && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] animate-fadeIn">
                <button 
                  onClick={handleApplyChanges} 
                  className="bg-gray-900 text-white px-12 py-6 rounded-[3rem] font-black uppercase shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 hover:scale-105 active:scale-95 transition-all border-2 border-white/20"
                >
                  {isCloudLoading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />} 
                  {isCloudLoading ? 'SEDANG MENYIMPAN...' : 'SIMPAN KE ARMADA'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeView === 'admin' && !isAdminAuthenticated && (
          <div className="max-w-md mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl border-4 border-blue-600 text-center animate-fadeIn mt-12">
            <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl"><Lock size={40} /></div>
            <h2 className="text-3xl font-black mb-8 italic uppercase text-gray-900">Admin Login</h2>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <input type="password" className={`w-full p-5 bg-gray-50 border-2 ${loginError ? 'border-red-500' : 'border-gray-100'} rounded-[2rem] font-black outline-none text-center focus:border-blue-500 transition-all`} placeholder="PASSWORD" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} />
              <button type="submit" className="w-full bg-blue-600 text-white p-5 rounded-[2rem] font-black uppercase shadow-lg hover:bg-blue-700 active:scale-95 transition-all">Verify Identity</button>
            </form>
            <p className="mt-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">SILA MASUKKAN KATA LALUAN</p>
          </div>
        )}
      </main>

      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-xl flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white max-w-xl w-full rounded-[4rem] shadow-2xl text-center relative overflow-hidden border border-gray-100">
            <div className="bg-blue-600 h-32 flex items-center justify-center"><Sparkles size={48} className="text-white animate-pulse" /></div>
            <div className="p-10 space-y-8">
              <div className="space-y-2">
                <h2 className="text-1xl font-black uppercase italic tracking-tight text-gray-900 leading-none">SELAMAT DATANG KE</h2>
                <h3 className="text-2xl font-black uppercase text-blue-600 tracking-tighter">DUTY DISMISSAL GROUP B</h3>
              </div>
              <div className="poem-container bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50 relative">
                <div className="absolute top-0 left-0 p-2 text-blue-200"><Quote size={32} /></div>
                <p className="text-gray-700 font-black italic leading-relaxed text-sm">"Sir Akmal datang membawa berita,"</p>
                <p className="text-gray-700 font-black italic leading-relaxed text-sm">"Jadual disusun rapi dan nyata,"</p>
                <p className="text-gray-700 font-black italic leading-relaxed text-sm">"Tugasan dipikul sepenuh jiwa,"</p>
                <p className="text-gray-700 font-black italic leading-relaxed text-sm">"Demi anak bangsa, kita berjasa."</p>
              </div>
              <div className="relative">
                 <div className={`p-6 rounded-[2.5rem] border flex flex-col gap-4 transition-all shadow-xl ${dutyInfo.isWorkingThisWeek ? 'bg-green-600 border-green-700 text-white' : 'bg-red-600 border-red-700 text-white'}`}>
                    <div className="flex items-center gap-5">
                      <div className="p-4 rounded-2xl bg-white/20 text-white shadow-lg">
                        {dutyInfo.isWorkingThisWeek ? <CheckCircle2 size={28} /> : <Info size={28} />}
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] font-black uppercase opacity-90 leading-none mb-1">STATUS TUGASAN:</p>
                        <h4 className="text-xl font-black uppercase italic leading-none">
                          {dutyInfo.isWorkingThisWeek ? `${settings.masterSubtitle} SEDANG BERTUGAS` : `${settings.masterSubtitle} TAK BERTUGAS`}
                        </h4>
                        {dutyInfo.hasArrivalData && (
                          <p className="text-[10px] font-bold opacity-80 uppercase mt-2 tracking-wider">
                            TEMPOH: {dutyInfo.startDate} — {dutyInfo.endDate}
                          </p>
                        )}
                      </div>
                    </div>
                 </div>
              </div>
              <button onClick={() => setShowWelcome(false)} className="w-full bg-blue-600 text-white p-6 rounded-[2rem] font-black uppercase shadow-2xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 text-lg">MULA BERTUGAS <Sparkles size={20} /></button>
            </div>
          </div>
        </div>
      )}

      {/* AI Bot */}
      <button onClick={() => setIsChatOpen(!isChatOpen)} className="fixed bottom-6 right-6 z-[101] w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group no-print">
        {isChatOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-4 right-4 z-[100] transition-all duration-300 transform ${isChatOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-90 pointer-events-none'}`}>
        <div className="w-[320px] sm:w-[380px] h-[500px] bg-white/90 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="bg-blue-600 p-6 text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl"><Bot size={24} /></div>
              <div><h4 className="text-xs font-black uppercase italic tracking-tighter">SIR AKMAL AI</h4></div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-[11px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white font-bold' : 'bg-white text-gray-700 border border-gray-100 font-bold'}`}>{msg.text}</div>
              </div>
            ))}
            {isAiLoading && <div className="flex justify-start"><div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex gap-1"><span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></span><span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></span></div></div>}
          </div>
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
            <input type="text" placeholder="Tanya tentang jadual..." className="flex-1 bg-gray-50 p-4 rounded-2xl text-[11px] font-bold outline-none" value={userInput} onChange={(e) => setUserInput(e.target.value)} />
            <button type="submit" className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg hover:bg-blue-700" disabled={isAiLoading}><Send size={18} /></button>
          </form>
        </div>
      </div>

      {isGeneratingPdf && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fadeIn">
          <div className="bg-white p-10 rounded-[4rem] shadow-2xl flex flex-col items-center gap-6">
            <div className="p-4 bg-blue-50 rounded-full animate-spin"><RefreshCw size={48} className="text-blue-600" /></div>
            <h3 className="text-xl font-black uppercase italic tracking-tight text-gray-900 text-center">BISMILLAH<br/>
            <span className="text-[10px] font-normal lowercase tracking-normal">Sabar itu indah, Sir Akmal sedang usahakan</span></h3>
          </div>
        </div>
      )}

      <footer className="relative z-10 text-center py-10 opacity-30 no-print"><p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-900">{settings.schoolName} {settings.masterTitle} v9.8</p></footer>
    </div>
  );
};

export default App;
