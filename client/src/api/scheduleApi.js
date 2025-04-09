import { authHeader } from './api';

const API_URL = 'http://localhost:5001/api/schedule';

export const fetchWeekSchedule = async (tutorId, startDate, endDate) => {
  const res = await fetch(`${API_URL}/week/${tutorId}/${startDate}/${endDate}`, {
    headers: authHeader()
  });
  if (!res.ok) throw new Error('Ошибка загрузки расписания');
  return await res.json();
};

export const saveLesson = async (lesson) => {
  const res = await fetch(`${API_URL}/save`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(lesson)
  });
  if (!res.ok) throw new Error('Ошибка сохранения урока');
  return await res.json();
};
