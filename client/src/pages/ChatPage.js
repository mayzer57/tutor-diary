import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getChatMessages, sendChatMessage } from '../api/api';
import './ChatPage.css';

function ChatPage() {
  const { studentId, tutorId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const loadMessages = async () => {
    try {
      const data = await getChatMessages(studentId, tutorId);
      setMessages(data);
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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() && !file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      const userType = localStorage.getItem('userType');
      const user = JSON.parse(localStorage.getItem('user'));

      formData.append('sender_type', userType);
      formData.append('sender_id', user.id);
      formData.append('receiver_id', userType === 'student' ? tutorId : studentId);
      formData.append('message', text);
      if (file) formData.append('file', file);

      await sendChatMessage(formData);
      setText('');
      setFile(null);
      loadMessages();
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
      <div className="chat-messages" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.sender_type}`}>
            {/* <strong>{msg.sender_type === 'student' ? '👨‍🎓 Ученик' : '👨‍🏫 Репетитор'}</strong> */}
            {msg.message && <p>{msg.message}</p>}
            {msg.file_url && (
              <a href={msg.file_url} target="_blank" rel="noopener noreferrer">📎 Файл</a>
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
          style={{ display: 'none' }}
          onChange={e => setFile(e.target.files[0])}
        />

        <button onClick={handleSend} disabled={loading}>
          {loading ? '⏳' : '📤'}
        </button>
      </div>
    </div>
  );
}

export default ChatPage;
