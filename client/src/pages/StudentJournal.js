import { useEffect, useState, useCallback } from 'react';
import { fetchStudentGrades, getStudentRanking } from '../api/api';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import './TutorJournal.css';

function StudentJournal() {
  const [lessons, setLessons] = useState([]);
  const [dates, setDates] = useState([]);
  const [viewMode, setViewMode] = useState('table');
  const [customStart, setCustomStart] = useState(null);
  const [customEnd, setCustomEnd] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(0);

  const updateDates = (lessonsList) => {
    const uniqueDates = Array.from(
      new Set(lessonsList.map(l => format(new Date(l.date), 'dd.MM.yyyy')))
    ).sort((a, b) => {
      const [d1, m1, y1] = a.split('.').map(Number);
      const [d2, m2, y2] = b.split('.').map(Number);
      return new Date(y1, m1 - 1, d1) - new Date(y2, m2 - 1, d2);
    });
    setDates(uniqueDates);
  };

  const loadLessons = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchStudentGrades();
      let filtered = data;

      if (customStart && customEnd) {
        filtered = filtered.filter(l => {
          const d = new Date(l.date);
          return d >= customStart && d <= customEnd;
        });
      }

      if (subjectFilter) {
        filtered = filtered.filter(l =>
          l.subject?.toLowerCase().includes(subjectFilter.toLowerCase())
        );
      }

      setLessons(filtered);
      updateDates(filtered);

      const totalXP = filtered.reduce((acc, l) => {
        if (l.grade === 5) return acc + 10;
        if (l.grade === 4) return acc + 7;
        if (l.grade === 3) return acc + 4;
        return acc;
      }, 0);
      setXp(totalXP);
      setLevel(Math.floor(totalXP / 50));
    } catch (err) {
      console.error('Ошибка загрузки оценок:', err);
    } finally {
      setLoading(false);
    }
  }, [customStart, customEnd, subjectFilter]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  useEffect(() => {
    getStudentRanking().then(res => {
      if (Array.isArray(res)) setRanking(res);
    });
  }, []);

  const groupedData = {};
  lessons.forEach(lesson => {
    const dateFormatted = format(new Date(lesson.date), 'dd.MM.yyyy');
    const key = lesson.subject;
    if (!groupedData[key]) {
      groupedData[key] = { subject: lesson.subject, grades: {} };
    }
    if (!groupedData[key].grades[dateFormatted]) {
      groupedData[key].grades[dateFormatted] = [];
    }
    groupedData[key].grades[dateFormatted].push({ grade: lesson.grade });
  });

  const getAverage = (gradesObj) => {
    const allGrades = Object.values(gradesObj)
      .flat()
      .map(entry => entry.grade)
      .filter(g => typeof g === 'number');
    if (!allGrades.length) return '—';
    return (allGrades.reduce((a, b) => a + b, 0) / allGrades.length).toFixed(2);
  };

  const getAverageColor = (avg) => {
    if (avg < 2.5) return '#fca5a5';
    if (avg < 3.5) return '#fde68a';
    return '#bbf7d0';
  };

  const getMotivation = () => {
    if (level === 0) return 'Начни путь героя! 💡';
    if (level < 3) return 'Ты уже на правильном пути!';
    if (level < 5) return 'Вперед к топу!';
    return 'Ты машина знаний 💥';
  };

  return (
    <div className="journal-container">
      <div className="header-row">
        <h2>📗 Мой дневник</h2>
        <Link to="/student-dashboard" className="back-button">🏠 На главную</Link>
      </div>

      <div className="filters-row">
        <DatePicker selected={customStart} onChange={setCustomStart} placeholderText="С" dateFormat="yyyy-MM-dd" />
        <DatePicker selected={customEnd} onChange={setCustomEnd} placeholderText="По" dateFormat="yyyy-MM-dd" />
        <input
          type="text"
          placeholder="Фильтр по предмету"
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <button
          onClick={() => setViewMode('table')}
          className={viewMode === 'table' ? 'active-mode-btn' : 'mode-btn'}
        >
          Таблица
        </button>
        <button
          onClick={() => setViewMode('chart')}
          className={viewMode === 'chart' ? 'active-mode-btn' : 'mode-btn'}
        >
          Прогресс
        </button>
        <button
          onClick={() => setViewMode('ranking')}
          className={viewMode === 'ranking' ? 'active-mode-btn' : 'mode-btn'}
        >
          🏆 Рейтинг
        </button>
      </div>

      {viewMode === 'table' && (
        <div className="table-scroll-wrapper">
          <table className="grade-table">
            <thead>
              <tr>
                <th>Предмет</th>
                {dates.map(date => <th key={date}>{date}</th>)}
                <th>Среднее</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(groupedData).map((entry, index) => {
                const avg = parseFloat(getAverage(entry.grades));
                return (
                  <tr key={index}>
                    <td>{entry.subject}</td>
                    {dates.map(date => (
                      <td key={date}>
                        {entry.grades[date]?.map(g => g.grade ?? '—').join(', ') || <span style={{ color: '#aaa' }}>—</span>}
                      </td>
                    ))}
                    <td className="average-cell" style={{ backgroundColor: getAverageColor(avg) }}>
                      {avg.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'chart' && (
        <>
          <h3 style={{ marginTop: 40 }}>📈 Прогресс по датам</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart
              data={lessons
                .filter(l => typeof l.grade === 'number')
                .map(l => ({
                  date: format(new Date(l.date), 'dd.MM'),
                  grade: l.grade
                }))
              }
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <XAxis dataKey="date" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Line type="monotone" dataKey="grade" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 40 }}>
  <h4>📆 Прогресс по неделям</h4>
  <ResponsiveContainer width="100%" height={220}>
    <LineChart
      data={(() => {
        const grouped = {};
        lessons.forEach(l => {
          if (typeof l.grade !== 'number') return;
          const date = new Date(l.date);
          const week = `${date.getFullYear()}-W${Math.floor((date.getDate() - 1) / 7) + 1}`;
          if (!grouped[week]) grouped[week] = 0;
          grouped[week] +=
            l.grade === 5 ? 10 : l.grade === 4 ? 7 : l.grade === 3 ? 4 : 0;
        });

        return Object.entries(grouped).map(([week, xp]) => ({ week, xp }));
      })()}
      margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
    >
      <XAxis
        dataKey="week"
        tick={{ fontSize: 10 }}
        angle={-25}
        textAnchor="end"
        height={40}
      />
      <YAxis tick={{ fontSize: 10 }} width={30} />
      <Tooltip />
      <Line
        type="natural"
        dataKey="xp"
        stroke="#10b981"
        strokeWidth={3}
        dot={{ r: 4 }}
        activeDot={{ r: 6 }}
      />
    </LineChart>
  </ResponsiveContainer>
  <p style={{ fontSize: 13, marginTop: 6, color: '#4b5563' }}>
    📈 Каждая точка — XP за неделю. Тренируйся стабильно!
  </p>
</div>
          <div style={{ marginTop: 30 }}>
            <h4>🌱 Прокачка</h4>
            <p><strong>Уровень:</strong> {level}</p>
            <div style={{ background: '#e5e7eb', borderRadius: 10, height: 20, width: '100%', maxWidth: 400 }}>
              <div
                style={{
                  background: '#4ade80',
                  height: '100%',
                  borderRadius: 10,
                  width: `${(xp % 50) * 2}%`,
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            <p style={{ fontSize: 14, marginTop: 5 }}>{xp % 50}/50 до следующего уровня</p>
            <p style={{ fontStyle: 'italic', color: '#6b7280', marginTop: 8 }}>
              💡 {getMotivation()}
            </p>
          </div>
        </>
      )}

{viewMode === 'ranking' && (
  <>
    <h3 style={{ marginTop: 40 }}>🏅 Рейтинг учеников</h3>

    <table className="grade-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Имя</th>
          <th>Очки</th>
        </tr>
      </thead>
      <tbody>
        {ranking.map((s, idx) => {
          const isMe = s.name === JSON.parse(localStorage.getItem('user'))?.name;
          return (
            <tr key={s.name} style={{ background: isMe ? '#fef9c3' : undefined }}>
              <td>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}</td>
              <td><strong>{s.name}</strong></td>
              <td>{s.points}</td>
            </tr>
          );
        })}
      </tbody>
    </table>

    <div style={{ marginTop: 40, overflowX: 'auto' }}>
  <h4 style={{ marginBottom: 10 }}>📊 Твой путь к вершине</h4>
  <div style={{ width: Math.max(ranking.length * 140, 400), minWidth: '100%' }}>
    <ResponsiveContainer width="100%" height={260}>
      <LineChart
        data={ranking.map((s, idx) => ({
          name: `${idx + 1}. ${s.name}`,
          points: s.points
        }))}
        margin={{ top: 10, right: 40, left: 20, bottom: 10 }}
      >
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
        <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-20} textAnchor="end" height={50} />
        <YAxis domain={[0, 'dataMax + 10']} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="points"
          stroke="url(#gradient)"
          strokeWidth={3}
          dot={{ r: 5 }}
          activeDot={{ r: 8 }}
          animationDuration={800}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
</div>

    <div style={{ marginTop: 30 }}>
      <h4>📈 Личная статистика</h4>
      {(() => {
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const me = ranking.find((s) => s.name === currentUser?.name);
        const myIndex = ranking.findIndex((s) => s.name === currentUser?.name);
        const nextAbove = ranking[myIndex - 1];

        return me ? (
          <ul style={{ fontSize: 15, lineHeight: '1.6' }}>
            <li>🔹 Позиция: <strong>{myIndex + 1}</strong></li>
            <li>📌 Очки: <strong>{me.points}</strong></li>
            {nextAbove && (
              <li>
                🚀 До следующей позиции (<strong>{nextAbove.name}</strong>):{' '}
                <strong>{nextAbove.points - me.points}</strong> очков
              </li>
            )}
            {!nextAbove && <li>👑 Ты на первом месте!</li>}
          </ul>
        ) : (
          <p>⚠️ Вы не в рейтинге. Начни набирать оценки!</p>
        );
      })()}
    </div>
  </>
)}
    </div>
  );
}

export default StudentJournal;