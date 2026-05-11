# 그룹 채팅 API 스펙 문서

## 개요
프론트엔드에서 구현한 그룹 채팅 UI와 연동하기 위한 백엔드 API 및 소켓 이벤트 정의

**작성일**: 2026-04-26  
**담당**: 프론트엔드 팀  
**대상**: 백엔드 팀

---

## 1. REST API 엔드포인트

### 1.1 그룹 목록 조회
**요청**
```
GET /api/chat/groups
Authorization: Cookie (withCredentials)
```

**응답 성공 (200)**
```json
{
  "success": true,
  "data": [
    {
      "group_id": 1,
      "name": "개발팀",
      "description": "개발팀 채팅방",
      "member_count": 5,
      "created_at": "2026-04-20T10:30:00Z",
      "updated_at": "2026-04-26T15:45:00Z",
      "last_message": "안녕하세요",
      "last_message_id": 123,
      "last_message_at": "2026-04-26T15:45:00Z",
      "last_message_user_id": 2
    }
  ]
}
```

**응답 실패 (400/401)**
```json
{
  "success": false,
  "message": "인증 필요"
}
```

---

### 1.2 그룹 상세 조회
**요청**
```
GET /api/chat/groups/:groupId
Authorization: Cookie (withCredentials)
```

**응답 성공 (200)**
```json
{
  "success": true,
  "data": {
    "group_id": 1,
    "name": "개발팀",
    "description": "개발팀 채팅방",
    "member_count": 5,
    "created_at": "2026-04-20T10:30:00Z",
    "updated_at": "2026-04-26T15:45:00Z",
    "members": [
      {
        "user_id": 1,
        "username": "alice"
      },
      {
        "user_id": 2,
        "username": "bob"
      }
    ]
  }
}
```

---

### 1.3 그룹 생성
**요청**
```
POST /api/chat/groups
Content-Type: application/json
Authorization: Cookie (withCredentials)

{
  "name": "마케팅팀",
  "description": "마케팅팀 채팅방"
}
```

**응답 성공 (201)**
```json
{
  "success": true,
  "data": {
    "group_id": 2,
    "name": "마케팅팀",
    "description": "마케팅팀 채팅방",
    "created_at": "2026-04-26T16:00:00Z",
    "member_count": 1
  }
}
```

**응답 실패 (400)**
```json
{
  "success": false,
  "message": "그룹명은 필수입니다"
}
```

---

### 1.4 그룹 메시지 조회
**요청**
```
GET /api/chat/groups/:groupId/messages?limit=50&offset=0
Authorization: Cookie (withCredentials)
```

**쿼리 파라미터**
- `limit`: 조회할 메시지 수 (기본값: 50, 최대: 100)
- `offset`: 페이지네이션 시작점 (기본값: 0)

**응답 성공 (200)**
```json
{
  "success": true,
  "data": [
    {
      "message_id": 1,
      "group_id": 1,
      "user_id": 1,
      "username": "alice",
      "message": "안녕하세요",
      "created_at": "2026-04-26T15:45:00Z",
      "updated_at": "2026-04-26T15:45:00Z"
    },
    {
      "message_id": 2,
      "group_id": 1,
      "user_id": 2,
      "username": "bob",
      "message": "안녕!",
      "created_at": "2026-04-26T15:46:00Z",
      "updated_at": "2026-04-26T15:46:00Z"
    }
  ]
}
```

**주의사항**
- 메시지는 **역순(DESC)** 으로 반환 (최신 메시지부터)
- 프론트엔드에서 `reverse()`로 정렬을 바꿈

---

### 1.5 그룹 메시지 읽음 표시
**요청**
```
POST /api/chat/groups/:groupId/messages/:messageId/read
Authorization: Cookie (withCredentials)
```

**응답 성공 (200)**
```json
{
  "success": true,
  "data": {
    "message_id": 1,
    "read_count": 3
  }
}
```

---

## 2. WebSocket 이벤트

**연결**
```javascript
// 프론트엔드에서 자동 연결
const socket = io("http://localhost:5000", {
  withCredentials: true,
  transports: ["websocket"],
});
```

