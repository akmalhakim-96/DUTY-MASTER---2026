
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
  Type,
  Music as MusicIcon
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
// 1. FIREBASE CONFIGURATION
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
    if (err.code === 'failed-precondition') console.warn("Firestore persistence failed: Multiple tabs open.");
  });
} catch (err) {}

declare const html2canvas: any;
declare const jspdf: any;

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
    masterSubtitle: 'GROUP'
  });

  const [isCloudLoading, setIsCloudLoading] = useState(true);
  const [cloudStatus, setCloudStatus] = useState<'synced' | 'pending' | 'offline' | 'error'>('pending');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [adminTab, setAdminTab] = useState<'slots' | 'teachers' | 'settings'>('slots');
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Halo! Saya SIR AKMAL (AI). Ada apa-apa yang boleh saya bantu tentang jadual tugasan hari ini?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [draftSlots, setDraftSlots] = useState<DutySlot[]>([]);
  const [draftTeachers, setDraftTeachers] = useState<Teacher[]>([]);
  const [draftSettings, setDraftSettings] = useState<AppSettings>(settings);
  
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');

  // Logik Music Autoplay: Sebaik sahaja user masuk dan klik/sentuh mana-mana bahagian screen, muzik akan ON secara automatik.
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (settings.musicUrl && !isMusicPlaying) {
        setIsMusicPlaying(true);
      }
      // Remove listener selepas interaction pertama berjaya
      window.removeEventListener('mousedown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
    
    window.addEventListener('mousedown', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);

    return () => {
      window.removeEventListener('mousedown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [settings.musicUrl, isMusicPlaying]);

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
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(slots) !== JSON.stringify(draftSlots) ||
           JSON.stringify(teachers) !== JSON.stringify(draftTeachers) ||
           JSON.stringify(settings) !== JSON.stringify(draftSettings);
  }, [slots, draftSlots, teachers, draftTeachers, settings, draftSettings]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === settings.adminPassword || passwordInput === MASTER_PASSWORD) {
      setIsAdminAuthenticated(true);
      setLoginError(false);
      setDraftSlots(JSON.parse(JSON.stringify(slots)));
      setDraftTeachers(JSON.parse(JSON.stringify(teachers)));
      setDraftSettings(JSON.parse(JSON.stringify(settings)));
    } else {
      setLoginError(true);
    }
  };

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
      setCloudStatus('error');
    } finally {
      setIsCloudLoading(false);
    }
  };

  const handleApplyChanges = async () => {
    if (confirm("Simpan semua perubahan ke Cloud?")) {
      await saveToFirestore(draftTeachers, draftSlots, draftSettings);
      setSlots(draftSlots);
      setTeachers(draftTeachers);
      setSettings(draftSettings);
      setActiveView('dashboard');
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

  const formatDisplayDate = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);
      const monthNames = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];
      return `${day} - ${monthNames[month - 1]} - ${year}`;
    }
    return dateStr;
  };

  const isVideoUrl = (url: string) => url?.startsWith('data:video/') || url?.match(/\.(mp4|webm|ogg)$/i);
  const getYoutubeId = (url: string | undefined) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
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
      const now = new Date();
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const currentDayName = dayNames[now.getDay()];
      const currentDateString = now.toISOString().split('T')[0];
      const teachersContext = teachers.map(t => `${t.name} (${t.role})`).join(', ');
      const slotsContext = slots.map(s => `${s.day} @ ${s.time} - ${s.location}: ${s.teacherIds.map(id => teachers.find(t => t.id === id)?.name).join(', ')}`).join('; ');
      const systemInstruction = `Anda SIR AKMAL, pengurus tugasan ${settings.schoolName}. Hari ini ${currentDayName} (${currentDateString}). GURU: ${teachersContext}. JADUAL: ${slotsContext}. Jawab soalan tugasan secara profesional dan mesra.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: systemInstruction }] }, ...chatMessages.map(m => ({ role: m.role === 'ai' ? 'model' : 'user', parts: [{ text: m.text }] })), { role: 'user', parts: [{ text: currentInput }] }],
      });
      setChatMessages(prev => [...prev, { role: 'ai', text: response.text || "Maaf, sistem AI sibuk." }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'ai', text: "Gagal menyambung ke AI." }]);
    } finally { setIsAiLoading(false); }
  };

  const downloadTeacherPdf = async () => {
    if (!selectedTeacherId) return;
    setIsGeneratingPdf(true);

    let aiQuote = "Berkhidmatlah dengan ikhlas, kerana setiap kebaikan itu adalah sedekah.";
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Berikan satu kata-kata semangat atau mutiara kata yang sangat pendek untuk guru yang sedang bertugas, sertakan satu rujukan ringkas (sepotong ayat) dari Al-Quran atau Hadis yang berkaitan dengan amanah atau ganjaran beramal. Gunakan Bahasa Melayu yang puitis dan menyentuh hati. Maksimum 30 patah perkataan.",
      });
      if (response.text) aiQuote = response.text;
    } catch (e) {
      console.warn("AI Quote failed, using fallback.");
    }

    const printContainer = document.createElement('div');
    printContainer.style.position = 'fixed';
    printContainer.style.left = '-9999px';
    printContainer.style.top = '0';
    printContainer.style.width = '800px'; 
    printContainer.style.backgroundColor = 'white';
    printContainer.style.padding = '0';
    printContainer.style.fontFamily = "'Inter', sans-serif";
    document.body.appendChild(printContainer);

    const teacher = teachers.find(t => t.id === selectedTeacherId);
    const teacherSlots = slots.filter(s => s.teacherIds.includes(selectedTeacherId)).sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day));

    printContainer.innerHTML = `
      <div style="padding: 60px; min-height: 1000px; display: flex; flex-direction: column; background: white;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 5px solid #2563eb; padding-bottom: 25px; margin-bottom: 40px;">
          <div style="display: flex; align-items: center; gap: 20px;">
            <img src="${settings.logoUrl}" style="width: 100px; height: 100px; object-fit: contain;">
            <div>
              <h1 style="font-size: 32px; font-weight: 900; color: #111827; margin: 0; text-transform: uppercase; letter-spacing: -0.02em;">${settings.schoolName}</h1>
              <p style="font-size: 14px; font-weight: 800; color: #2563eb; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.2em;">Official Duty Schedule</p>
            </div>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 10px; font-weight: 900; color: #9ca3af; text-transform: uppercase; margin: 0;">Date Generated</p>
            <p style="font-size: 14px; font-weight: 800; color: #111827; margin: 2px 0 0 0;">${new Date().toLocaleDateString('ms-MY')}</p>
          </div>
        </div>

        <div style="background: #eff6ff; padding: 35px; border-radius: 30px; border: 2px solid #dbeafe; margin-bottom: 40px; position: relative; overflow: hidden;">
          <h2 style="font-size: 26px; font-weight: 900; color: #1e40af; margin: 0; text-transform: uppercase; position: relative; z-index: 1;">${teacher?.name}</h2>
          <p style="font-size: 14px; font-weight: 700; color: #60a5fa; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em; position: relative; z-index: 1;">${teacher?.role || 'Academic Staff'}</p>
          <div style="position: absolute; right: -20px; bottom: -20px; opacity: 0.05; transform: rotate(-15deg);"><img src="${settings.logoUrl}" style="width: 150px; height: 150px;"></div>
        </div>

        <div style="flex: 1;">
          <h3 style="font-size: 12px; font-weight: 900; color: #111827; text-transform: uppercase; letter-spacing: 0.3em; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
            <span style="width: 30px; height: 2px; background: #2563eb;"></span> Senarai Tugasan Mingguan
          </h3>
          <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
            ${teacherSlots.map(duty => `
              <div style="background: white; padding: 25px; border-radius: 20px; border: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); page-break-inside: avoid;">
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <span style="font-size: 16px; font-weight: 900; color: #2563eb; text-transform: uppercase; font-style: italic;">${duty.day}</span>
                  <span style="font-size: 15px; font-weight: 900; color: #111827;">${duty.time}</span>
                  <span style="font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase;">Lokasi: ${duty.location}</span>
                </div>
                <div style="text-align: right;">
                   <span style="font-size: 10px; font-weight: 900; padding: 8px 15px; border-radius: 12px; background: #2563eb; color: white; text-transform: uppercase; letter-spacing: 0.05em;">
                    ${CATEGORIES.find(c => c.id === duty.categoryId)?.name}
                   </span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="margin-top: 60px; padding: 40px; background: #f8fafc; border-radius: 30px; border: 1px dashed #cbd5e1; text-align: center;">
          <p style="font-size: 16px; font-weight: 700; color: #334155; line-height: 1.6; font-style: italic; margin-bottom: 15px;">"${aiQuote}"</p>
          <div style="width: 50px; height: 3px; background: #2563eb; margin: 0 auto 15px auto;"></div>
          <p style="font-size: 12px; font-weight: 900; color: #2563eb; text-transform: uppercase; letter-spacing: 0.1em; margin: 0;">Ikhlas daripada SIR AKMAL</p>
        </div>
        
        <div style="margin-top: 30px; text-align: center; font-size: 9px; color: #9ca3af; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em;">
          Generated by Duty Master AI System
        </div>
      </div>
    `;

    try {
      await new Promise(r => setTimeout(r, 1000));
      const canvas = await html2canvas(printContainer, { 
        scale: 2, 
        useCORS: true, 
        logging: false, 
        backgroundColor: '#ffffff',
        windowWidth: 800,
        height: printContainer.scrollHeight 
      });
      
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Jadual_Tugasan_${teacher?.name?.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error(error);
      alert("Gagal memuat turun PDF. Sila cuba lagi.");
    } finally {
      document.body.removeChild(printContainer);
      setIsGeneratingPdf(false);
    }
  };

  const chartData = useMemo(() => {
    return teachers.map(t => ({ 
      name: t.name, 
      duties: slots.filter(s => s.teacherIds.includes(t.id) && s.categoryId !== 'arrival').length 
    })).sort((a, b) => b.duties - a.duties);
  }, [teachers, slots]);

  const youtubeId = useMemo(() => getYoutubeId(settings.musicUrl), [settings.musicUrl]);

  // Master reordering as requested: breakfast, playtime, zuhur, lunch, dismissal
  const masterCategoryOrder = ['breakfast', 'playtime', 'zuhur', 'lunch', 'dismissal'];

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <style>{`
        body { overflow-x: hidden; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @media (max-width: 640px) {
          .mobile-stack table, .mobile-stack thead, .mobile-stack tbody, .mobile-stack th, .mobile-stack td, .mobile-stack tr { display: block; }
          .mobile-stack thead tr { position: absolute; top: -9999px; left: -9999px; }
          .mobile-stack tr { margin-bottom: 1rem; border: 1px solid #f3f4f6; border-radius: 1.5rem; overflow: hidden; background: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .mobile-stack td { border: none !important; position: relative; padding: 0.75rem 1rem 0.75rem 40% !important; text-align: right !important; min-height: 40px; display: flex; align-items: center; justify-content: flex-end; border-bottom: 1px solid #f8fafc !important; }
          .mobile-stack td:before { content: attr(data-label); position: absolute; left: 1rem; width: 35%; text-align: left; font-weight: 900; text-transform: uppercase; font-size: 8px; color: #9ca3af; }
          .mobile-stack td:last-child { border-bottom: none !important; }
        }
        @keyframes music-bars { 0%, 100% { height: 2px; } 50% { height: 12px; } }
        .music-bar { animation: music-bars 1s ease-in-out infinite; }
      `}</style>

      {isGeneratingPdf && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fadeIn">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4">
            <Loader2 size={48} className="text-blue-600 animate-spin" />
            <h3 className="text-lg font-black uppercase italic tracking-tight text-center text-gray-900">Sabar Itu Indah, <br/> Harap tenang</h3>
          </div>
        </div>
      )}

      {isMusicPlaying && youtubeId && (
        <div className="fixed opacity-0 pointer-events-none w-1 h-1 overflow-hidden z-[-1]">
          <iframe width="560" height="315" src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&loop=1&playlist=${youtubeId}`} title="YouTube Player" allow="autoplay"></iframe>
        </div>
      )}

      <div className="fixed inset-0 z-0">
        {isVideoUrl(settings.backgroundUrl) ? <video src={settings.backgroundUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline /> : <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${settings.backgroundUrl})` }} />}
      </div>

      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer group" onClick={() => setActiveView('dashboard')}>
            <div className="p-1 bg-white rounded-lg shadow-sm border border-gray-100 group-hover:scale-105 transition-transform"><img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain" /></div>
            <div className="hidden xs:block"><h1 className="text-xs font-black uppercase text-gray-900">{settings.schoolName}</h1></div>
          </div>
          <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-2">
            <button onClick={() => { setActiveView('dashboard'); setIsAdminAuthenticated(false); }} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${activeView === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-white/50'}`}><LayoutDashboard size={18} /><span className="text-[10px] font-bold sm:block hidden uppercase">Master</span></button>
            <button onClick={() => { setActiveView('arrival-duty'); setIsAdminAuthenticated(false); }} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${activeView === 'arrival-duty' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-white/50'}`}><Clock size={18} /><span className="text-[10px] font-bold sm:block hidden uppercase">Arrival</span></button>
            <button onClick={() => { setActiveView('teacher-view'); setIsAdminAuthenticated(false); }} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${activeView === 'teacher-view' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-white/50'}`}><Search size={18} /><span className="text-[10px] font-bold sm:block hidden uppercase">Semak</span></button>
            <button onClick={() => { setActiveView('tracker'); setIsAdminAuthenticated(false); }} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${activeView === 'tracker' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-white/50'}`}><BarChart3 size={18} /><span className="text-[10px] font-bold sm:block hidden uppercase">Tracker</span></button>
            <button onClick={() => setActiveView('admin')} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${activeView === 'admin' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-white/50'}`}><Settings size={18} /><span className="text-[10px] font-bold sm:block hidden uppercase">Admin</span></button>
          </nav>
          <div className="flex items-center space-x-2">
             {youtubeId && <button onClick={() => setIsMusicPlaying(!isMusicPlaying)} className={`p-2 rounded-xl flex items-center gap-1.5 transition-all ${isMusicPlaying ? 'bg-red-600 text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                {isMusicPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
                {isMusicPlaying && <div className="flex items-end gap-0.5 h-3"><div className="music-bar w-0.5 bg-white"></div><div className="music-bar w-0.5 bg-white" style={{animationDelay:'0.2s'}}></div><div className="music-bar w-0.5 bg-white" style={{animationDelay:'0.4s'}}></div></div>}
             </button>}
             <div className={`p-2 rounded-xl ${cloudStatus === 'synced' ? 'text-green-600' : 'text-amber-500'}`}>{isCloudLoading ? <RefreshCw className="animate-spin" size={18} /> : <Cloud size={18} />}</div>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 py-6 mb-24">
        {activeView === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-blue-600 p-8 rounded-[2.5rem] shadow-xl text-white flex justify-between items-center relative overflow-hidden group">
                 <div className="relative z-10"><h2 className="text-3xl font-black uppercase italic leading-none tracking-tight">{settings.masterTitle}</h2><p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-2">{settings.masterSubtitle}</p></div>
                 <Calendar size={48} className="relative z-10 opacity-40 group-hover:scale-110 transition-transform" />
              </div>
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col justify-between">
                <div className="flex justify-between items-start"><div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><TrendingUp size={24} /></div><span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Load Summary</span></div>
                <div><h4 className="text-xs font-black uppercase text-gray-900 mb-2">Most Active:</h4><div className="flex items-center gap-2"><div className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-[10px] font-black uppercase">{chartData[0]?.name.substring(0,2)}</div><div><p className="text-[10px] font-black text-gray-900 uppercase leading-none">{chartData[0]?.name}</p><p className="text-[8px] font-bold text-gray-400 uppercase">{chartData[0]?.duties} Tasks</p></div></div></div>
              </div>
            </div>

            <div className="space-y-6">
              {masterCategoryOrder.map(catId => {
                const cat = CATEGORIES.find(c => c.id === catId);
                if (!cat) return null;
                return (
                  <div key={cat.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                    <div className={`px-6 py-4 ${cat.color} border-b-2 font-black uppercase text-[11px] text-gray-800 tracking-widest`}>{cat.name}</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left mobile-stack">
                        <thead className="hidden sm:table-header-group bg-gray-50/50 text-[9px] font-black text-gray-400 uppercase border-b">
                          <tr><th className="px-6 py-4">Hari</th><th className="px-6 py-4">Kumpulan</th><th className="px-6 py-4">Slot</th><th className="px-6 py-4">Guru</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {DAYS.map(day => slots.filter(s => s.categoryId === cat.id && s.day === day).map(slot => (
                            <tr key={slot.id} className="hover:bg-blue-50/20 transition-colors">
                              <td className="px-6 py-4 font-black text-blue-700 text-xs" data-label="Hari">{day.toUpperCase()}</td>
                              <td className="px-6 py-4" data-label="Kumpulan"><span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-[9px] font-black uppercase border border-gray-200">{slot.group}</span></td>
                              <td className="px-6 py-4" data-label="Slot"><div className="font-black text-gray-900 text-xs">{slot.time}</div><div className="text-[9px] font-bold text-gray-400 uppercase italic">@{slot.location}</div></td>
                              <td className="px-6 py-4" data-label="Guru">
                                <div className="flex flex-wrap gap-1.5 sm:justify-start justify-end">
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
            <div className="bg-yellow-400 p-8 rounded-[3rem] shadow-xl text-gray-900 flex justify-between items-center overflow-hidden relative">
               <div className="relative z-10"><h2 className="text-3xl font-black uppercase italic">Arrival Duty</h2><p className="text-[10px] font-black opacity-80 uppercase mt-1">Sesi Pagi: 7.30 am – 8.00 am</p></div>
               <Clock size={48} className="relative z-10" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {DAYS.map(day => {
                  const daySlots = slots.filter(s => s.categoryId === 'arrival' && s.day === day);
                  return (
                    <div key={day} className="bg-white p-6 rounded-[2.5rem] border-2 border-yellow-400 shadow-sm">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                        <div className="flex flex-col"><span className="text-lg font-black uppercase text-gray-900">{day}</span>{daySlots.length > 0 && <span className="text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-lg w-fit mt-1">{formatDisplayDate(daySlots[0].date)}</span>}</div>
                      </div>
                      <div className="space-y-4">
                        {['Main Gate', 'Hall'].map(loc => (
                          <div key={loc} className="flex flex-col gap-1.5 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{loc}</span>
                            <div className="flex flex-wrap gap-1.5">{daySlots.find(s => s.location === loc)?.teacherIds.map(tid => <span key={tid} className="bg-white px-2.5 py-1 rounded-lg text-[10px] font-black border border-gray-200 text-gray-700 shadow-sm">{teachers.find(t => t.id === tid)?.name}</span>)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
               })}
            </div>
          </div>
        )}

        {activeView === 'teacher-view' && (
          <div className="max-w-md mx-auto space-y-6 animate-fadeIn">
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 text-center">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl"><Search size={40} /></div>
              <h2 className="text-2xl font-black mb-1 uppercase italic text-gray-900">Semak Jadual</h2>
              <div className="space-y-4">
                <select className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl font-black text-gray-700 text-xs text-center outline-none focus:border-blue-500 transition-all appearance-none" value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)}>
                  <option value="">-- PILIH NAMA GURU --</option>
                  {teachers.sort((a,b) => a.name.localeCompare(b.name)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {selectedTeacherId && (
                  <div className="flex items-center justify-between p-5 bg-blue-50 rounded-[2rem] border border-blue-100">
                    <div className="text-left"><p className="text-[10px] font-black text-blue-600 uppercase leading-none">Total Tasks</p><h4 className="text-2xl font-black text-blue-800 mt-1">{slots.filter(s => s.teacherIds.includes(selectedTeacherId)).length}</h4></div>
                    <button onClick={downloadTeacherPdf} disabled={isGeneratingPdf} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50">
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
                    <div className="flex items-center justify-between mb-3"><span className="text-sm font-black uppercase text-blue-700 italic">{duty.day}</span><span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase text-white ${duty.categoryId === 'arrival' ? 'bg-yellow-500' : 'bg-blue-600'}`}>{CATEGORIES.find(c => c.id === duty.categoryId)?.name}</span></div>
                    {duty.date && <div className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-lg w-fit mb-3">{formatDisplayDate(duty.date)}</div>}
                    <div className="text-sm font-black text-gray-900 mb-1">{duty.time}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">@{duty.location}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === 'tracker' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <div className="bg-indigo-600 p-8 rounded-[3rem] shadow-xl text-white flex justify-between items-center relative overflow-hidden">
              <div className="relative z-10"><h2 className="text-3xl font-black uppercase italic">Teacher Tracker</h2><p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">Weekly Workload Analysis</p></div>
              <BarChart3 size={48} className="relative z-10" />
            </div>
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 30, top: 20, bottom: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc', radius: 12 }} contentStyle={{ borderRadius: '20px', border: 'none', fontSize: '11px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="duties" radius={[0, 8, 8, 0]} barSize={16}>
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.duties > 4 ? '#ef4444' : '#3b82f6'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeView === 'admin' && isAdminAuthenticated && (
          <div className="animate-fadeIn max-w-5xl mx-auto space-y-6">
            <div className="bg-white p-4 rounded-[2.5rem] shadow-xl border flex gap-3 overflow-x-auto no-scrollbar">
               <button onClick={() => setAdminTab('slots')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${adminTab === 'slots' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 bg-gray-50'}`}><Calendar size={16}/> Slots Editor</button>
               <button onClick={() => setAdminTab('teachers')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${adminTab === 'teachers' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 bg-gray-50'}`}><Users size={16}/> Teachers List</button>
               <button onClick={() => setAdminTab('settings')} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${adminTab === 'settings' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 bg-gray-50'}`}><ImageIcon size={16}/> Design Settings</button>
               <button onClick={() => setIsAdminAuthenticated(false)} className="ml-auto px-6 py-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase hover:bg-red-100 transition-colors">Exit Admin</button>
            </div>

            {adminTab === 'slots' && (
              <div className="bg-white p-8 rounded-[3rem] border shadow-2xl space-y-8">
                 <h3 className="text-xl font-black uppercase italic text-gray-900 tracking-tight">Duty Slots Editor</h3>
                 {CATEGORIES.map(cat => (
                  <div key={cat.id} className="border border-gray-100 rounded-[2.5rem] overflow-hidden group hover:border-blue-200 transition-all">
                    <div className={`px-6 py-4 font-black uppercase text-xs ${cat.color} flex justify-between items-center border-b`}>
                      <span>{cat.name}</span>
                      <button onClick={() => setDraftSlots([...draftSlots, { id: `slot-${Date.now()}`, categoryId: cat.id, day: 'Monday', time: '8:00 am - 8:30 am', location: 'Hall', group: 'General', teacherIds: [] }])} className="bg-white/50 p-2 rounded-xl hover:bg-white/80 transition-colors"><Plus size={18} /></button>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {draftSlots.filter(s => s.categoryId === cat.id).map(slot => (
                          <div key={slot.id} className="p-6 hover:bg-gray-50/50">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-gray-400 uppercase">Day</label>
                                <select className="w-full text-xs font-black bg-gray-50 p-3 rounded-2xl border border-gray-100 focus:border-blue-400 outline-none" value={slot.day} onChange={(e) => setDraftSlots(draftSlots.map(s => s.id === slot.id ? {...s, day: e.target.value as Day} : s))}> {DAYS.map(d => <option key={d} value={d}>{d}</option>)} </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-gray-400 uppercase">Time</label>
                                <input className="w-full text-xs font-black bg-gray-50 p-3 rounded-2xl border border-gray-100" value={slot.time} onChange={(e) => setDraftSlots(draftSlots.map(s => s.id === slot.id ? {...s, time: e.target.value} : s))} />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black text-gray-400 uppercase">Location</label>
                                <input className="w-full text-xs font-black bg-gray-50 p-3 rounded-2xl border border-gray-100" value={slot.location} onChange={(e) => setDraftSlots(draftSlots.map(s => s.id === slot.id ? {...s, location: e.target.value} : s))} />
                              </div>
                              <div className="flex items-end">
                                <button onClick={() => setDraftSlots(draftSlots.filter(s => s.id !== slot.id))} className="w-full p-3 text-red-500 font-black text-[10px] uppercase hover:bg-red-50 rounded-2xl transition-colors flex items-center justify-center gap-1"><Trash2 size={14}/> Delete</button>
                              </div>
                            </div>
                            <div className="mt-4">
                              <label className="text-[8px] font-black text-gray-400 uppercase mb-2 block">Assigned Teachers</label>
                              <div className="flex flex-wrap gap-2">
                                {draftTeachers.map(t => (
                                  <button key={t.id} onClick={() => {
                                    const newIds = slot.teacherIds.includes(t.id) ? slot.teacherIds.filter(id => id !== t.id) : [...slot.teacherIds, t.id];
                                    setDraftSlots(draftSlots.map(s => s.id === slot.id ? {...s, teacherIds: newIds} : s));
                                  }} className={`px-3 py-2 rounded-xl text-[9px] font-black transition-all ${slot.teacherIds.includes(t.id) ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}>{t.name}</button>
                                ))}
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
              <div className="bg-white p-8 rounded-[3rem] border shadow-2xl space-y-6">
                <div className="flex justify-between items-center"><h3 className="text-xl font-black uppercase text-gray-900 tracking-tight">Manage Teachers</h3><button onClick={() => { const name = prompt("Teacher Name:"); if(name) setDraftTeachers([...draftTeachers, { id: `t-${Date.now()}`, name: name.toUpperCase(), role: 'Teacher' }]) }} className="bg-blue-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase shadow-lg hover:bg-blue-700 transition-all">+ New Teacher</button></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {draftTeachers.map(t => (
                    <div key={t.id} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center border border-gray-100 group">
                      <div><p className="text-xs font-black uppercase text-gray-900">{t.name}</p><p className="text-[9px] font-bold text-gray-400 uppercase">{t.role}</p></div>
                      <button onClick={() => setDraftTeachers(draftTeachers.filter(teach => teach.id !== t.id))} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {adminTab === 'settings' && (
              <div className="bg-white p-8 rounded-[3rem] border shadow-2xl space-y-8">
                <h3 className="text-xl font-black uppercase italic text-gray-900">Design & Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">School Name</label><input type="text" className="w-full p-4 bg-gray-50 rounded-2xl font-black text-xs border border-gray-100 outline-none focus:border-blue-400" value={draftSettings.schoolName} onChange={(e) => setDraftSettings({...draftSettings, schoolName: e.target.value})} /></div>
                      <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Dashboard Title</label><input type="text" className="w-full p-4 bg-gray-50 rounded-2xl font-black text-xs border border-gray-100 outline-none focus:border-blue-400" value={draftSettings.masterTitle} onChange={(e) => setDraftSettings({...draftSettings, masterTitle: e.target.value})} /></div>
                      <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Dashboard Subtitle</label><input type="text" className="w-full p-4 bg-gray-50 rounded-2xl font-black text-xs border border-gray-100 outline-none focus:border-blue-400" value={draftSettings.masterSubtitle} onChange={(e) => setDraftSettings({...draftSettings, masterSubtitle: e.target.value})} /></div>
                      <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Admin Password</label><input type="text" className="w-full p-4 bg-gray-50 rounded-2xl font-black text-xs border border-gray-100 outline-none focus:border-blue-400" value={draftSettings.adminPassword} onChange={(e) => setDraftSettings({...draftSettings, adminPassword: e.target.value})} /></div>
                   </div>
                   <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Music URL (Youtube Link)</label>
                        <div className="flex gap-2">
                          <input type="text" className="flex-1 p-4 bg-gray-50 rounded-2xl font-black text-xs border border-gray-100" placeholder="https://youtube.com/..." value={draftSettings.musicUrl} onChange={(e) => setDraftSettings({...draftSettings, musicUrl: e.target.value})} />
                          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center border border-red-100"><MusicIcon size={20}/></div>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">School Logo</label>
                        <div className="flex items-center gap-4">
                           <div className="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden"><img src={draftSettings.logoUrl} className="w-full h-full object-contain" /></div>
                           <input type="file" accept="image/*" onChange={async (e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                               const base64 = await resizeImage(file, 400);
                               setDraftSettings({...draftSettings, logoUrl: base64});
                             }
                           }} className="text-[10px] font-black text-gray-500" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Background (Image or Video)</label>
                        <input type="text" className="w-full p-4 bg-gray-50 rounded-2xl font-black text-xs border border-gray-100 mb-2" placeholder="Image/Video URL" value={draftSettings.backgroundUrl} onChange={(e) => setDraftSettings({...draftSettings, backgroundUrl: e.target.value})} />
                        <div className="text-[8px] font-bold text-gray-400 uppercase italic">* Use Unsplash or MP4 direct links for better visuals</div>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'admin' && !isAdminAuthenticated && (
          <div className="max-w-md mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl border-4 border-blue-600 text-center animate-fadeIn relative overflow-hidden">
            <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl relative z-10"><Lock size={40} /></div>
            <h2 className="text-3xl font-black mb-8 italic uppercase text-gray-900 tracking-tight relative z-10">Admin Login</h2>
            <form onSubmit={handleAdminLogin} className="space-y-4 relative z-10">
              <input type="password" className={`w-full p-5 bg-gray-50 border-2 ${loginError ? 'border-red-500' : 'border-gray-100'} rounded-[2rem] font-black outline-none text-center focus:border-blue-500 transition-all`} placeholder="PASSWORD" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} />
              {loginError && <p className="text-red-500 text-[10px] font-black uppercase">Wrong Password!</p>}
              <button type="submit" className="w-full bg-blue-600 text-white p-5 rounded-[2rem] font-black uppercase shadow-lg hover:bg-blue-700 active:scale-95 transition-all">Verify Identity</button>
            </form>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16"></div>
          </div>
        )}
      </main>

      <div className={`fixed bottom-4 right-4 z-[100] transition-all duration-300 transform ${isChatOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-90 pointer-events-none'}`}>
        <div className="w-[320px] sm:w-[380px] h-[500px] bg-white/90 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="bg-blue-600 p-6 text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl"><Bot size={24} /></div>
              <div><h4 className="text-xs font-black uppercase italic tracking-tighter">SIR AKMAL AI</h4><div className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span><span className="text-[8px] font-black uppercase opacity-80">Online</span></div></div>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30 no-scrollbar">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-[11px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white font-bold' : 'bg-white text-gray-700 border border-gray-100 font-bold'}`}>{msg.text}</div>
              </div>
            ))}
            {isAiLoading && <div className="flex justify-start"><div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex gap-1"><span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></span><span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></span></div></div>}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
            <input type="text" placeholder="Tanya tentang jadual..." className="flex-1 bg-gray-50 p-4 rounded-2xl text-[11px] font-bold outline-none focus:bg-white focus:ring-2 ring-blue-100 transition-all" value={userInput} onChange={(e) => setUserInput(e.target.value)} />
            <button type="submit" className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg hover:bg-blue-700 transition-all" disabled={isAiLoading}><Send size={18} /></button>
          </form>
        </div>
      </div>

      <button onClick={() => setIsChatOpen(!isChatOpen)} className="fixed bottom-6 right-6 z-[101] w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group no-print">
        {isChatOpen ? <X size={28} /> : <MessageSquare size={28} />}
        {!isChatOpen && <span className="absolute -top-1 -right-1 flex h-5 w-5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-5 w-5 bg-blue-500 flex items-center justify-center text-[9px] font-black">SIR</span></span>}
      </button>

      {isAdminAuthenticated && hasUnsavedChanges && activeView === 'admin' && (
        <div className="fixed bottom-0 left-0 right-0 z-[110] p-6 no-print">
          <div className="max-w-4xl mx-auto bg-gray-900/95 backdrop-blur-xl text-white p-6 rounded-[3rem] shadow-2xl flex items-center justify-between border border-white/10 ring-1 ring-blue-500/50 animate-fadeIn">
            <div className="flex items-center gap-4"><AlertCircle size={24} className="text-amber-500 animate-pulse" /><div><p className="text-xs font-black uppercase italic text-amber-500">Unsaved Changes!</p><p className="text-[9px] text-gray-400 font-bold uppercase">Sync to Cloud for all devices</p></div></div>
            <button onClick={handleApplyChanges} className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-2xl text-xs font-black uppercase flex items-center gap-2 shadow-xl transition-all"><Save size={20} /> SYNC CLOUD</button>
          </div>
        </div>
      )}

      <footer className="relative z-10 text-center py-10 opacity-30 no-print"><p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-900">{settings.schoolName} {settings.masterTitle} v7.5</p></footer>
    </div>
  );
};

export default App;
