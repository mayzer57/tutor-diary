import { useEffect, useState } from 'react';
import { getUnreadCount } from '../api/api';

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const count = await getUnreadCount();
        setUnreadCount(count);
      } catch (e) {
        console.error('Ошибка загрузки непрочитанных сообщений', e);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 10000);
    return () => clearInterval(interval);
  }, []);

  return unreadCount;
}