---

### 2.1 그룹 입장 이벤트
**클라이언트 → 서버**
```javascript
socket.emit("join_group", { groupId: 1 });
```

**서버 → 클라이언트 (같은 클라이언트)**
```javascript
socket.on("joined_group", ({ groupId }) => {
  console.log(`Group ${groupId}에 입장했습니다`);
});
```

**서버 → 다른 클라이언트들 (같은 그룹)**
```javascript
socket.on("group_user_joined", ({
  groupId: 1,
  userId: 1,
  username: "alice"
}));
```

---

### 2.2 그룹 메시지 전송
**클라이언트 → 서버**
```javascript
socket.emit("send_group_message", {
  groupId: 1,
  message: "안녕하세요"
});
```

**서버 → 같은 그룹의 모든 클라이언트**
```javascript
socket.on("group_message", ({
  message_id: 1,
  group_id: 1,
  user_id: 1,
  username: "alice",
  message: "안녕하세요",
  created_at: "2026-04-26T16:00:00Z"
}));
```

**주의사항**
- 발신자도 포함하여 브로드캐스트
- `message_id`는 DB에서 생성된 ID로 전송
- Optimistic UI: 클라이언트에서 임시 ID(`optimistic:${num}`)로 표시했던 메시지를 `message_id` 기준으로 교체

---

### 2.3 그룹 사용자 입장 알림
**서버 → 같은 그룹의 모든 클라이언트**
```javascript
socket.on("group_user_joined", {
  groupId: 1,
  userId: 1,
  username: "alice"
});
```

**프론트엔드 처리**
- 시스템 메시지로 `"alice이(가) 입장했습니다"` 표시
- 온라인 사용자 목록에 추가

---

### 2.4 그룹 사용자 퇴장 알림
**서버 → 같은 그룹의 모든 클라이언트**
```javascript
socket.on("group_user_left", {
  groupId: 1,
  userId: 1,
  username: "alice"
});
```

**프론트엔드 처리**
- 시스템 메시지로 `"alice이(가) 퇴장했습니다"` 표시
- 온라인 사용자 목록에서 제거

---

### 2.5 그룹 온라인 사용자 목록
**클라이언트 → 서버**
```javascript
socket.emit("join_group", { groupId: 1 });
```

**서버 → 해당 클라이언트**
```javascript
socket.on("group_users", {
  groupId: 1,
  users: [
    { user_id: 1, username: "alice" },
    { user_id: 2, username: "bob" }
  ]
});
```

**발생 타이밍**
- `join_group` 이벤트 수신 후 즉시 발송
- 新 사용자 입장/퇴장 시마다 업데이트

---

### 2.6 메시지 읽음 표시
**클라이언트 → 서버** (선택사항)
```javascript
socket.emit("read_group_message", {
  groupId: 1,
  messageId: 1
});
```

**서버 처리**
- 해당 메시지에 대한 읽음 정보 저장
- 필요시 다른 클라이언트들에게 브로드캐스트

---

## 3. 데이터 모델

### 3.1 Group 테이블
```sql
CREATE TABLE groups (
  group_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(user_id)
);
```

### 3.2 Group Member 테이블
```sql
CREATE TABLE group_members (
  member_id INT PRIMARY KEY AUTO_INCREMENT,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups(group_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  UNIQUE KEY unique_member (group_id, user_id)
);
```

### 3.3 Group Message 테이블
```sql
CREATE TABLE group_messages (
  message_id INT PRIMARY KEY AUTO_INCREMENT,
  group_id INT NOT NULL,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups(group_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  INDEX idx_group (group_id),
  INDEX idx_created (created_at DESC)
);
```

### 3.4 Group Message Read 테이블 (선택사항)
```sql
CREATE TABLE group_message_reads (
  read_id INT PRIMARY KEY AUTO_INCREMENT,
  message_id INT NOT NULL,
  user_id INT NOT NULL,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES group_messages(message_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  UNIQUE KEY unique_read (message_id, user_id)
);
```

---

## 4. 에러 처리

