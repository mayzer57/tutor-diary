import { useEffect, useState, useCallback } from 'react';
import { getTutorGrades, updateLessonGrade, getStudents } from '../api/api';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useLocation } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
  LineChart,
  Line
} from 'recharts';
import './TutorJournal.css';

function TutorJournal() {
  const [filtersVisible, setFiltersVisible] = useState(false);

  const [lessons, setLessons] = useState([]);
  const [dates, setDates] = useState([]);
  const [sortBy, setSortBy] = useState({ field: 'student', asc: true });
  const [editingCell, setEditingCell] = useState(null);
  const [newGrade, setNewGrade] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [chartType, setChartType] = useState('subject-avg');
  const [period, setPeriod] = useState('30');
  const [customStart, setCustomStart] = useState(null);
  const [customEnd, setCustomEnd] = useState(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({ student: '', subject: '' });
  const [loading, setLoading] = useState(false);
  const limit = 50;
  const location = useLocation();
const queryParams = new URLSearchParams(location.search);
const preselectedStudent = queryParams.get('student');

  useEffect(() => {
    getStudents().then(setStudents);
  }, []);

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
  useEffect(() => {
    if (preselectedStudent) {
      setFilters(prev => ({
        ...prev,
        student: preselectedStudent
      }));
    }
  }, [preselectedStudent]);

  const loadMore = useCallback(async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      const data = await getTutorGrades(
        period,
        currentOffset,
        limit,
        filters,
        customStart && customEnd
          ? {
              start: format(customStart, 'yyyy-MM-dd'),
              end: format(customEnd, 'yyyy-MM-dd')
            }
          : null
      );
      const newLessons = reset ? data : [...lessons, ...data];
      setLessons(newLessons);
      updateDates(newLessons);
      setOffset(currentOffset + data.length);
      setHasMore(data.length === limit);
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      setHasMore(false);
    }
  }, [period, offset, filters, lessons, customStart, customEnd]);

  useEffect(() => {
    setLessons([]);
    setOffset(0);
    setHasMore(true);
    loadMore(true);
  }, [period, filters, customStart, customEnd]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 &&
        hasMore &&
        !loading
      ) {
        loadMore();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadMore, loading]);

  const groupedData = {};
  lessons.forEach(lesson => {
    if (!lesson.student || !lesson.subject) return;
    const dateFormatted = format(new Date(lesson.date), 'dd.MM.yyyy');
    const key = `${lesson.student}|||${lesson.subject}`;
    if (!groupedData[key]) {
      groupedData[key] = {
        student: lesson.student,
        subject: lesson.subject,
        grades: {}
      };
    }
    if (!groupedData[key].grades[dateFormatted]) {
      groupedData[key].grades[dateFormatted] = [];
    }
    groupedData[key].grades[dateFormatted].push({ grade: lesson.grade, id: lesson.id });
  });

  const sortedData = Object.values(groupedData).sort((a, b) => {
    const field = sortBy.field;
    const asc = sortBy.asc ? 1 : -1;
    if (!a[field] || !b[field]) return 0;
    return a[field].localeCompare(b[field]) * asc;
  });

  const toggleSort = (field) => {
    setSortBy(prev => ({
      field,
      asc: prev.field === field ? !prev.asc : true
    }));
  };

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

  const saveGrade = async (lessonId) => {
    try {
      await updateLessonGrade(lessonId, parseInt(newGrade, 10));
      setEditingCell(null);
      setNewGrade('');
      await loadMore(true);
    } catch (err) {
      alert('Ошибка при сохранении оценки');
    }
  };

  const exportGradesToExcel = (lessons) => {
    const formatted = lessons.map((l) => ({
      Дата: new Date(l.date).toLocaleDateString(),
      Ученик: l.student,
      Предмет: l.subject,
      Оценка: l.grade
    }));

    const worksheet = XLSX.utils.json_to_sheet(formatted);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Оценки');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    saveAs(blob, 'grades_export.xlsx');
  };

  const subjectMap = {};
  Object.values(groupedData).forEach(row => {
    const grades = Object.values(row.grades)
      .flat()
      .map(g => g.grade)
      .filter(g => typeof g === 'number');
    if (!grades.length) return;
    if (!subjectMap[row.subject]) subjectMap[row.subject] = [];
    subjectMap[row.subject].push(...grades);
  });

  const chartData = Object.entries(subjectMap).map(([subject, grades]) => ({
    subject,
    average: Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 100) / 100
  }));

  return (
    <div className="journal-container">
      <div className="header-row">
        <h2>📘 Электронный журнал</h2>
        <Link to="/dashboard" className="back-button">🏠 На главную</Link>
      </div>
      <button
  className="toggle-filters-btn"
  onClick={() => setFiltersVisible(prev => !prev)}
>
  {filtersVisible ? '🔽 Скрыть фильтры' : '🔍 Показать фильтры'}
</button>

<div className={`filters-row ${filtersVisible ? 'visible' : 'hidden'}`}>

        <select
          value={period}
          onChange={(e) => {
            setPeriod(e.target.value);
            setCustomStart(null);
            setCustomEnd(null);
          }}
        >
          <option value="7">7 дней</option>
          <option value="30">30 дней</option>
          <option value="90">3 месяца</option>
          <option value="365">Год</option>
          <option value="all">Все</option>
        </select>

        <DatePicker selected={customStart} onChange={setCustomStart} placeholderText="С" dateFormat="yyyy-MM-dd" />
        <DatePicker selected={customEnd} onChange={setCustomEnd} placeholderText="По" dateFormat="yyyy-MM-dd" />

        <select
          value={filters.student}
          onChange={(e) => setFilters(f => ({ ...f, student: e.target.value }))}
        >
          <option value="">Все ученики</option>
          {students.map(s => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Фильтр по предмету"
          value={filters.subject}
          onChange={(e) => setFilters(f => ({ ...f, subject: e.target.value }))}
        />

        <button
          onClick={() => exportGradesToExcel(lessons)}
          className="mode-btn"
        >
          ⬇️ Excel
        </button>
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
          Диаграмма
        </button>
      </div>

      {viewMode === 'table' && (
        <div className="table-scroll-wrapper">
          <table className="grade-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('student')}>Ученик ⬍</th>
                <th onClick={() => toggleSort('subject')}>Предмет ⬍</th>
                {dates.map(date => <th key={date}>{date}</th>)}
                <th>Среднее</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((entry, index) => {
                const avg = parseFloat(getAverage(entry.grades));
                return (
                  <tr key={index}>
                    <td>{entry.student}</td>
                    <td>{entry.subject}</td>
                    {dates.map(date => {
                      const cellKey = `${entry.student}-${entry.subject}-${date}`;
                      const grades = entry.grades[date];
                      return (
                        <td key={date}>
                          {editingCell === cellKey ? (
                            <input
                              type="number"
                              value={newGrade}
                              onChange={(e) => setNewGrade(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && grades?.[0]?.id) saveGrade(grades[0].id);
                                if (e.key === 'Escape') {
                                  setEditingCell(null);
                                  setNewGrade('');
                                }
                              }}
                              autoFocus
                              style={{ width: '50px', textAlign: 'center' }}
                            />
                          ) : (
                            <span
                              className="grade-cell"
                              onClick={() => {
                                setEditingCell(cellKey);
                                setNewGrade(grades?.[0]?.grade ?? '');
                              }}
                            >
                              {grades?.length
                                ? grades.map(g => g.grade ?? '—').join(', ')
                                : <span style={{ color: '#aaa' }}>—</span>}
                            </span>
                          )}
                        </td>
                      );
                    })}
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
          <h3 style={{ marginTop: 40 }}>📊 Аналитика</h3>

          <div style={{ marginBottom: 16 }}>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              style={{ padding: '8px 12px', fontSize: 14, borderRadius: 6 }}
            >
              <option value="subject-avg">📘 Средний балл по предметам</option>
              <option value="progress-line">📈 Прогресс учеников</option>
              <option value="activity-bar">👣 Активность учеников</option>
            </select>
          </div>

          {chartType === 'subject-avg' && (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 60, bottom: 20 }}>
                <XAxis type="number" domain={[0, 5]} />
                <YAxis dataKey="subject" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="average" fill="#60a5fa">
                  <LabelList dataKey="average" position="right" fill="#1e3a8a" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {chartType === 'progress-line' && (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart
                data={lessons
                  .filter(l => typeof l.grade === 'number')
                  .map(l => ({
                    date: format(new Date(l.date), 'dd.MM'),
                    student: l.student,
                    grade: l.grade
                  }))
                }
              >
                <XAxis dataKey="date" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Line type="monotone" dataKey="grade" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}

          {chartType === 'activity-bar' && (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={students.map(s => {
                  const count = lessons.filter(l => l.student === s.name).length;
                  return { student: s.name, count };
                })}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
              >
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="student" type="category" width={140} />
                <Tooltip />
                <Bar dataKey="count" fill="#facc15">
                  <LabelList dataKey="count" position="right" fill="#78350f" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </div>
  );
}

export default TutorJournal;