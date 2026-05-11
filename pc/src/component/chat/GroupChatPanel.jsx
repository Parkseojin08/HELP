import { useEffect, useMemo, useRef, useState } from "react";
import Style from "./GroupChatPanel.module.css";

import { listGroups, getGroupDetail, getGroupMessages, markGroupMessageRead } from "../../api/chat/groups";
import { getSocket } from "../../api/chat/socket";
import { useAuth } from "../../context/AuthContext";
import GroupChatList from "./GroupChatList";
import GroupMessageItem from "./GroupMessageItem";

export default function GroupChatPanel() {
  const { userInfo } = useAuth();

  const socket = useMemo(() => getSocket(), []);
  const [groups, setGroups] = useState([]);

  const [activeGroupId, setActiveGroupId] = useState(null);
  const [groupDetail, setGroupDetail] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [input, setInput] = useState("");

  const bottomRef = useRef(null);
  const joinedGroupsRef = useRef(new Set());
  const optimisticIdRef = useRef(1);

  const refreshGroups = async () => {
    const data = await listGroups();
    if (data?.success) {
      setGroups(data.data ?? []);
    }
  };

  const openGroup = async (groupId) => {
    setActiveGroupId(groupId);
    setMessages([]);
    setOnlineUsers([]);
    
    // Fetch group detail
    const detailData = await getGroupDetail(groupId);
    if (detailData?.success) {
      setGroupDetail(detailData.data);
    }

    // Fetch messages
    const messagesData = await getGroupMessages(groupId, { limit: 50 });
    if (messagesData?.success) {
      // server returns desc; show asc
      setMessages((messagesData.data ?? []).slice().reverse());
    }

    // Join group via socket
    socket.emit("join_group", { groupId });
  };

  const send = () => {
    const text = input.trim();
    if (!text || !activeGroupId) return;

    // Ensure we are joined before sending
    if (!joinedGroupsRef.current.has(activeGroupId)) {
      socket.emit("join_group", { groupId: activeGroupId });
    }

    // Optimistic UI: show my message immediately
    const optimisticId = `optimistic:${optimisticIdRef.current++}`;
    const optimistic = {
      message_id: optimisticId,
      group_id: activeGroupId,
      message: text,
      created_at: new Date().toISOString(),
      user_id: userInfo?.user_id,
      username: userInfo?.username,
      optimistic: true,
    };
    setMessages((prev) => [...prev, optimistic]);

    socket.emit("send_group_message", { groupId: activeGroupId, message: text });
    setInput("");
  };

  useEffect(() => {
    if (!userInfo?.user_id) return;
    refreshGroups();
  }, [userInfo?.user_id]);

  useEffect(() => {
    const onJoinedGroup = ({ groupId }) => {
      if (!groupId) return;
      joinedGroupsRef.current.add(groupId);
    };

    const onGroupMessage = async (payload) => {
      if (!payload?.group_id) return;

      // Update group list (last message)
      setGroups((prev) => {
        const next = prev.slice();
        const idx = next.findIndex((g) => g.group_id === payload.group_id);
        if (idx !== -1) {
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

      // Add message to current group
      if (payload.group_id === activeGroupId) {
        setMessages((prev) => {
          // If I already showed an optimistic message, replace it
          if (payload.user_id === userInfo?.user_id) {
            const idx = [...prev].reverse().findIndex(
              (m) =>
                m?.optimistic &&
                m?.group_id === payload.group_id &&
                m?.message === payload.message
            );
            if (idx !== -1) {
              const realIdx = prev.length - 1 - idx;
              const next = prev.slice();
              next[realIdx] = payload;
              return next;
            }
          }
          return [...prev, payload];
        });

        // Mark as read if not my message
        if (payload.user_id !== userInfo?.user_id) {
          await markGroupMessageRead(activeGroupId, payload.message_id);
          socket.emit("read_group_message", { groupId: activeGroupId, messageId: payload.message_id });
        }
      }
    };

    const onGroupUserJoined = ({ groupId, userId, username }) => {
      if (!groupId) return;

      // Add system message
      if (groupId === activeGroupId) {
        const systemMessage = {
          message_id: `system:joined:${userId}:${Date.now()}`,
          group_id: groupId,
          message: `${username || `User #${userId}`}이(가) 입장했습니다`,
          created_at: new Date().toISOString(),
          type: "system",
        };
        setMessages((prev) => [...prev, systemMessage]);

        // Update online users
        setOnlineUsers((prev) => {
          const user = { user_id: userId, username };
          if (!prev.find((u) => u.user_id === userId)) {
            return [...prev, user];
          }
          return prev;
        });
      }
    };

    const onGroupUserLeft = ({ groupId, userId, username }) => {
      if (!groupId) return;

      // Add system message
      if (groupId === activeGroupId) {
        const systemMessage = {
          message_id: `system:left:${userId}:${Date.now()}`,
          group_id: groupId,
          message: `${username || `User #${userId}`}이(가) 퇴장했습니다`,
          created_at: new Date().toISOString(),
          type: "system",
        };
        setMessages((prev) => [...prev, systemMessage]);

        // Remove from online users
        setOnlineUsers((prev) => prev.filter((u) => u.user_id !== userId));
      }
    };

    const onGroupUsers = ({ groupId, users }) => {
      if (groupId === activeGroupId) {
        setOnlineUsers(users ?? []);
      }
    };

    socket.on("joined_group", onJoinedGroup);
    socket.on("group_message", onGroupMessage);
    socket.on("group_user_joined", onGroupUserJoined);
    socket.on("group_user_left", onGroupUserLeft);
    socket.on("group_users", onGroupUsers);

    return () => {
      socket.off("joined_group", onJoinedGroup);
      socket.off("group_message", onGroupMessage);
      socket.off("group_user_joined", onGroupUserJoined);
      socket.off("group_user_left", onGroupUserLeft);
      socket.off("group_users", onGroupUsers);
    };
  }, [socket, activeGroupId, userInfo?.user_id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages.length]);

  if (!userInfo?.user_id) {
    return (
      <div className={Style.wrap}>
        <div className={Style.empty}>로그인 후 채팅을 사용할 수 있어요.</div>
      </div>
    );
  }

  return (
    <div className={Style.wrap}>
      <GroupChatList
        groups={groups}
        activeGroupId={activeGroupId}
        onSelectGroup={openGroup}
        onRefresh={refreshGroups}
      />

      <section className={Style.chat}>
        {!activeGroupId ? (
          <div className={Style.empty}>왼쪽에서 그룹을 선택하세요.</div>
        ) : (
          <>
            <div className={Style.chatHeader}>
              <div>
                <h3>{groupDetail?.name || `Group #${activeGroupId}`}</h3>
                <p className={Style.headerSubtitle}>
                  👥 {onlineUsers.length}명 접속
                </p>
              </div>
              <div className={Style.onlineUsersContainer}>
                <h4>접속자</h4>
                <div className={Style.onlineUsersList}>
                  {onlineUsers.length === 0 ? (
                    <p className={Style.emptyUsersText}>접속자 없음</p>
                  ) : (
                    onlineUsers.map((user) => (
                      <div key={user.user_id} className={Style.onlineUser}>
                        <div className={Style.userAvatar}>
                          {(user.username || user.user_id)?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className={Style.userName}>
                          {user.username || `User #${user.user_id}`}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className={Style.messages}>
              {messages.map((m) => {
                const isSystemMessage = m.type === "system";
                const isMine = m.user_id === userInfo.user_id && !isSystemMessage;
                return (
                  <GroupMessageItem
                    key={m.message_id}
                    message={m}
                    isMine={isMine}
                    isSystemMessage={isSystemMessage}
                  />
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
              <button className={Style.send} onClick={send}>
                전송
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
