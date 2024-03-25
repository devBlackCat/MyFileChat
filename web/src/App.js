import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios'; 
import './App.css';



const App = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showOlderMessagesButton, setShowOlderMessagesButton] = useState(false);
  const scrollViewRef = useRef();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get('localhost/chat/list.php');
        const sortedMessages = response.data.messages.sort((a, b) => new Date(a.date) - new Date(b.date));
        setMessages(sortedMessages);
        setShowOlderMessagesButton(response.data.hasOlderMessages);
      } catch (error) {
        console.error('Fetch Messages Error:', error);
      }
    };
    fetchMessages();
  }, []);

  useEffect(() => {
    scrollViewRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const fetchOlderMessages = async () => {
    if (messages.length === 0) {
        setShowOlderMessagesButton(false);
        return;
    }

    try {
        // 가장 오래된 메시지의 날짜를 사용하여 이전 메시지들을 요청합니다.
        const oldestMessageDate = messages[0].date;

        const response = await axios.post(
            'localhost/chat/history.php',
            JSON.stringify({ date: oldestMessageDate }),
            { headers: { 'Content-Type': 'application/json' } }
        );

        // 응답으로 받은 메시지들을 기존 메시지 목록에 추가합니다.
        if (response.data.messages.length > 0) {
            // 새로운 메시지 배열을 생성합니다. 기존 메시지들 + 새로 받은 메시지들
            const newMessages = [...messages, ...response.data.messages];
            // 메시지 배열을 날짜에 따라 정렬합니다.
            newMessages.sort((a, b) => new Date(a.date) - new Date(b.date));
            setMessages(newMessages);
        }

        // 더 이상 이전 메시지가 없다면 버튼을 비활성화합니다.
        setShowOlderMessagesButton(response.data.hasOlderMessages);
    } catch (error) {
        console.error('Fetch Older Messages Error:', error);
        setShowOlderMessagesButton(false);
    }
};

  

const sendMessage = async () => {
    if (message.trim()) {
        try {
            // 현재 시간을 ISO 형식으로 생성합니다.
            const now = new Date().toISOString();
            // 메시지 객체를 생성하고, 날짜 정보를 추가합니다.
            const messageData = { text: message, date: now };

            // 메시지 객체를 서버로 전송합니다.
            const response = await axios.post('localhost/chat/message.php', JSON.stringify(messageData), {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            // 서버에서 응답받은 새 메시지를 현재 메시지 목록에 추가합니다.
            if (response.data && response.data.newMessage) {
                setMessages(messages => [...messages, response.data.newMessage]);
            }

            // 입력 필드를 초기화합니다.
            setMessage('');
        } catch (error) {
            console.error('Send Message Error:', error);
        }
    }
};


const pickImage = async (event) => {
  const file = event.target.files[0];
  if (file) {
    const formData = new FormData();
    formData.append('file', file);
    uploadImage(formData); // 변경된 uploadImage 함수를 호출
  }
};

const uploadImage = async (formData) => {
  try {
    const response = await axios.post('localhost/chat/image.php', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (response.data.newMessage) {
      const newImageMessage = {
          ...response.data.newMessage,
          isImage: true, // 이 부분은 이미지 메시지임을 나타냅니다.
      };
      setMessages(messages => [...messages, newImageMessage]);
    }
  } catch (error) {
    console.error('Upload error:', error);
  }
};

const pickFile = async (event) => {
  const file = event.target.files[0];
  if (file) {
    const formData = new FormData();
    formData.append('file', file);
    uploadFile(formData); // 여기에서는 formData를 넘깁니다.
  }
};

const uploadFile = async (formData) => {
  try {
    const response = await axios.post('localhost/chat/file.php', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (response.data.newMessage) {
      const updatedMessage = {
        ...response.data.newMessage,
        isFile: true,
        fileText: response.data.newMessage.text,
        text: `File: ${response.data.newMessage.file}`,
      };
      setMessages(messages => [...messages, updatedMessage]);
      console.log('File uploaded:', updatedMessage);
    } else if (response.data.error) {
      console.error('Server error:', response.data.error);
    }
  } catch (error) {
    console.error('Upload error:', error);
  }
};




return (
  <div className="container">
    {showOlderMessagesButton && (
      <div className="olderMessagesButtonContainer">
        <button onClick={fetchOlderMessages}>이전 메시지 보기</button>
      </div>
    )}

    <div className="messagesContainer">
      {messages.map((msg, index) => (
        <div key={index} className={`messageOuterContainer ${msg.isFile ? 'fileMessage' : ''} ${msg.isImage ? 'imageMessage' : ''}`}>
          {msg.isFile ? (
            <a href={msg.file} target="_blank" rel="noopener noreferrer">
              <div className="messageContainer">
                <span className="message">{msg.fileText}</span>
              </div>
            </a>
          ) : msg.isImage ? (
            <div className="imageContainer">
              <img src={msg.img} alt="Message attachment" className="image" />
            </div>
          ) : (
            <div className="messageContainer">
              <span className="message">{msg.text}</span>
            </div>
          )}
          <span className="date">{new Date(msg.date).toLocaleString()}</span>
        </div>
      ))}
      <div ref={scrollViewRef} /> {/* 스크롤 이동을 위한 빈 div */}
    </div>

    {showAttachments && (
      <div className="attachmentsContainer">
        <input type="file" accept="*/*" onChange={pickFile} className="fileInput" />
        <input type="file" accept="image/*" onChange={pickImage} className="fileInput" />
      </div>
    )}
    <div className="inputContainer">
      <button onClick={() => setShowAttachments(!showAttachments)} className="toggleAttachmentButton">
        {showAttachments ? 'X' : '+'}
      </button>
      <input
        className="input"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="메시지 입력"
      />
      <button onClick={sendMessage} className="sendButton">보내기</button>
    </div>
  </div>
);

};


export default App;

