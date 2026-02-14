
export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface Teacher {
  id: string;
  name: string;
  role: string;
}

export interface DutySlot {
  id: string;
  categoryId: string;
  day: Day;
  time: string;
  location: string;
  group: string;
  teacherIds: string[];
  week?: number;
  date?: string;
}

export interface DutyCategory {
  id: string;
  name: string;
  color: string;
}

export interface AppSettings {
  schoolName: string;
  logoUrl: string;
  primaryColor: string;
  backgroundUrl: string;
  adminPassword?: string;
  masterTitle: string;    // Tajuk di Dashboard (e.g. DUTY MASTER)
  masterSubtitle: string; // Subtajuk di Dashboard (e.g. GROUP)
  cloudId?: string;
  lastSynced?: string;
}

export type ViewState = 'dashboard' | 'teacher-view' | 'admin' | 'tracker' | 'arrival-duty' | 'playtime';
