// pages/ChatListPage.js
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudents } from '../api/api'; // уже используешь
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
      {students.map(s => (
  <li key={s.id} onClick={() => handleStartChat(s.id)}>
    {s.has_messages ? '📨' : '🆕'} 👨‍🎓 {s.name}
  </li>
))}

      </ul>
    </div>
  );
}

export default ChatListPage;