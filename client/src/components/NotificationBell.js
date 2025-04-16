import { useState } from 'react';
import './NotificationBell.css';

function NotificationBell({ notifications = [] }) {
  const [showDropdown, setShowDropdown] = useState(false);

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
