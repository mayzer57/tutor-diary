import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChatMessages, sendChatMessage, authHeader, API_URL } from '../api/api';
import './ChatPage.css';
import { useUnreadMessages } from '../hooks/useUnreadMessages';

function ChatPage() {
  const { studentId, tutorId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const [unread, refetchUnread] = useUnreadMessages();

  const userType = localStorage.getItem('userType');
  const user = JSON.parse(localStorage.getItem('user'));
  const receiverId = userType === 'student' ? tutorId : studentId;

  const loadMessages = async () => {
    try {
      const data = await getChatMessages(studentId, tutorId);
      setMessages(data);

      // 🟢 Авто-пометка как прочитано
      await fetch(`${API_URL}/chat/mark-as-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify({ student_id: studentId, tutor_id: tutorId }),
      });
      refetchUnread(); // <--- 🎯 добавь это после mark-as-read
      
    } catch (err) {
      console.error('Ошибка загрузки чата', err);
    }
  };

  useEffect(() => {
    loadMessages();
    const intv = setInterval(loadMessages, 5000);
    return () => clearInterval(intv);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() && !file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('sender_type', userType);
      formData.append('sender_id', user.id);
      formData.append('receiver_id', receiverId);
      formData.append('message', text);
      if (file) formData.append('file', file);

      await sendChatMessage(formData);
      setText('');
      setFile(null);
      document.getElementById('file-upload').value = null;

      await loadMessages();
    } catch (err) {
      alert('Ошибка отправки сообщения');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-container">
      {userType === 'tutor' && (
        <div style={{ padding: '12px 20px' }}>
          <button className="back-btn" onClick={() => navigate('/chat')}>
            ← Назад к списку чатов
          </button>
        </div>
      )}

      <div className="chat-messages" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.sender_type}`}>
            <div className="chat-meta">
              <span className="chat-avatar">
                {msg.sender_type === 'student' ? '🎓' : '🧑‍🏫'}
              </span>
              <span className="chat-status online" title="Онлайн"></span>
            </div>

            {msg.message && <p>{msg.message}</p>}

            {msg.file_url && (
              <a
                href={`${API_URL}${msg.file_url}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                📎 Файл
              </a>
            )}

            {msg.read && msg.sender_type === userType && (
              <span className="chat-read-status">✅</span>
            )}
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Введите сообщение..."
        />

        <label htmlFor="file-upload" title="Прикрепить файл">📎</label>
        <input
          id="file-upload"
          type="file"
          onChange={e => setFile(e.target.files[0])}
        />

        <button onClick={handleSend} disabled={loading}>
          {loading ? '⏳' : '📤'}
        </button>
      </div>

      {file && (
        <div className="chat-file-preview">
          <span>📁 {file.name}</span>
          <button onClick={() => setFile(null)}>✖️</button>
        </div>
      )}
    </div>
  );
}

export default ChatPage;
