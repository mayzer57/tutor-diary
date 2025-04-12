import { useState, useEffect, useCallback } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { getLessonsByWeek, applyTemplateToWeek } from '../api/api';
import LessonFormModal from '../components/LessonFormModal';
import './Schedule.css';
import { Link } from 'react-router-dom';
function TutorSchedule() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [lessons, setLessons] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const loadLessons = useCallback(async () => {
    const start = format(weekDates[0], 'yyyy-MM-dd');
    const end = format(weekDates[6], 'yyyy-MM-dd');
    const data = await getLessonsByWeek(start, end);
    setLessons(data);
  }, [weekDates]);

  const handleApplyTemplate = async () => {
    const weekStartStr = format(weekDates[0], 'yyyy-MM-dd');
    try {
      const result = await applyTemplateToWeek(weekStartStr);
      alert(`✅ Добавлено ${result.inserted} уроков по шаблону`);
      await loadLessons();
    } catch (err) {
      console.error('❌ Ошибка шаблона:', err.message);
      alert('Ошибка применения шаблона');
    }
  };

  useEffect(() => {
    loadLessons();
  }, [weekDates, loadLessons]);

  const openModal = (date, lesson = null) => {
    setSelectedDate(date);
    setEditingLesson(lesson);
    setModalOpen(true);
  };

  const closeModal = (shouldReload = false) => {
    setModalOpen(false);
    setEditingLesson(null);
    if (shouldReload) loadLessons();
  };

  const renderDay = (date) => {
    const dayLessons = lessons.filter((l) => isSameDay(new Date(l.date), date));
    return (
      <div key={date} className="day-box" onClick={() => openModal(date)}>
        <h3>{format(date, 'EEEE dd.MM')}</h3>
        {dayLessons.length === 0 && <p>Нет уроков</p>}
        {dayLessons.map((lesson) => (
  <div
    key={lesson.id}
    className="lesson-entry"
    onClick={(e) => {
      e.stopPropagation();
      openModal(date, lesson);
    }}
  >
    ⏰ {lesson.time?.slice(0, 5)} – 👤 {lesson.student_name}  
      📘 {lesson.subject_name || 'Предмет'}
    {lesson.homework && <div className="hw">📝 {lesson.homework}</div>}
    {lesson.grade !== null && <div className="grade">🎯 Оценка: {lesson.grade}</div>}

    {/* 🔻 Вот сюда вставляем ссылку */}
    {lesson.homework_file && (
      <div className="file">
        <a
          href={lesson.homework_file.startsWith('http')
            ? lesson.homework_file
            : `http://localhost:5001/uploads/${lesson.homework_file}`}
          target="_blank"
          rel="noreferrer"
        >
          📎 Открыть файл
        </a>
      </div>
    )}
  </div>
))}
      </div>
    );
  };

  return (
    <div className="schedule-container">
      <div className="header-row">
        <h2>📅 Расписание уроков</h2>
        <a href="/dashboard" className="back-button">🏠 На главную</a>
      </div>

      <div className="week-header">
        <button onClick={() => setWeekStart(addDays(weekStart, -7))}>← Пред. неделя</button>
        <span>{format(weekDates[0], 'dd.MM')} - {format(weekDates[6], 'dd.MM')}</span>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))}>След. неделя →</button>
      </div>

      <div className="template-actions">
  <button className="apply-template-btn" onClick={handleApplyTemplate}>
    📋 Применить шаблон
  </button>
  <Link to="/schedule-template" className="edit-template-link">
    ⚙️ Редактировать шаблон
  </Link>
</div>

      <div className="week-grid">
        {weekDates.map(renderDay)}
      </div>

      <LessonFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        selectedDate={selectedDate}
        initialData={editingLesson}
      />
    </div>
  );
}

export default TutorSchedule;
