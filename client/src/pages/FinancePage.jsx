import { useEffect, useState } from 'react';
import { getFinanceStats } from '../api/api';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList
} from 'recharts';

import './FinancePage.css';

function FinancePage() {
  const [period, setPeriod] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);

  const loadFinance = async () => {
    try {
      let query = {};
  
      if (period === 'custom' && customStart && customEnd) {
        query = { start: customStart, end: customEnd };
      } else {
        query = { period }; // 👈 передаём только ключевое слово
      }
  
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
    loadFinance();
  }, [period, customStart, customEnd]);

  return (
    <div className="finance-page">
      <h2>💰 Финансы</h2>

      <div className="filters">
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="week">Последняя неделя</option>
          <option value="month">Месяц</option>
          <option value="year">Год</option>
          <option value="custom">Выбрать период</option>
        </select>

        {period === 'custom' && (
          <>
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
          </>
        )}
      </div>

      {summary && (
        <div className="finance-summary">
          <div>📅 Уроков проведено: <strong>{summary.lessons_count}</strong></div>
          <div>💵 Заработано: <strong>{Number(summary.total_earned).toFixed(2)} ₽</strong></div>
          <div>💸 Средняя цена: <strong>{Number(summary.avg_price).toFixed(2)} ₽</strong></div>
        </div>
      )}

      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 30, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="day_total" stroke="#4caf50" strokeWidth={2} dot={{ r: 3 }} fill="#d1fae5">
              <LabelList dataKey="day_total" position="top" fill="#166534" />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default FinancePage;