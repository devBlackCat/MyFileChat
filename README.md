# MyFileChat 프로젝트

## 개요

MyFileChat은 개인용도로 개발된 모바일 채팅 애플리케이션이며, 사용자가 여러 대의 모바일 기기를 소유하고 있을 때 발생할 수 있는 동시 접속 문제를 해결하기 위해 만들어졌습니다. 카카오톡과 같은 일반적인 메신저에서 겪는 여러 기기 동시 접속 불가의 문제를 개선하여, 사용자가 파일, 사진 및 텍스트 메시지를 자유롭게 공유할 수 있는 환경을 제공합니다. 이를 통해 사용자는 두 개 이상의 핸드폰을 사용하더라도 어느 기기에서든 원활하게 커뮤니케이션 할 수 있습니다.

## 기능

- **텍스트 메시지 전송 및 수신**: 실시간으로 메시지를 교환하고 대화를 이어갈 수 있습니다.
- **파일 및 이미지 공유**: 문서, 이미지 등 다양한 형태의 파일을 채팅을 통해 손쉽게 공유할 수 있습니다.
- **멀티 디바이스 지원**: 여러 대의 기기에서 동시에 앱에 접속하여 메시지를 주고받을 수 있습니다.

## 기술 스택

### 프론트엔드

- **React Native**: 모바일 앱 개발을 위한 주요 프레임워크로, 메시지 전송, 이미지 및 파일 업로드 등의 사용자 인터페이스 및 기능을 구현합니다.
- **Expo**: React Native 애플리케이션의 빌드, 배포 및 테스팅을 지원하는 도구입니다.

### 백엔드

- **PHP**: 서버 사이드 스크립트 언어로서, 데이터 처리 및 RESTful API 엔드포인트를 제공합니다.
  - `list.php`: 최근 메시지 목록을 조회합니다.
  - `history.php`: 지정된 날짜 이전의 메시지를 조회합니다.
  - `image.php`: 이미지 파일을 서버에 업로드하고 처리합니다.
  - `file.php`: 기타 파일을 서버에 업로드하고 처리합니다.

## 시작하기

본 섹션에는 이 애플리케이션을 로컬 환경에서 실행하기 위한 지침을 제공합니다.

### 필요 조건

- Node.js
- React Native 환경 설정
- PHP 서버 환경

