import { memo } from "react";
import Style from "./GroupChatPanel.module.css";

/**
 * 그룹 채팅 메시지 아이템
 * @param {object} message - 메시지 객체
 * @param {boolean} isMine - 내 메시지 여부
 * @param {boolean} isSystemMessage - 시스템 메시지 여부 (입장/퇴장 알림)
 */
const GroupMessageItem = memo(function GroupMessageItem({ message, isMine, isSystemMessage }) {
  if (isSystemMessage) {
    return (
      <div className={Style.systemMessageRow}>
        <div className={Style.systemMessage}>
          {message.message}
        </div>
      </div>
    );
  }

  return (
    <div className={`${Style.msgRow} ${isMine ? Style.mine : Style.other}`}>
      {!isMine && (
        <div className={Style.avatar}>
          <div className={Style.avatarCircle}>
            {(message.username || message.user_id)?.charAt(0)?.toUpperCase()}
          </div>
        </div>
      )}
      
      <div className={`${Style.bubble} ${message.optimistic ? Style.optimistic : ""}`}>
        <div className={Style.meta}>
          <span className={Style.name}>{message.username ?? `User #${message.user_id}`}</span>
          <span className={Style.time}>
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className={Style.text}>{message.message}</div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // 커스텀 비교 함수: true면 리렌더링 스킵, false면 리렌더링
  return (
    prevProps.message?.message_id === nextProps.message?.message_id &&
    prevProps.isMine === nextProps.isMine &&
    prevProps.isSystemMessage === nextProps.isSystemMessage
  );
});

export default GroupMessageItem;
