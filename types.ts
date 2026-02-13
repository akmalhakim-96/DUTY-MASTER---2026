
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
  group: string; // e.g., "Lower Level", "Ushers", "Level G", or "GROUP A"
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
}

export type ViewState = 'dashboard' | 'teacher-view' | 'admin' | 'tracker' | 'arrival-duty';
