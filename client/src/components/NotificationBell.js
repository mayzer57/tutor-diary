import { useState } from 'react';
import './NotificationBell.css';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

function NotificationBell({ notifications = [] }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  // 🧠 группировка по дате
  const grouped = notifications.reduce((acc, n) => {
    const date = parseISO(n.created_at);
    let label = format(date, 'dd.MM.yyyy');

    if (isToday(date)) label = 'Сегодня';
    else if (isYesterday(date)) label = 'Вчера';

    if (!acc[label]) acc[label] = [];
    acc[label].push(n);
    return acc;
  }, {});

  // 📌 формат сообщения
  const formatMessage = (msg = '') => {
    if (msg.includes('домашнее задание')) return '📚 Вам назначено домашнее задание. Проверьте дневник.';
    if (msg.includes('оценка')) return '✅ Получена новая оценка. Откройте дневник.';
    if (msg.includes('Назначен новый урок')) return '📅 Скоро урок! Посмотрите в расписании.';
    return msg;
  };

  return (
    <div className="notification-bell">
      <button className="notif-btn" onClick={() => setShowDropdown(!showDropdown)}>
        🔔 Уведомления ({notifications.length})
      </button>

      {showDropdown && (
        <div className="notif-dropdown">
          {notifications.length === 0 ? (
            <p>Нет уведомлений</p>
          ) : (
            Object.entries(grouped).map(([date, items], idx) => (
              <div key={idx}>
                <p style={{ fontWeight: 'bold', marginBottom: 8 }}>{date}</p>
                <ul>
                  {items.map((n, i) => (
                    <li
                      key={i}
                      onClick={() => {
                        if (n.message.includes('урок')) navigate('/student-schedule');
                        if (n.message.includes('оценка') || n.message.includes('домашнее')) navigate('/student-journal');
                      }}
                      style={{ cursor: 'pointer' }}
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
