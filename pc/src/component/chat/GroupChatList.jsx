import { useState } from "react";
import Style from "./GroupChatPanel.module.css";
import { createGroup } from "../../api/chat/groups";

/**
 * 그룹 채팅 목록 및 선택
 * @param {array} groups - 그룹 목록
 * @param {number} activeGroupId - 현재 활성 그룹 ID
 * @param {function} onSelectGroup - 그룹 선택 핸들러
 * @param {function} onRefresh - 새로고침 핸들러
 */
export default function GroupChatList({
  groups,
  activeGroupId,
  onSelectGroup,
  onRefresh,
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateGroup = async () => {
    const name = groupName.trim();
    if (!name) {
      alert("그룹명을 입력하세요");
      return;
    }

    setIsCreating(true);
    try {
      const data = await createGroup({
        name,
        description: groupDesc.trim() || undefined,
      });

      if (data?.success) {
        setGroupName("");
        setGroupDesc("");
        setShowCreateModal(false);
        onRefresh();
      } else {
        alert(data?.message || "그룹 생성 실패");
      }
    } catch (err) {
      console.error("Create group error:", err);
      alert("그룹 생성 중 오류 발생");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <aside className={Style.sidebar}>
      <div className={Style.sidebarHeader}>
        <h3>그룹 채팅</h3>
        <button className={Style.refresh} onClick={onRefresh}>
          새로고침
        </button>
      </div>

      <button
        className={Style.createGroupBtn}
        onClick={() => setShowCreateModal(true)}
      >
        + 그룹 생성
      </button>

      <div className={Style.roomList}>
        {groups.length === 0 ? (
          <div className={Style.emptyText}>그룹이 없어요</div>
        ) : (
          groups.map((group) => (
            <button
              key={group.group_id}
              className={`${Style.roomItem} ${
                activeGroupId === group.group_id ? Style.roomItemActive : ""
              }`}
              onClick={() => onSelectGroup(group.group_id)}
            >
              <div className={Style.roomTitle}>{group.name}</div>
              <div className={Style.roomLast}>
                {group.member_count && (
                  <span>👥 {group.member_count}명</span>
                )}
                {group.last_message && (
                  <span>{group.last_message}</span>
                )}
                {!group.last_message && !group.member_count && (
                  <span>메시지 없음</span>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className={Style.modal}>
          <div className={Style.modalContent}>
            <h4>새 그룹 생성</h4>
            <div className={Style.formGroup}>
              <label>그룹명</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="그룹명을 입력하세요"
                className={Style.modalInput}
              />
            </div>
            <div className={Style.formGroup}>
              <label>설명 (선택)</label>
              <textarea
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                placeholder="그룹 설명을 입력하세요"
                className={Style.modalTextarea}
              />
            </div>
            <div className={Style.modalButtons}>
              <button
                className={Style.cancelBtn}
                onClick={() => {
                  setShowCreateModal(false);
                  setGroupName("");
                  setGroupDesc("");
                }}
                disabled={isCreating}
              >
                취소
              </button>
              <button
                className={Style.confirmBtn}
                onClick={handleCreateGroup}
                disabled={isCreating}
              >
                {isCreating ? "생성 중..." : "생성"}
              </button>
            </div>
          </div>
          <div
            className={Style.modalBackdrop}
            onClick={() => {
              setShowCreateModal(false);
              setGroupName("");
              setGroupDesc("");
            }}
          />
        </div>
      )}
    </aside>
  );
}
