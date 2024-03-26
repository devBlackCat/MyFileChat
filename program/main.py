import sys
from PyQt5.QtWidgets import QTextBrowser, QApplication, QWidget, QVBoxLayout, QPushButton, QLineEdit, QFileDialog, QScrollArea, QHBoxLayout, QMessageBox
from PyQt5.QtCore import Qt, QPoint
from PyQt5.QtGui import QDesktopServices
import requests
from datetime import datetime
import json
from PyQt5.QtWidgets import QLabel
from PyQt5.QtGui import QPixmap
import base64
import shelve 
from PyQt5.QtWidgets import QMenu 


class ChatApp(QWidget):
    def __init__(self):
        super().__init__()
        self.cache = shelve.open("chat_cache") 
        self.initUI()  # 먼저 UI를 초기화합니다.
        self.loadOlderMessages() 

    def __del__(self):
        self.cache.close()

    def closeEvent(self, event):
        self.cache.close()  # 캐시 파일 닫기
        super().closeEvent(event)  # 기본 종료 이벤트 처리

    def initUI(self):
        self.layout = QVBoxLayout(self)

        self.messagesArea = QTextBrowser()
        self.messagesArea.setReadOnly(True)
        self.messagesArea.setOpenExternalLinks(True)
        self.messagesArea.anchorClicked.connect(self.linkClicked)

        self.scroll = QScrollArea()
        self.scroll.setWidget(self.messagesArea)
        self.scroll.setWidgetResizable(True)

        self.messageInput = QLineEdit()
        self.messageInput.setPlaceholderText('메시지 입력')
        
        self.fileUploadButton = QPushButton('파일 업로드')
        self.fileUploadButton.clicked.connect(self.pickFile)
        self.imageUploadButton = QPushButton('사진 업로드')
        self.imageUploadButton.clicked.connect(self.pickImage)

        # Initially hide the upload buttons
        self.fileUploadButton.hide()
        self.imageUploadButton.hide()

        self.sendButton = QPushButton('>')
        self.sendButton.clicked.connect(self.sendMessage)
        
        self.toggleUploadButton = QPushButton('+')
        self.toggleUploadButton.clicked.connect(self.toggleUploadOptions)

        # Input and buttons layout
        self.inputLayout = QHBoxLayout()
        self.inputLayout.addWidget(self.toggleUploadButton)
        self.inputLayout.addWidget(self.messageInput, 1)  # Message input gets most space
        self.inputLayout.addWidget(self.sendButton)

        # Add all main layout components
        self.layout.addWidget(self.scroll)
        self.layout.addLayout(self.inputLayout)

        self.setWindowTitle('MyFileChat')
        self.setGeometry(100, 100, 600, 500)
        self.show()

        
        self.setStyleSheet("""
            QWidget {
                background-color: #36393F;
                color: #DCDDDE;
            }
            QTextBrowser {
                background-color: #2F3136;
                border: 1px solid #202225;
                color: #DCDDDE;
            }
            QLineEdit {
                background-color: #40444B;
                border: none;
                color: #DCDDDE;
                padding: 5px;
            }
            QPushButton {
                background-color: #5865F2;
                color: #FFFFFF;
                border: none;
                padding: 5px;
                margin: 2px;
            }
            QPushButton:hover {
                background-color: #4752C4;
            }
            QPushButton:pressed {
                background-color: #3B3F99;
            }
            QScrollBar:vertical {
                background: #2F3136;
            }
            QScrollBar::handle:vertical {
                background: #202225;
                min-height: 5px;
            }
            QScrollBar::add-line:vertical {
                border: none;
                background: none;
            }
            QScrollBar::sub-line:vertical {
                border: none;
                background: none;
            }
        """)

    def toggleUploadOptions(self):
        # QMenu 인스턴스를 생성하고, QAction을 추가합니다.
        uploadMenu = QMenu(self)  # 현재 위젯을 부모로 설정합니다.
        uploadFileAction = uploadMenu.addAction('파일 업로드')
        uploadImageAction = uploadMenu.addAction('사진 업로드')
        uploadFileAction.triggered.connect(self.pickFile)  # 파일 선택 메서드에 연결
        uploadImageAction.triggered.connect(self.pickImage)  # 이미지 선택 메서드에 연결
        # 메뉴를 표시합니다. 여기서 self.toggleUploadButton은 메뉴를 나타낼 위젯입니다.
        uploadMenu.exec_(self.toggleUploadButton.mapToGlobal(QPoint(0, self.toggleUploadButton.height())))


    def loadOlderMessages(self):
        # 캐시된 메시지가 있는지 확인
        try:
            # 서버에서 메시지 로드
            response = requests.get('localhost/chat/list.php')
            if response.status_code == 200:
                new_messages = response.json().get('messages', [])
                # 캐시에서 메시지 로드
                cached_messages = self.cache.get('messages', [])
                # 새로운 메시지만 필터링
                new_unique_messages = [msg for msg in new_messages if msg not in cached_messages]
                # 기존 메시지에 새로운 메시지 추가
                updated_messages = cached_messages + new_unique_messages
                # 메시지 업데이트
                self.updateMessages(updated_messages, clear_existing=True)
                # 새로운 메시지를 캐시에 저장
                self.cache['messages'] = updated_messages
            else:
                QMessageBox.warning(self, 'Error', 'Could not load older messages')
        except Exception as e:
            QMessageBox.warning(self, 'Error', str(e))

            


    def sendMessage(self):
        message = self.messageInput.text()
        if message:
            now = datetime.now().isoformat()
            messageData = {'text': message, 'date': now}
            try:
                response = requests.post('localhost/chat/message.php',
                                         data=json.dumps(messageData),
                                         headers={'Content-Type': 'application/json'})
                if response.status_code == 200:
                    newMessage = response.json().get('newMessage')
                    self.updateMessages([newMessage])
                else:
                    QMessageBox.warning(self, 'Error', 'Message could not be sent')
            except Exception as e:
                QMessageBox.warning(self, 'Error', str(e))
            finally:
                self.messageInput.clear()
                

    def pickFile(self):
        fname, _ = QFileDialog.getOpenFileName(self, '파일 선택')
        if fname:
            try:
                files = {'file': (fname.split('/')[-1], open(fname, 'rb'))}
                response = requests.post('localhost/chat/file.php',
                                         files=files)
                if response.status_code == 200:
                    newMessage = response.json().get('newMessage')
                    newMessage['isFile'] = True  # 서버 응답에 isFile 키를 추가합니다.
                    self.updateMessages([newMessage])
                else:
                    QMessageBox.warning(self, 'Error', 'File could not be uploaded')
            except Exception as e:
                QMessageBox.warning(self, 'Error', str(e))

    def pickImage(self):
        fname, _ = QFileDialog.getOpenFileName(self, '이미지 선택', '', 'Images (*.png *.jpg *.jpeg)')
        if fname:
            try:
                files = {'file': (fname.split('/')[-1], open(fname, 'rb'))}
                response = requests.post('localhost/chat/image.php',
                                        files=files)
                if response.status_code == 200:
                    newMessage = response.json().get('newMessage')
                    newMessage['isImage'] = True
                    self.updateMessages([newMessage])
                    #QMessageBox.information(self, '이미지 업로드 성공', newMessage['img'])  # 이 줄을 추가하세요
                else:
                    QMessageBox.warning(self, 'Error', 'Image could not be uploaded')
            except Exception as e:
                QMessageBox.warning(self, 'Error', str(e))


    def linkClicked(self, url):
        QDesktopServices.openUrl(url)



    def updateMessages(self, messages, clear_existing=False):
     #    self.messagesArea.clear()  이전 메시지를 지우고 새로 시작합니다.
        for msg in messages:
            displayMsg = f" - {msg['date']}"  # 메시지에 날짜를 추가합니다.
            if 'isFile' in msg:
                # 파일 메시지인 경우 다운로드 링크를 생성합니다.
                fileLink = f"<a href='{msg['file']}' target='_blank' style='text-decoration: none; color: blue;'>{msg.get('text', 'Download File')}</a>"
                self.messagesArea.append(fileLink + displayMsg)
            elif 'isImage' in msg:
                # 이미지 메시지인 경우
                img_url = msg['img']
                # 이미지 URL이 캐시에 있는지 확인합니다.
                if img_url in self.cache:
                    # 캐시된 이미지 데이터를 사용합니다.
                    img_base64 = self.cache[img_url]
                    imgTag = f"<a href='{img_url}' target='_blank'><img src='data:image/jpeg;base64,{img_base64}' width='200' /></a>"
                    self.messagesArea.append(imgTag + displayMsg)
                else:
                    # 캐시에 없는 경우, 서버에서 이미지를 로드합니다.
                    try:
                        response = requests.get(img_url)
                        if response.status_code == 200:
                            # 서버 응답에서 이미지 데이터를 Base64 인코딩합니다.
                            img_base64 = base64.b64encode(response.content).decode('utf-8')
                            # 캐시에 이미지를 저장합니다.
                            self.cache[img_url] = img_base64
                            # 이미지 태그를 생성하고 메시지를 표시합니다.
                            imgTag = f"<a href='{img_url}' target='_blank'><img src='data:image/jpeg;base64,{img_base64}' width='200' /></a>"
                            self.messagesArea.append(imgTag + displayMsg)
                    except Exception as e:
                        # 이미지 로드 실패 시 오류 메시지를 표시합니다.
                        self.messagesArea.append(displayMsg + "이미지를 불러올 수 없습니다.")
            else:
                # 일반 텍스트 메시지인 경우
                self.messagesArea.append(displayMsg + msg['text'])


if __name__ == '__main__':
    app = QApplication(sys.argv)
    ex = ChatApp()
    sys.exit(app.exec_())
