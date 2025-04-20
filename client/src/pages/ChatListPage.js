import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChatListForTutor } from '../api/api'; // 💬 Получаем список чатов с unread_count
import './ChatListPage.css';

function ChatListPage() {
  const [chatList, setChatList] = useState([]);
  const navigate = useNavigate();
  const tutor = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    getChatListForTutor()
      .then(setChatList)
      .catch(console.error);
  }, []);

  const handleOpenChat = (studentId) => {
    navigate(`/chat/${studentId}/${tutor.id}`);
  };

  return (
    <div className="chat-list-page">
      <h2>💬 Ваши переписки</h2>
      <ul className="chat-list">
        {chatList.map((s) => (
          <li key={s.student_id} onClick={() => handleOpenChat(s.student_id)}>
            👨‍🎓 {s.name}
            {s.unread_count > 0 && (
              <span className="unread-badge">{s.unread_count}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ChatListPage;
