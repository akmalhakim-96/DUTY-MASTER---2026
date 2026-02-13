
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
  { id: 'breakfast', name: 'Breakfast Duty', color: 'bg-blue-100 border-blue-300' },
  { id: 'lunch', name: 'Lunch Duty', color: 'bg-indigo-100 border-indigo-300' },
  { id: 'zuhur', name: 'Zuhur Prayer', color: 'bg-sky-100 border-sky-300' },
  { id: 'dismissal', name: 'Dismissal Duty', color: 'bg-amber-100 border-amber-300' },
];

export const INITIAL_SLOTS: DutySlot[] = [
  // --- ARRIVAL DUTY (NEW) ---
  { id: 'a-m-1', categoryId: 'arrival', day: 'Monday', time: '7:30 am - 8:00 am', location: 'Main Gate', group: '1 (GROUP A)', teacherIds: ['10', '11'], week: 1, date: '9-Feb-26' },
  { id: 'a-m-2', categoryId: 'arrival', day: 'Monday', time: '7:30 am - 8:00 am', location: 'Hall', group: '1 (GROUP A)', teacherIds: ['21', '22'], week: 1, date: '9-Feb-26' },
  
  { id: 'a-t-1', categoryId: 'arrival', day: 'Tuesday', time: '7:30 am - 8:00 am', location: 'Main Gate', group: '1 (GROUP A)', teacherIds: ['1', '2'], week: 1, date: '10-Feb-26' },
  { id: 'a-t-2', categoryId: 'arrival', day: 'Tuesday', time: '7:30 am - 8:00 am', location: 'Hall', group: '1 (GROUP A)', teacherIds: ['3', '4'], week: 1, date: '10-Feb-26' },

  { id: 'a-w-1', categoryId: 'arrival', day: 'Wednesday', time: '7:30 am - 8:00 am', location: 'Main Gate', group: '1 (GROUP A)', teacherIds: ['5', '6'], week: 1, date: '11-Feb-26' },
  { id: 'a-w-2', categoryId: 'arrival', day: 'Wednesday', time: '7:30 am - 8:00 am', location: 'Hall', group: '1 (GROUP A)', teacherIds: ['7', '8'], week: 1, date: '11-Feb-26' },

  { id: 'a-th-1', categoryId: 'arrival', day: 'Thursday', time: '7:30 am - 8:00 am', location: 'Main Gate', group: '1 (GROUP A)', teacherIds: ['9', '12'], week: 1, date: '12-Feb-26' },
  { id: 'a-th-2', categoryId: 'arrival', day: 'Thursday', time: '7:30 am - 8:00 am', location: 'Hall', group: '1 (GROUP A)', teacherIds: ['13', '14'], week: 1, date: '12-Feb-26' },

  { id: 'a-f-1', categoryId: 'arrival', day: 'Friday', time: '7:30 am - 8:00 am', location: 'Main Gate', group: '1 (GROUP A)', teacherIds: ['15', '16'], week: 1, date: '13-Feb-26' },
  { id: 'a-f-2', categoryId: 'arrival', day: 'Friday', time: '7:30 am - 8:00 am', location: 'Hall', group: '1 (GROUP A)', teacherIds: ['17', '18'], week: 1, date: '13-Feb-26' },

  // --- MONDAY ---
  { id: 'b-m-1', categoryId: 'breakfast', day: 'Monday', time: '9:45 am - 10:15 am', location: 'Café', group: 'Lower Level', teacherIds: ['4', '5'] },
  { id: 'b-m-2', categoryId: 'breakfast', day: 'Monday', time: '10:15 am - 10:45 am', location: 'Café', group: 'Upper & Sec', teacherIds: ['17', '1'] },
  { id: 'l-m-1', categoryId: 'lunch', day: 'Monday', time: '12:45 pm - 1:30 pm', location: 'Café', group: 'Lower Level', teacherIds: ['1', '2'] },
  { id: 'l-m-2', categoryId: 'lunch', day: 'Monday', time: '1:30 pm - 2:00 pm', location: 'Café', group: 'Upper & Sec', teacherIds: ['3', '13'] },
  { id: 'd-m-1', categoryId: 'dismissal', day: 'Monday', time: '3:40 pm - 4:10 pm', location: 'Gate A', group: 'Ushers', teacherIds: ['1'] },
  { id: 'd-m-2', categoryId: 'dismissal', day: 'Monday', time: '3:40 pm - 4:10 pm', location: 'Lobby', group: 'Name Takers', teacherIds: ['2', '3'] },
  { id: 'd-m-3', categoryId: 'dismissal', day: 'Monday', time: '3:40 pm - 4:10 pm', location: 'Main Hall', group: 'Hall', teacherIds: ['18', '13'] },
  { id: 'd-m-4', categoryId: 'dismissal', day: 'Monday', time: '3:40 pm - 4:10 pm', location: 'Level G', group: 'Level G', teacherIds: ['19', '20'] },

  // --- TUESDAY ---
  { id: 'b-t-1', categoryId: 'breakfast', day: 'Tuesday', time: '9:45 am - 10:15 am', location: 'Café', group: 'Lower Level', teacherIds: ['6', '7'] },
  { id: 'b-t-2', categoryId: 'breakfast', day: 'Tuesday', time: '10:15 am - 10:45 am', location: 'Café', group: 'Upper & Sec', teacherIds: ['8', '9'] },
  { id: 'l-t-1', categoryId: 'lunch', day: 'Tuesday', time: '12:45 pm - 1:30 pm', location: 'Café', group: 'Lower Level', teacherIds: ['4', '5'] },
  { id: 'z-t-1', categoryId: 'zuhur', day: 'Tuesday', time: '1:30 pm - 2:00 pm', location: 'Surau', group: 'Imam & Monitor', teacherIds: ['2', '17'] },
  { id: 'd-t-1', categoryId: 'dismissal', day: 'Tuesday', time: '3:40 pm - 4:10 pm', location: 'Gate A', group: 'Ushers', teacherIds: ['10'] },
  { id: 'd-t-2', categoryId: 'dismissal', day: 'Tuesday', time: '3:40 pm - 4:10 pm', location: 'Lobby', group: 'Name Takers', teacherIds: ['11', '12'] },
  { id: 'd-t-3', categoryId: 'dismissal', day: 'Tuesday', time: '3:40 pm - 4:10 pm', location: 'Main Hall', group: 'Hall', teacherIds: ['21', '22'] },

  // --- WEDNESDAY ---
  { id: 'b-w-1', categoryId: 'breakfast', day: 'Wednesday', time: '9:45 am - 10:15 am', location: 'Café', group: 'Lower Level', teacherIds: ['10', '11'] },
  { id: 'b-w-2', categoryId: 'breakfast', day: 'Wednesday', time: '10:15 am - 10:45 am', location: 'Café', group: 'Upper & Sec', teacherIds: ['12', '13'] },
  { id: 'l-w-1', categoryId: 'lunch', day: 'Wednesday', time: '12:45 pm - 1:30 pm', location: 'Café', group: 'Lower Level', teacherIds: ['14', '15'] },
  { id: 'l-w-2', categoryId: 'lunch', day: 'Wednesday', time: '1:30 pm - 2:00 pm', location: 'Café', group: 'Upper & Sec', teacherIds: ['16', '1'] },
  { id: 'z-w-1', categoryId: 'zuhur', day: 'Wednesday', time: '1:30 pm - 2:00 pm', location: 'Surau', group: 'Imam & Monitor', teacherIds: ['9', '22'] },
  { id: 'd-w-1', categoryId: 'dismissal', day: 'Wednesday', time: '3:40 pm - 4:10 pm', location: 'Lobby', group: 'Name Takers', teacherIds: ['16', '1'] },
  { id: 'd-w-2', categoryId: 'dismissal', day: 'Wednesday', time: '3:40 pm - 4:10 pm', location: 'Drop-off', group: 'Level G', teacherIds: ['2'] },
  { id: 'd-w-3', categoryId: 'dismissal', day: 'Wednesday', time: '3:40 pm - 4:10 pm', location: 'Gate A', group: 'Ushers', teacherIds: ['3'] },

  // --- THURSDAY ---
  { id: 'b-th-1', categoryId: 'breakfast', day: 'Thursday', time: '9:45 am - 10:15 am', location: 'Café', group: 'Lower Level', teacherIds: ['14', '15'] },
  { id: 'b-th-2', categoryId: 'breakfast', day: 'Thursday', time: '10:15 am - 10:45 am', location: 'Café', group: 'Upper & Sec', teacherIds: ['16', '18'] },
  { id: 'l-th-1', categoryId: 'lunch', day: 'Thursday', time: '12:45 pm - 1:30 pm', location: 'Café', group: 'Lower Level', teacherIds: ['6', '7'] },
  { id: 'z-th-1', categoryId: 'zuhur', day: 'Thursday', time: '1:30 pm - 2:00 pm', location: 'Surau', group: 'Imam & Monitor', teacherIds: ['17', '21'] },
  { id: 'd-th-1', categoryId: 'dismissal', day: 'Thursday', time: '3:40 pm - 4:10 pm', location: 'Gate A', group: 'Ushers', teacherIds: ['4', '5'] },
  { id: 'd-th-2', categoryId: 'dismissal', day: 'Thursday', time: '3:40 pm - 4:10 pm', location: 'Lobby', group: 'Name Takers', teacherIds: ['6', '7'] },
  { id: 'd-th-3', categoryId: 'dismissal', day: 'Thursday', time: '3:40 pm - 4:10 pm', location: 'Level G', group: 'Level G', teacherIds: ['8'] },

  // --- FRIDAY ---
  { id: 'b-f-1', categoryId: 'breakfast', day: 'Friday', time: '9:45 am - 10:15 am', location: 'Café', group: 'Lower Level', teacherIds: ['19', '20'] },
  { id: 'l-f-1', categoryId: 'lunch', day: 'Friday', time: '12:45 pm - 1:30 pm', location: 'Café', group: 'Lower Level', teacherIds: ['8', '9'] },
  { id: 'd-f-1', categoryId: 'dismissal', day: 'Friday', time: '3:40 pm - 4:10 pm', location: 'Gate A', group: 'Ushers', teacherIds: ['13', '14'] },
  { id: 'd-f-2', categoryId: 'dismissal', day: 'Friday', time: '3:40 pm - 4:10 pm', location: 'Lobby', group: 'Name Takers', teacherIds: ['15', '16'] },
];
