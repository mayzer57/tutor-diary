import { useEffect, useState } from 'react';
import { getFinanceStats, getStudents } from '../api/api';
import { format } from 'date-fns';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LabelList
} from 'recharts';
import './FinancePage.css';

function FinancePage() {
  const [period, setPeriod] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentFilter, setStudentFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [chartType, setChartType] = useState('line');

  const loadStudents = async () => {
    try {
      const data = await getStudents();
      setStudents(data);
    } catch (err) {
      console.error('Ошибка загрузки учеников:', err.message);
    }
  };

  const loadFinance = async () => {
    try {
      const query = { period };
      if (period === 'custom' && customStart && customEnd) {
        query.start = customStart;
        query.end = customEnd;
      }
      if (studentFilter) query.student = studentFilter;
      if (subjectFilter) query.subject = subjectFilter;

      const data = await getFinanceStats(query);
      setSummary(data.summary || null);
      setChartData(
        (data.chart || []).map(d => ({
          ...d,
          date: format(new Date(d.date), 'dd.MM'),
          day_total: Number(d.day_total)
        }))
      );
    } catch (err) {
      console.error('❌ Ошибка загрузки финансов:', err.message);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    loadFinance();
  }, [period, customStart, customEnd, studentFilter, subjectFilter, chartType]);

  const allSubjects = [...new Set(
    students.flatMap(s => s.subjects?.map(sub => typeof sub === 'string' ? sub : sub.name) || [])
  )];

  return (
    <div className="finance-page">
      <h2>💰 Финансы</h2>

      <div className="filters">
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="week">Текущая неделя</option>
          <option value="month">Текущий месяц</option>
          <option value="year">Текущий год</option>
          <option value="custom">Свой период</option>
        </select>

        {period === 'custom' && (
          <>
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
          </>
        )}

        <select value={studentFilter} onChange={(e) => setStudentFilter(e.target.value)}>
          <option value="">Все ученики</option>
          {students.map((s) => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>

        <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
          <option value="">Все предметы</option>
          {allSubjects.map((sub, i) => (
            <option key={i} value={sub}>{sub}</option>
          ))}
        </select>

        <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
          <option value="line">📈 Линия</option>
          <option value="bar">📊 Бары</option>
        </select>
      </div>

      {summary && (
        <div className="finance-summary">
          <div>📅 Проведено: <strong>{summary.lessons_count}</strong></div>
          <div>💵 Заработано: <strong>{Number(summary.total_earned).toFixed(2)} ₽</strong></div>
          <div>💸 Средняя цена: <strong>{Number(summary.avg_price).toFixed(2)} ₽</strong></div>
        </div>
      )}

      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="day_total" stroke="#4caf50" strokeWidth={2} dot={{ r: 3 }} />
              <LabelList dataKey="day_total" position="top" fill="#166534" />
            </LineChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="day_total" fill="#4caf50" />
              <LabelList dataKey="day_total" position="top" fill="#166534" />
            </BarChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default FinancePage;