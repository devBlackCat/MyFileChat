import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Button, Text, StyleSheet, TouchableOpacity, ScrollView ,Image } from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker'; 
import { Linking, Platform } from 'react-native';

const App = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showAttachments, setShowAttachments] = useState(false); 
  const [showOlderMessagesButton, setShowOlderMessagesButton] = useState(false);
  const scrollViewRef = useRef();
  useEffect(() => {
    // 이전에 정의된 fetchTestMessage 함수는 그대로 유지
    const fetchMessages = async () => {
      try {
        const response = await axios.get('localhost:3000/chat/list.php');
  
        const sortedMessages = response.data.messages.sort((a, b) => new Date(a.date) - new Date(b.date));
        setMessages(sortedMessages);
        setShowOlderMessagesButton(response.data.hasOlderMessages);
      } catch (error) {
        console.error('Fetch Messages Error:', error);
      }
    };
    fetchMessages();
  }, []);

  const fetchOlderMessages = async () => {
    if (messages.length === 0) {
        setShowOlderMessagesButton(false);
        return;
    }

    try {
        // 가장 오래된 메시지의 날짜를 사용하여 이전 메시지들을 요청합니다.
        const oldestMessageDate = messages[0].date;

        const response = await axios.post(
            'localhost:3000/chat/history.php',
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
            const response = await axios.post('localhost:3000/chat/message.php', JSON.stringify(messageData), {
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

  
const pickImage = async () => {
  let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (permissionResult.granted === false) {
    alert('Permission to access camera roll is required!');
    return;
  }

  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images, // 이미지만 선택 가능하게 설정
    allowsEditing: false, // 이미지 편집 비활성화
    quality: 1, // 최대 품질
  });

  console.log('Image picking result:', result);

  if (!result.cancelled && result.assets && result.assets.length > 0) { // 만일 사용자가 이미지 선택을 취소하지 않았고, 이미지가 존재한다면
    const selectedImage = result.assets[0]; // 첫 번째 이미지 정보를 선택
    console.log('Image selected:', selectedImage.uri);
    uploadImage(selectedImage.uri); // 이미지 업로드 함수를 호출합니다.
  }
  else {
    console.log('Image selection cancelled');
  }
};



const uploadImage = async (uri) => {
  const formData = new FormData();
  formData.append('file', { uri, name: uri.split('/').pop(), type: 'image/jpeg' }); // MIME 타입을 'image/jpeg'로 설정

  try {
    const response = await axios.post('localhost:3000/chat/image.php', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.newMessage) {
      const newImageMessage = {
          ...response.data.newMessage,
          isImage: true, // Ensure this property is set for image messages
      };
  
      setMessages([...messages, newImageMessage]);
      console.log('Image uploaded:', newImageMessage);
  } else if (response.data.error) {
      console.error('Server error:', response.data.error);
    }
  } catch (error) {
    console.error('Upload error:', error.response ? error.response.data : error);
  }
};






  const pickFile = async () => {
    try {
        let result = await DocumentPicker.getDocumentAsync({
            type: '*/*', // 모든 유형의 파일을 허용합니다.
        });
        console.log('File picking result:', result); // 결과를 로그로 찍어 확인합니다.

        // 사용자가 파일 선택을 취소하지 않았고, 선택된 파일이 있는지 확인합니다.
        if (!result.canceled && result.assets && result.assets.length > 0) {
            const selectedFile = result.assets[0]; // 첫 번째 선택된 파일 정보를 가져옵니다.
            console.log('File selected:', selectedFile.uri, selectedFile.type, selectedFile.name, selectedFile.size);
            uploadFile(selectedFile.uri); // 파일 업로드 함수를 호출합니다.
        } else {
            console.log('File selection cancelled or failed');
        }
    } catch (error) {
        console.error('Error picking file:', error);
    }
};


  
const uploadFile = async (uri) => {
  const formData = new FormData();
  formData.append('file', { uri, name: uri.split('/').pop(), type: '*/*' });

  try {
    const response = await axios.post('localhost:3000/chat/file.php', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (response.data.newMessage) {
      // Here we're updating the text of the message to include the file link.
      const updatedMessage = {
        ...response.data.newMessage,
        isFile: true, // Add this line to indicate that this is a file message.
        fileText: response.data.newMessage.text, // Preserve the original text.
        text: `File: ${response.data.newMessage.file}`, // Change text to show 'File: [fileLink]'
      };
      setMessages([...messages, updatedMessage]);
      console.log('File uploaded:', updatedMessage);
    } else if (response.data.error) {
      console.error('Server error:', response.data.error);
    }
  } catch (error) {
    console.error('Upload error:', error.response ? error.response.data : error);
  }
};




  return (
    <View style={styles.container}>
      {showOlderMessagesButton && (
        <View style={styles.olderMessagesButtonContainer}>
          <Button title="이전 메시지 보기" onPress={fetchOlderMessages} />
        </View>
      )}


      <ScrollView
        style={styles.messagesContainer}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, index) => (
          <View key={index} style={styles.messageOuterContainer}>
          {msg.isFile ? (
            // If it's a file message, make the text clickable and open the file URL when clicked.
            <TouchableOpacity onPress={() => Linking.openURL(msg.file)}>
              <View style={styles.messageContainer}>
                <Text style={styles.message}>{msg.fileText}</Text>
              </View>
            </TouchableOpacity>
          ) : msg.isImage ? (
            <TouchableOpacity onPress={() => msg.img && Linking.openURL(msg.img)}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: msg.img }} style={styles.image} resizeMode="cover" />
                
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.messageContainer}>
              <Text style={styles.message}>{msg.text}</Text>
            </View>
          )}
          <Text style={styles.date}>{new Date(msg.date).toLocaleString()}</Text>
        </View>
        ))}

      </ScrollView>



      {showAttachments && ( // 수정됨: showAttachments 사용 확인
        <View style={styles.attachmentsContainer}>
          <Button title="파일 첨부" onPress={pickFile} />
          <Button title="사진 업로드" onPress={pickImage} />
        </View>
      )}
      <View style={styles.inputContainer}>
      <TouchableOpacity onPress={() => setShowAttachments(!showAttachments)}> 
          <Text style={styles.attachmentButton}>{showAttachments ? 'X' : '+'}</Text>
      </TouchableOpacity>

        <TextInput 
          style={styles.input} 
          value={message} 
          onChangeText={setMessage} 
          placeholder="메시지 입력"
        />
        <Button title=">" onPress={sendMessage} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    width: 200,
    height: 200,
    overflow: 'hidden',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  messageOuterContainer: {
    flexDirection: 'row',
    maxWidth: '80%', // Maximum width for the entire message block
    marginBottom: 20, // Space between messages
    alignSelf: 'flex-start', // Align the message block to the left
  },
  messageContainer: {
    backgroundColor: '#DCF8C6', // Chat bubble color
    paddingHorizontal: 14,
    paddingVertical: 8,
    //padding-top
    paddingTop: 15,
    borderRadius: 15,
    // Remove maxWidth and alignSelf if they were set here
  },
  message: {
    fontSize: 16,
    color: 'black',
  },
  date: {
    alignSelf: 'flex-end', // Align the date at the bottom of the message
    marginLeft: 6, // Space between message bubble and date
    marginBottom: 5, // Align the date text bottom to the message bubble
    fontSize: 12,
    color: 'grey',
  },
  olderMessagesButtonContainer: {
    alignItems: 'center', // 버튼을 중앙에 배치
    marginTop: 10,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  messagesContainer: {
    flex: 1, // 이 부분은 flex를 유지합니다.
    paddingHorizontal: 10,
  },
  message: {
    marginBottom: 10,
  },
  attachmentsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderColor: 'lightgrey',
    backgroundColor: 'white'
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: 'lightgrey',
    marginRight: 10,
    paddingLeft: 10,
  },
  attachmentButton: {
    marginRight: 10,
    fontSize: 24,
  },
});

export default App;
