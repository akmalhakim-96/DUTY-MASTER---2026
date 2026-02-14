
import { Day } from './types';

export const getGoogleCalendarLink = (title: string, day: Day, time: string, location: string) => {
  const dayMap: { [key in Day]: number } = {
    'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5
  };

  const dayCodeMap: { [key in Day]: string } = {
    'Monday': 'MO', 'Tuesday': 'TU', 'Wednesday': 'WE', 'Thursday': 'TH', 'Friday': 'FR'
  };

  // Extract times - rough parsing (e.g., "07:30 am - 08:00 am")
  const timeMatch = time.match(/(\d+):(\d+)\s*(am|pm)/gi);
  if (!timeMatch || timeMatch.length < 1) return '#';

  const parseTime = (t: string) => {
    const parts = t.split(':');
    const hStr = parts[0];
    const rest = parts[1];
    const subParts = rest.split(/\s+/);
    const mStr = subParts[0];
    const ampm = subParts[1];
    
    let h = parseInt(hStr);
    const m = parseInt(mStr);
    if (ampm.toLowerCase() === 'pm' && h < 12) h += 12;
    if (ampm.toLowerCase() === 'am' && h === 12) h = 0;
    return { h, m };
  };

  const start = parseTime(timeMatch[0]);
  // Default to 30 mins if end time not found
  const end = timeMatch[1] ? parseTime(timeMatch[1]) : { h: start.h, m: start.m + 30 };

  // Calculate next occurrence of this day
  const today = new Date();
  const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday...
  const targetDay = dayMap[day];
  
  // Calculate days until next target day
  let diff = targetDay - currentDay;
  if (diff < 0) diff += 7;
  
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + diff);

  // Format to YYYYMMDDTHHmmSS (Local time format for Google Calendar URL)
  const formatLocal = (date: Date, hours: number, mins: number) => {
    const d = new Date(date);
    d.setHours(hours, mins, 0, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  };

  const startStr = formatLocal(targetDate, start.h, start.m);
  const endStr = formatLocal(targetDate, end.h, end.m);

  // Recurrence rule: Weekly until end of December 2026
  const recurrence = `RRULE:FREQ=WEEKLY;BYDAY=${dayCodeMap[day]};UNTIL=20261231T235959Z`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `DUTY: ${title} (${location})`,
    dates: `${startStr}/${endStr}`,
    details: `Tugasan Guru: ${title}\nLokasi: ${location}\n\n⚠️ PENTING: Sila tetapkan peringatan (NOTIFICATIONS) secara manual kepada 5 MINIT & 10 MINIT sebelum tugasan bermula.\n\n✅ Pengulangan: Setiap minggu sehingga Disember 2026.`,
    location: location,
    recur: recurrence
  });

  return `https://www.google.com/calendar/render?${params.toString()}`;
};
