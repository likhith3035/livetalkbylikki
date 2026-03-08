import { format } from "date-fns";
import type { Message } from "@/hooks/use-chat";

export function exportChatAsText(messages: Message[]): string {
  const lines = messages.map((msg) => {
    const time = format(msg.timestamp, "h:mm a");
    if (msg.sender === "system") return `--- ${msg.text} ---`;
    const name = msg.sender === "you"
      ? (msg.senderNickname?.trim() || "You")
      : (msg.senderNickname?.trim() || "Stranger");
    const content = msg.imageUrl ? `[Image] ${msg.text || ""}` : msg.text;
    return `[${time}] ${name}: ${content}`;
  });

  return `L Chat — ${format(new Date(), "MMM d, yyyy h:mm a")}\n${"─".repeat(40)}\n${lines.join("\n")}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function downloadAsFile(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
