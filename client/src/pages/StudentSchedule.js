import { useEffect, useState } from 'react';
import { getStudentLessons } from '../api/api';
import './Schedule.css';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

function StudentSchedule() {
  const [lessons, setLessons] = useState([]);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getStudentLessons();
        setLessons(data);
      } catch (err) {
        console.error('Ошибка при загрузке расписания ученика:', err.message);
      }
    };
    load();
  }, []);

  const renderDay = (date) => {
    const dayLessons = lessons.filter((l) => isSameDay(new Date(l.date), date));
    return (
      <div key={date} className="day-box">
        <h3>{format(date, 'EEEE dd.MM')}</h3>
        {dayLessons.length === 0 && <p>Нет уроков</p>}
        {dayLessons.map((lesson) => (
          <div key={lesson.id} className="lesson-entry">
            ⏰ {lesson.time?.slice(0, 5)} — 📘 {lesson.subject}
            {lesson.homework && <div className="hw">📝 {lesson.homework}</div>}
            {lesson.grade !== null && <div className="grade">🎯 Оценка: {lesson.grade}</div>}
            {lesson.homework_file && (
  <a href={`http://localhost:3001/uploads/${lesson.homework_file}`} target="_blank" rel="noreferrer">
    📎 Прикреплённый файл
  </a>
)}


          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="schedule-container">
      <div className="header-row">
        <h2>📘 Ваше расписание</h2>
        <a href="/student-dashboard" className="back-button">🏠 На главную</a>
      </div>

      <div className="week-header">
        <button onClick={() => setWeekStart(addDays(weekStart, -7))}>← Пред. неделя</button>
        <span>{format(weekDates[0], 'dd.MM')} - {format(weekDates[6], 'dd.MM')}</span>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))}>След. неделя →</button>
      </div>

      <div className="week-grid">
        {weekDates.map(renderDay)}
      </div>
    </div>
  );
}

export default StudentSchedule;
