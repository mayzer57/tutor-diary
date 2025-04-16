import { useEffect, useState } from 'react';
import './NotificationBell.css';
import { useNavigate } from 'react-router-dom';

function groupByDate(notifications) {
  const groups = {};
  for (const n of notifications) {
    const dateKey = new Date(n.created_at).toLocaleDateString('ru-RU');
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(n);
  }
  return groups;
}

function NotificationBell({ studentId }) {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!studentId) return;
    fetch(`/api/notifications?student_id=${studentId}`)
      .then(res => res.json())
      .then(data => {
        // Пока все как непрочитанные (можно потом добавить статус read)
        const sorted = [...data].reverse(); // новые сверху
        setNotifications(sorted);
      })
      .catch((err) => {
        console.warn('Ошибка загрузки уведомлений:', err.message);
      });
  }, [studentId]);

  const handleClearAll = async () => {
    if (!studentId) return;
    try {
      await fetch(`/api/notifications/clear?student_id=${studentId}`, { method: 'DELETE' });
      setNotifications([]);
    } catch (err) {
      console.error('Ошибка очистки уведомлений:', err.message);
    }
  };

  const handleNotificationClick = (notif) => {
    if (notif.message.includes('расписании')) {
      navigate('/student-schedule');
      setShowDropdown(false);
    }
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
                      className={`unread`}
                    >
                      <span>{n.message}</span>
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
