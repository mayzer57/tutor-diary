import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudents } from '../api/api';
import './ChatListPage.css';

function ChatListPage() {
  const [students, setStudents] = useState([]);
  const navigate = useNavigate();
  const tutor = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    getStudents().then(setStudents).catch(console.error);
  }, []);

  const handleStartChat = (studentId) => {
    navigate(`/chat/${studentId}/${tutor.id}`);
  };

  return (
    <div className="chat-list-page">
      <h2>💬 Ваши переписки</h2>
      <ul className="chat-list">
  {students.map((s) => (
    <li key={s.id}>
      <span onClick={() => handleStartChat(s.id)}>
        <span className="chat-icon">{s.has_messages ? '📨' : '🆕'}</span>
        👨‍🎓 {s.name}
      </span>
      {!s.has_messages && (
        <button
          className="start-chat-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleStartChat(s.id);
          }}
        >
          ✉️ Написать
        </button>
      )}
    </li>
  ))}
</ul>

    </div>
  );
}

export default ChatListPage;
