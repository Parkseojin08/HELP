/**
 * 그룹 채팅 API
 */

const API_BASE = "http://localhost:5000/api/chat";

/**
 * 그룹 목록 조회
 */
export async function listGroups() {
  try {
    const res = await fetch(`${API_BASE}/groups`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return { success: false, message: `HTTP ${res.status}` };
    return await res.json();
  } catch (err) {
    console.error("[listGroups] error:", err);
    return { success: false, message: err.message };
  }
}

/**
 * 그룹 상세 정보 조회
 * @param {number} groupId - 그룹 ID
 */
export async function getGroupDetail(groupId) {
  try {
    const res = await fetch(`${API_BASE}/groups/${groupId}`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return { success: false, message: `HTTP ${res.status}` };
    return await res.json();
  } catch (err) {
    console.error("[getGroupDetail] error:", err);
    return { success: false, message: err.message };
  }
}

/**
 * 그룹 생성
 * @param {object} groupData - { name, description? }
 */
export async function createGroup(groupData) {
  try {
    const res = await fetch(`${API_BASE}/groups`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(groupData),
    });
    if (!res.ok) return { success: false, message: `HTTP ${res.status}` };
    return await res.json();
  } catch (err) {
    console.error("[createGroup] error:", err);
    return { success: false, message: err.message };
  }
}

/**
 * 그룹 메시지 조회
 * @param {number} groupId - 그룹 ID
 * @param {object} options - { limit?, offset? }
 */
export async function getGroupMessages(groupId, options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.limit) params.append("limit", options.limit);
    if (options.offset) params.append("offset", options.offset);
    
    const queryStr = params.toString();
    const url = `${API_BASE}/groups/${groupId}/messages${queryStr ? `?${queryStr}` : ""}`;
    
    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return { success: false, message: `HTTP ${res.status}` };
    return await res.json();
  } catch (err) {
    console.error("[getGroupMessages] error:", err);
    return { success: false, message: err.message };
  }
}

/**
 * 그룹 메시지 읽음 표시
 * @param {number} groupId - 그룹 ID
 * @param {number} messageId - 메시지 ID
 */
export async function markGroupMessageRead(groupId, messageId) {
  try {
    const res = await fetch(`${API_BASE}/groups/${groupId}/messages/${messageId}/read`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return { success: false, message: `HTTP ${res.status}` };
    return await res.json();
  } catch (err) {
    console.error("[markGroupMessageRead] error:", err);
    return { success: false, message: err.message };
  }
}
