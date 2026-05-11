import { useEffect, useMemo, useRef, useState } from "react";
import Style from "./ChatPanel.module.css";

import searchFriend from "../../api/search/friend/friendList";
import { createDirectRoom, listRooms } from "../../api/chat/rooms";
import { listMessages, markRead } from "../../api/chat/messages";
import { getSocket } from "../../api/chat/socket";
import { useAuth } from "../../context/AuthContext";

export default function ChatPanel(){
  const { userInfo } = useAuth();

  const socket = useMemo(() => getSocket(), []);
  const [rooms, setRooms] = useState([]);
  const [friends, setFriends] = useState([]);

  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [startFriendId, setStartFriendId] = useState("");

  const bottomRef = useRef(null);
  const joinedRoomsRef = useRef(new Set());
  const optimisticIdRef = useRef(1);

  const refreshRooms = async () => {
    const data = await listRooms();
    if (data?.success) setRooms(data.data ?? []);
  };

  const refreshFriends = async () => {
    const data = await searchFriend();
    if (data?.success) setFriends(data.data ?? []);
    else setFriends([]);
  };

  const openRoom = async (roomId) => {
    setActiveRoomId(roomId);
    setMessages([]);
    socket.emit("join_room", { roomId });
    const data = await listMessages(roomId, { limit: 50 });
    if (data?.success){
      // server returns desc; show asc
      setMessages((data.data ?? []).slice().reverse());
    }
  };

  const startDirect = async () => {
    const friend_id = Number(startFriendId);
    if (!friend_id) return;
    const data = await createDirectRoom(friend_id);
    if (data?.success && data.room_id){
      await refreshRooms();
      await openRoom(data.room_id);
    }
  };

  const send = () => {
    const text = input.trim();
    if (!text || !activeRoomId) return;

    // Ensure we are joined before relying on broadcast
    if (!joinedRoomsRef.current.has(activeRoomId)){
      socket.emit("join_room", { roomId: activeRoomId });
    }

    // Optimistic UI: show my message immediately (React-like)
    const optimisticId = `optimistic:${optimisticIdRef.current++}`;
    const optimistic = {
      message_id: optimisticId,
      room_id: activeRoomId,
      message: text,
      created_at: new Date().toISOString(),
      user_id: userInfo?.user_id,
      username: userInfo?.username,
      optimistic: true,
    };
    setMessages((prev) => [...prev, optimistic]);

    socket.emit("send_message", { roomId: activeRoomId, message: text });
    setInput("");
  };

  useEffect(() => {
    if (!userInfo?.user_id) return;
    refreshRooms();
    refreshFriends();
  }, [userInfo?.user_id]);

  useEffect(() => {
    const onJoined = ({ roomId }) => {
      if (!roomId) return;
      joinedRoomsRef.current.add(roomId);
    };

    const onNewMessage = async (payload) => {
      if (!payload?.room_id) return;
      setRooms((prev) => {
        const next = prev.slice();
        const idx = next.findIndex((r) => r.room_id === payload.room_id);
        if (idx !== -1){
          next[idx] = {
            ...next[idx],
            last_message_id: payload.message_id,
            last_message: payload.message,
            last_message_at: payload.created_at,
            last_message_user_id: payload.user_id,
          };
          next.sort((a, b) => (b.last_message_id ?? 0) - (a.last_message_id ?? 0));
        }
        return next;
      });

      if (payload.room_id === activeRoomId){
        setMessages((prev) => {
          // If I already showed an optimistic message, replace the latest matching one.
          if (payload.user_id === userInfo?.user_id){
            const idx = [...prev].reverse().findIndex((m) => m?.optimistic && m?.room_id === payload.room_id && m?.message === payload.message);
            if (idx !== -1){
              const realIdx = prev.length - 1 - idx;
              const next = prev.slice();
              next[realIdx] = payload;
              return next;
            }
          }
          return [...prev, payload];
        });
        // 읽음(최소 동작): 내 화면에서 수신하면 read_check 찍기
        if (payload.user_id !== userInfo?.user_id){
          await markRead(activeRoomId, payload.message_id);
          socket.emit("read_message", { roomId: activeRoomId, messageId: payload.message_id });
        }
      }
    };

    socket.on("joined_room", onJoined);
    socket.on("new_message", onNewMessage);
    return () => {
      socket.off("joined_room", onJoined);
      socket.off("new_message", onNewMessage);
    };
  }, [socket, activeRoomId, userInfo?.user_id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages.length]);

  if (!userInfo?.user_id){
    return (
      <div className={Style.wrap}>
        <div className={Style.empty}>로그인 후 채팅을 사용할 수 있어요.</div>
      </div>
    );
  }

  return (
    <div className={Style.wrap}>
      <aside className={Style.sidebar}>
        <div className={Style.sidebarHeader}>
          <h3>Chats</h3>
          <button className={Style.refresh} onClick={refreshRooms}>새로고침</button>
        </div>

        <div className={Style.startBox}>
          <select
            value={startFriendId}
            onChange={(e) => setStartFriendId(e.target.value)}
            className={Style.select}
          >
            <option value="">친구 선택</option>
            {friends.map((f) => (
              <option key={f.friend_id} value={f.friend_id}>
                {f.username}
              </option>
            ))}
          </select>
          <button className={Style.startBtn} onClick={startDirect}>대화 시작</button>
        </div>

        <div className={Style.roomList}>
          {rooms.map((r) => (
            <button
              key={r.room_id}
              className={`${Style.roomItem} ${activeRoomId === r.room_id ? Style.roomItemActive : ""}`}
              onClick={() => openRoom(r.room_id)}
            >
              <div className={Style.roomTitle}>
                {r.type === "direct" ? `direct #${r.room_id}` : (r.title ?? `room #${r.room_id}`)}
              </div>
              <div className={Style.roomLast}>
                {r.last_message ? r.last_message : "메시지 없음"}
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className={Style.chat}>
        {!activeRoomId ? (
          <div className={Style.empty}>왼쪽에서 채팅방을 선택하세요.</div>
        ) : (
          <>
            <div className={Style.chatHeader}>
              <h3>Room #{activeRoomId}</h3>
            </div>
            <div className={Style.messages}>
              {messages.map((m) => {
                const mine = m.user_id === userInfo.user_id;
                return (
                  <div key={m.message_id} className={`${Style.msgRow} ${mine ? Style.mine : Style.other}`}>
                    <div className={`${Style.bubble} ${m.optimistic ? Style.optimistic : ""}`}>
                      <div className={Style.meta}>
                        <span className={Style.name}>{m.username ?? m.user_id}</span>
                        <span className={Style.time}>{new Date(m.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div className={Style.text}>{m.message}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className={Style.inputBar}>
              <input
                className={Style.input}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
                placeholder="메시지를 입력하세요"
              />
              <button className={Style.send} onClick={send}>전송</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

