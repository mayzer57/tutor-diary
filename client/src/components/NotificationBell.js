import { useEffect, useState } from 'react';
import './NotificationBell.css';

function NotificationBell({ studentId }) {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
  
    useEffect(() => {
      fetch(`/api/notifications?student_id=${studentId}`)
        .then(res => res.json())
        .then((data) => {
          console.log('[🔔 notifications]', data); // 👈 лог для проверки
          setNotifications(data);
        })
        .catch((err) => {
          console.warn('Ошибка загрузки уведомлений:', err);
        });
    }, [studentId]);
    console.log('[🔔 showDropdown]', showDropdown); // 👈 лог
    console.log('[🔔 notifications]', notifications); // 👈 лог  

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
            <ul>
              {notifications.map((n, idx) => (
                <li key={idx}>
                  <span>{n.message}</span>
                  <small>{new Date(n.created_at).toLocaleString()}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
