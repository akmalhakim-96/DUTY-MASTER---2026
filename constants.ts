
import { Teacher, DutyCategory, DutySlot, Day } from './types';

export const DAYS: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const INITIAL_TEACHERS: Teacher[] = [
  { id: '1', name: 'TC ZAZA', role: 'Teacher' },
  { id: '2', name: 'UST AFIF', role: 'Ustad' },
  { id: '3', name: 'SIR HUSAIN', role: 'Sir' },
  { id: '4', name: 'TC SHARIFAH', role: 'Teacher' },
  { id: '5', name: 'TC DINA', role: 'Teacher' },
  { id: '6', name: 'TC AMY', role: 'Teacher' },
  { id: '7', name: 'USTAZAH SAIDA', role: 'Ustadzah' },
  { id: '8', name: 'TC AMIRAH', role: 'Teacher' },
  { id: '9', name: 'UST AMIRUL', role: 'Ustad' },
  { id: '10', name: 'SIR HARRIS', role: 'Sir' },
  { id: '11', name: 'TC AINA', role: 'Teacher' },
  { id: '12', name: 'TC SHUHADA', role: 'Teacher' },
  { id: '13', name: 'TC MAHIRAH', role: 'Teacher' },
  { id: '14', name: 'SIR FAHMIE', role: 'Sir' },
  { id: '15', name: 'SIR AKMAL', role: 'Sir' },
  { id: '16', name: 'TC FAZIRAH', role: 'Teacher' },
  { id: '17', name: 'UST FARISS', role: 'Ustad' },
  { id: '18', name: 'TC SARAH', role: 'Teacher' },
  { id: '19', name: 'TC NAJWA', role: 'Teacher' },
  { id: '20', name: 'TC IZZATI', role: 'Teacher' },
  { id: '21', name: 'SIR RIDZWAN', role: 'Sir' },
  { id: '22', name: 'UST SHAFIQ', role: 'Ustad' }
];

export const CATEGORIES: DutyCategory[] = [
  { id: 'arrival', name: 'Arrival Duty', color: 'bg-yellow-400 border-yellow-600' },
  { id: 'playtime', name: 'Play Time Duty', color: 'bg-purple-100 border-purple-300' },
  { id: 'breakfast', name: 'Breakfast Duty', color: 'bg-blue-100 border-blue-300' },
  { id: 'lunch', name: 'Lunch Duty', color: 'bg-indigo-100 border-indigo-300' },
  { id: 'zuhur', name: 'Zuhur Prayer', color: 'bg-sky-100 border-sky-300' },
  { id: 'dismissal', name: 'Dismissal Duty', color: 'bg-amber-100 border-amber-300' },
];

