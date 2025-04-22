import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import './FinancePage.css';

function FinancePage() {
  const [period, setPeriod] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);

  const loadFinance = async () => {
    let url = `/api/finance/summary?period=${period}`;
    if (period === 'custom' && customStart && customEnd) {
      url = `/api/finance/summary?start=${customStart}&end=${customEnd}`;
    }

    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      setSummary(data.summary);
      setChartData(data.chart);
    } catch (err) {
      console.error('Ошибка загрузки финансов:', err.message);
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
        <div className="chart">
          {chartData.map((d, i) => (
            <div key={i} className="chart-bar">
              <div className="bar" style={{ height: `${d.day_total}px` }} title={`📅 ${d.date}\n💰 ${d.day_total} ₽`} />
              <div className="bar-date">{format(new Date(d.date), 'dd.MM')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FinancePage;