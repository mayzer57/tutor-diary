import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';
import { format } from 'date-fns';
import './FinancePage.css';
import { getFinanceStats } from '../api/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

function FinancePage() {
  const [period, setPeriod] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);

  const loadFinance = async () => {
    let start = '', end = '';

    if (period === 'custom' && customStart && customEnd) {
      start = customStart;
      end = customEnd;
    } else {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      let from = new Date();
      if (period === 'week') from.setDate(now.getDate() - 7);
      else if (period === 'month') from.setMonth(now.getMonth() - 1);
      else if (period === 'year') from.setFullYear(now.getFullYear() - 1);

      start = from.toISOString().split('T')[0];
      end = today;
    }

    try {
      const data = await getFinanceStats({ start, end });
      setSummary(data.summary || null);
      setChartData(data.chart || []);
    } catch (err) {
      console.error('❌ Ошибка загрузки финансов:', err.message);
    }
  };

  useEffect(() => {
    loadFinance();
  }, [period, customStart, customEnd]);

  const lineChartData = {
    labels: chartData.map(d => format(new Date(d.date), 'dd.MM')),
    datasets: [
      {
        label: 'Заработано ₽',
        data: chartData.map(d => d.day_total),
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

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
        <div className="chart-container">
          <Line data={lineChartData} />
        </div>
      )}
    </div>
  );
}

export default FinancePage;