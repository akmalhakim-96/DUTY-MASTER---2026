
import { Day } from './types';

export const getGoogleCalendarLink = (title: string, day: Day, time: string, location: string) => {
  const dayMap: { [key in Day]: number } = {
    'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5
  };

  // Extract times - rough parsing
  const timeMatch = time.match(/(\d+):(\d+)\s*(am|pm)/gi);
  if (!timeMatch || timeMatch.length < 1) return '#';

  const parseTime = (t: string) => {
    const [hStr, rest] = t.split(':');
    const [mStr, ampm] = rest.split(/\s+/);
    let h = parseInt(hStr);
    const m = parseInt(mStr);
    if (ampm.toLowerCase() === 'pm' && h < 12) h += 12;
    if (ampm.toLowerCase() === 'am' && h === 12) h = 0;
    return { h, m };
  };

  const start = parseTime(timeMatch[0]);
  const end = timeMatch[1] ? parseTime(timeMatch[1]) : { h: start.h + 1, m: start.m };

  // Calculate next occurrence of this day
  const today = new Date();
  const currentDay = today.getDay();
  const targetDay = dayMap[day];
  const diff = (targetDay + 7 - currentDay) % 7;
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + (diff === 0 ? 0 : diff));

  const formatDate = (date: Date, hours: number, mins: number) => {
    const d = new Date(date);
    d.setHours(hours, mins, 0, 0);
    return d.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const startISO = formatDate(targetDate, start.h, start.m);
  const endISO = formatDate(targetDate, end.h, end.m);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `School Duty: ${title}`,
    dates: `${startISO}/${endISO}`,
    details: `Duty location: ${location}`,
    location: location,
  });

  return `https://www.google.com/calendar/render?${params.toString()}`;
};