### 공통 에러 응답 포맷
```json
{
  "success": false,
  "message": "에러 메시지",
  "code": "ERROR_CODE"
}
```

### 에러 코드 정의
| 코드 | HTTP | 설명 |
|------|------|------|
| UNAUTHORIZED | 401 | 인증 필요 |
| FORBIDDEN | 403 | 그룹 접근 권한 없음 |
| NOT_FOUND | 404 | 그룹 또는 메시지 없음 |
| INVALID_INPUT | 400 | 입력값 검증 실패 |
| SERVER_ERROR | 500 | 서버 오류 |

---

## 5. 구현 체크리스트

### REST API
- [ ] GET /api/chat/groups
- [ ] GET /api/chat/groups/:groupId
- [ ] POST /api/chat/groups
- [ ] GET /api/chat/groups/:groupId/messages
- [ ] POST /api/chat/groups/:groupId/messages/:messageId/read

### WebSocket 이벤트
- [ ] join_group (listen)
- [ ] joined_group (emit to sender)
- [ ] group_user_joined (broadcast)
- [ ] group_user_left (broadcast)
- [ ] group_users (emit to sender)
- [ ] send_group_message (listen)
- [ ] group_message (broadcast to group)
- [ ] read_group_message (listen)

### 데이터베이스
- [ ] groups 테이블
- [ ] group_members 테이블
- [ ] group_messages 테이블
- [ ] group_message_reads 테이블 (선택)

---

## 6. 개발 순서 권장

1. **1단계**: 그룹 관련 테이블 생성 및 REST API 구현
   - GET /api/chat/groups
   - GET /api/chat/groups/:groupId
   - POST /api/chat/groups
   - GET /api/chat/groups/:groupId/messages

2. **2단계**: 기본 소켓 이벤트 구현
   - join_group
   - joined_group
   - send_group_message
   - group_message

3. **3단계**: 사용자 입장/퇴장 관리
   - group_user_joined
   - group_user_left
   - group_users

4. **4단계**: 읽음 표시 기능 (선택)
   - POST /api/chat/groups/:groupId/messages/:messageId/read
   - read_group_message

---

## 7. 테스트 시나리오

### 시나리오 1: 그룹 생성 및 조회
1. POST /api/chat/groups로 "개발팀" 그룹 생성
2. GET /api/chat/groups로 목록 확인
3. GET /api/chat/groups/1로 상세 정보 확인

### 시나리오 2: 메시지 전송 및 수신
1. Alice가 그룹 1에 입장 (join_group 이벤트)
2. Bob이 그룹 1에 입장
3. Alice가 "안녕하세요" 메시지 전송
4. 모두가 group_message 이벤트 수신
5. GET /api/chat/groups/1/messages로 메시지 확인

### 시나리오 3: 사용자 입장/퇴장
1. Alice가 그룹 1 입장 → group_user_joined 브로드캐스트
2. Bob이 그룹 1 입장 → group_user_joined 브로드캐스트
3. Alice 퇴장 → group_user_left 브로드캐스트

---

## 8. 주의사항 및 팁

### 데이터 일관성
- 그룹 생성 시 생성자를 자동으로 멤버에 추가
- 메시지 조회 시 user_id와 username을 함께 반환

### 성능 최적화
- 그룹 메시지 조회 시 pagination 구현 (limit, offset)
- message_id, group_id에 인덱스 생성
- 온라인 사용자 목록은 메모리(Redis)에서 관리하는 것 권장

### 보안
- 그룹에 속한 사용자만 메시지 조회 가능
- 다른 사용자의 메시지 수정/삭제 불가
- 그룹 생성자만 그룹 삭제 가능

---

## 9. 향후 확장 기능

- [ ] 그룹 삭제 API
- [ ] 그룹 이름/설명 수정 API
- [ ] 멤버 추가/제거 API
- [ ] 메시지 검색 기능
- [ ] 파일 업로드 기능
- [ ] 메시지 반응(이모지) 기능
- [ ] 사용자 차단 기능

---

## 문의사항

프론트엔드 팀: 위 스펙에 대한 질문이나 수정 요청은 `#dev-chat` 채널에서 논의하세요.
