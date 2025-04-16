import { useEffect, useState } from 'react';
import './NotificationBell.css';
import { useNavigate } from 'react-router-dom';
import { API_URL, authHeader } from '../api/api';

function groupByDate(notifications) {
  const groups = {};
  for (const n of notifications) {
    const dateKey = new Date(n.created_at).toLocaleDateString('ru-RU');
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(n);
  }
  return groups;
}

function formatMessage(msg) {
  if (msg.includes('домашнее')) return '📚 Назначено домашнее задание — проверьте дневник.';
  if (msg.includes('оценка')) return '✅ Получена новая оценка — посмотрите в дневнике.';
  if (msg.includes('напоминание') || msg.includes('урок')) return '⏰ У вас скоро урок — проверьте расписание.';
  return msg;
}

function NotificationBell({ studentId }) {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!studentId) {
      console.warn('[🔔] studentId отсутствует');
      return;
    }

    if (!API_URL) {
      console.error('[🔔] API_URL не задан');
      return;
    }

    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/notifications?student_id=${studentId}`, {
          headers: authHeader(),
        });

        const data = await res.json();
        console.log('[🔔] Уведомления загружены:', data);
        setNotifications([...data].reverse());
      } catch (err) {
        console.error('❌ Ошибка загрузки уведомлений:', err.message);
      }
    };

    load();
  }, [studentId]);

  const handleClearAll = async () => {
    try {
      await fetch(`${API_URL}/notifications/clear?student_id=${studentId}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      setNotifications([]);
    } catch (err) {
      console.error('Ошибка очистки уведомлений:', err.message);
    }
  };

  const handleNotificationClick = (notif) => {
    const text = notif.message.toLowerCase();
    if (text.includes('расписание') || text.includes('урок')) {
      navigate('/student-schedule');
    } else if (text.includes('оценка') || text.includes('домашнее')) {
      navigate('/student-journal');
    }
    setShowDropdown(false);
  };

  const grouped = groupByDate(notifications);

  return (
    <div className="notification-bell">
      <button className="notif-btn" onClick={() => setShowDropdown(!showDropdown)}>
        🔔 Уведомления ({notifications.length})
      </button>

      {showDropdown && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span>Уведомления</span>
            <button className="clear-btn" onClick={handleClearAll}>🗑</button>
          </div>

          {notifications.length === 0 ? (
            <p>Нет уведомлений</p>
          ) : (
            Object.entries(grouped).map(([date, list]) => (
              <div key={date}>
                <p>{date === new Date().toLocaleDateString('ru-RU') ? 'Сегодня' : date}</p>
                <ul>
                  {list.map((n, idx) => (
                    <li
                      key={idx}
                      onClick={() => handleNotificationClick(n)}
                      className="unread"
                    >
                      <span>{formatMessage(n.message)}</span>
                      <small>{new Date(n.created_at).toLocaleTimeString('ru-RU')}</small>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
