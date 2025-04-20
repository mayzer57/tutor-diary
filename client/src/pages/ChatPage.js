import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getChatMessages, sendChatMessage } from '../api/api';
import './ChatPage.css';

function ChatPage() {
  const { studentId, tutorId } = useParams(); // получаем из URL
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const scrollRef = useRef();

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
    const intv = setInterval(loadMessages, 5000); // автообновление
    return () => clearInterval(intv);
  }, []);

  const handleSend = async () => {
    const formData = new FormData();
    formData.append('sender_type', localStorage.getItem('userType'));
    formData.append('sender_id', JSON.parse(localStorage.getItem('user')).id);
    formData.append('receiver_id', localStorage.getItem('userType') === 'student' ? tutorId : studentId);
    formData.append('message', text);
    if (file) formData.append('file', file);

    await sendChatMessage(formData);
    setText('');
    setFile(null);
    loadMessages();
  };

  return (
    <div className="chat-container">
      <div className="chat-messages" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.sender_type}`}>
            {msg.message && <p>{msg.message}</p>}
            {msg.file_url && (
              <a href={msg.file_url} target="_blank" rel="noopener noreferrer">📎 Файл</a>
            )}
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Введите сообщение..." />
        <input type="file" onChange={e => setFile(e.target.files[0])} />
        <button onClick={handleSend}>📤</button>
      </div>
    </div>
  );
}

export default ChatPage;