export interface UserProfile {
  nickname: string;
  avatar: string;
  mood?: string;
}

export function getSessionId(): string {
  let id = localStorage.getItem("echo_session_id_v2");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("echo_session_id_v2", id);
  }
  return id;
}

export function getProfile(): UserProfile {
  try {
    const raw = localStorage.getItem("lchat.profile");
    if (raw) return JSON.parse(raw) as UserProfile;
  } catch {
    /* ignore read error */
  }
  return { nickname: "", avatar: "😀", mood: "" };
}

export function getBlockedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem("echo.blocked") || "[]");
  } catch {
    return [];
  }
}

export function addBlockedId(id: string): void {
  const blocked = getBlockedIds();
  if (!blocked.includes(id)) {
    blocked.push(id);
    localStorage.setItem("echo.blocked", JSON.stringify(blocked));
  }
}