export const INITIAL_SLOTS: DutySlot[] = [
  // --- ARRIVAL DUTY ---
  { id: 'a-m-1', categoryId: 'arrival', day: 'Monday', time: '7:30 am - 8:00 am', location: 'Main Gate', group: '1 (GROUP A)', teacherIds: ['10', '11'], week: 1, date: '2026-02-09' },
  { id: 'a-m-2', categoryId: 'arrival', day: 'Monday', time: '7:30 am - 8:00 am', location: 'Hall', group: '1 (GROUP A)', teacherIds: ['21', '22'], week: 1, date: '2026-02-09' },
  { id: 'a-t-1', categoryId: 'arrival', day: 'Tuesday', time: '7:30 am - 8:00 am', location: 'Main Gate', group: '1 (GROUP A)', teacherIds: ['1', '2'], week: 1, date: '2026-02-10' },
  { id: 'a-t-2', categoryId: 'arrival', day: 'Tuesday', time: '7:30 am - 8:00 am', location: 'Hall', group: '1 (GROUP A)', teacherIds: ['3', '4'], week: 1, date: '2026-02-10' },
  { id: 'a-w-1', categoryId: 'arrival', day: 'Wednesday', time: '7:30 am - 8:00 am', location: 'Main Gate', group: '1 (GROUP A)', teacherIds: ['5', '6'], week: 1, date: '2026-02-11' },
  { id: 'a-w-2', categoryId: 'arrival', day: 'Wednesday', time: '7:30 am - 8:00 am', location: 'Hall', group: '1 (GROUP A)', teacherIds: ['7', '8'], week: 1, date: '2026-02-11' },
  { id: 'a-th-1', categoryId: 'arrival', day: 'Thursday', time: '7:30 am - 8:00 am', location: 'Main Gate', group: '1 (GROUP A)', teacherIds: ['9', '12'], week: 1, date: '2026-02-12' },
  { id: 'a-th-2', categoryId: 'arrival', day: 'Thursday', time: '7:30 am - 8:00 am', location: 'Hall', group: '1 (GROUP A)', teacherIds: ['13', '14'], week: 1, date: '2026-02-12' },
  { id: 'a-f-1', categoryId: 'arrival', day: 'Friday', time: '7:30 am - 8:00 am', location: 'Main Gate', group: '1 (GROUP A)', teacherIds: ['15', '16'], week: 1, date: '2026-02-13' },
  { id: 'a-f-2', categoryId: 'arrival', day: 'Friday', time: '7:30 am - 8:00 am', location: 'Hall', group: '1 (GROUP A)', teacherIds: ['17', '18'], week: 1, date: '2026-02-13' },

  // --- PLAY TIME DUTY ---
  { id: 'pt-m-1', categoryId: 'playtime', day: 'Monday', time: '12:45 pm - 1:10 pm', location: 'Hall', group: 'Year 1 - 3', teacherIds: ['17', '11'] },
  { id: 'pt-m-2', categoryId: 'playtime', day: 'Monday', time: '12:45 pm - 1:10 pm', location: 'Grass Field', group: 'Year 4 - 6', teacherIds: ['8', '10'] },
  { id: 'pt-t-1', categoryId: 'playtime', day: 'Tuesday', time: '12:45 pm - 1:10 pm', location: 'Hall', group: 'Year 1 - 3', teacherIds: ['16', '3'] },
  { id: 'pt-t-2', categoryId: 'playtime', day: 'Tuesday', time: '12:45 pm - 1:10 pm', location: 'Grass Field', group: 'Year 4 - 6', teacherIds: ['13'] },
  { id: 'pt-w-1', categoryId: 'playtime', day: 'Wednesday', time: '12:45 pm - 1:10 pm', location: 'Hall', group: 'Year 1 - 3', teacherIds: ['14', '15'] },
  { id: 'pt-w-2', categoryId: 'playtime', day: 'Wednesday', time: '12:45 pm - 1:10 pm', location: 'Grass Field', group: 'Year 4 - 6', teacherIds: ['5', '18'] },
  { id: 'pt-th-1', categoryId: 'playtime', day: 'Thursday', time: '12:45 pm - 1:10 pm', location: 'Hall', group: 'Year 1 - 3', teacherIds: ['2', '1'] },
  { id: 'pt-th-2', categoryId: 'playtime', day: 'Thursday', time: '12:45 pm - 1:10 pm', location: 'Grass Field', group: 'Year 4 - 6', teacherIds: ['6', '4'] },

  // --- BREAKFAST ---
  { id: 'b-m-1', categoryId: 'breakfast', day: 'Monday', time: '9:45 am - 10:15 am', location: 'Café', group: 'Lower Level', teacherIds: ['4', '5'] },
  { id: 'b-m-2', categoryId: 'breakfast', day: 'Monday', time: '10:15 am - 10:45 am', location: 'Café', group: 'Upper & Sec', teacherIds: ['17', '1'] },
  // --- LUNCH ---
  { id: 'l-m-1', categoryId: 'lunch', day: 'Monday', time: '12:45 pm - 1:30 pm', location: 'Café', group: 'Lower Level', teacherIds: ['1', '2'] },
];
