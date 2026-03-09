import { useState, useEffect, useRef } from "react";
import { useGroupChat, type GroupMessage } from "@/hooks/use-group-chat";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useOnlineCount } from "@/hooks/use-online-count";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Send, ArrowLeft, Globe, Lock, Crown, Hash,
  Copy, Check, MessageSquare, Sparkles, UserPlus, LogOut,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const GroupChatPage = () => {
  const onlineCount = useOnlineCount();
  const { toast } = useToast();
  const {
    sessionId, myName, messages, members, currentRoom, publicRooms, status,
    createRoom, joinRoom, joinLobby, sendMessage, reactToMessage, leaveRoom,
  } = useGroupChat();

  const [inputText, setInputText] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);

  // Create room form
  const [roomName, setRoomName] = useState("");
  const [roomTopic, setRoomTopic] = useState("");
  const [maxMembers, setMaxMembers] = useState(20);
  const [isPublic, setIsPublic] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    joinLobby();
  }, [joinLobby]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCreate = () => {
    const code = createRoom(roomName, roomTopic, maxMembers, isPublic);
    toast({ title: "🎉 Room created!", description: `Code: ${code}` });
    setShowCreate(false);
    setRoomName("");
    setRoomTopic("");
    setMaxMembers(20);
  };

  const handleJoin = () => {
    if (!joinCode.trim()) return;
    joinRoom(joinCode.toUpperCase());
    setJoinCode("");
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText("");
  };

  const copyCode = () => {
    if (!currentRoom) return;
    const url = `${window.location.origin}/group/${currentRoom.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: "Link copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Connected: Chat view ───
  if (status === "connected" && currentRoom) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-background">
        <div className="lg:hidden">
          <Header onlineCount={onlineCount} />
        </div>

        {/* Room header */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/90 backdrop-blur-xl px-4 py-3">
          <Button variant="ghost" size="icon" onClick={leaveRoom} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold truncate text-foreground">{currentRoom.name}</h2>
              {currentRoom.isPublic ? (
                <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
              ) : (
                <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {members.length}/{currentRoom.maxMembers} members · {currentRoom.topic}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={copyCode} className="gap-1.5 text-xs shrink-0">
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            Invite
          </Button>
        </div>

        {/* Members bar */}
        <div className="flex gap-2 px-4 py-2 border-b border-border/50 overflow-x-auto scrollbar-hide">
          {members.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium shrink-0 border",
                m.id === currentRoom.creatorId
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : "bg-secondary/50 border-border/50 text-muted-foreground"
              )}
            >
              {m.id === currentRoom.creatorId && <Crown className="h-3 w-3" />}
              <span className="max-w-[80px] truncate">{m.id === sessionId ? "You" : m.name}</span>
            </div>
          ))}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-3">
          <div className="space-y-3 pb-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.sender === "system" && "items-center max-w-full",
                    msg.sender === sessionId && "ml-auto items-end",
                    msg.sender !== sessionId && msg.sender !== "system" && "items-start"
                  )}
                >
                  {msg.sender === "system" ? (
                    <span className="text-[11px] text-muted-foreground bg-secondary/50 rounded-full px-3 py-1">
                      {msg.text}
                    </span>
                  ) : (
                    <>
                      {msg.sender !== sessionId && (
                        <span className="text-[11px] font-semibold text-primary mb-0.5 px-1">
                          {msg.senderName}
                        </span>
                      )}
                      <div
                        className={cn(
                          "rounded-[20px] px-4 py-2.5 text-[15px] leading-relaxed shadow-sm",
                          msg.sender === sessionId
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-secondary text-secondary-foreground rounded-bl-md"
                        )}
                      >
                        {msg.text}
                      </div>
                      {Object.keys(msg.reactions).length > 0 && (
                        <div className="flex gap-1 mt-1 px-1">
                          {Object.entries(msg.reactions).map(([emoji, users]) => (
                            <button
                              key={emoji}
                              onClick={() => reactToMessage(msg.id, emoji)}
                              className={cn(
                                "text-xs rounded-full px-1.5 py-0.5 border",
                                users.includes(sessionId)
                                  ? "bg-primary/10 border-primary/20"
                                  : "bg-secondary/50 border-border/50"
                              )}
                            >
                              {emoji} {users.length}
                            </button>
                          ))}
                        </div>
                      )}
                      <span className="text-[10px] text-muted-foreground/60 mt-0.5 px-1">
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="sticky bottom-0 border-t border-border bg-card/90 backdrop-blur-xl px-3 py-2.5 safe-area-bottom">
          <div className="flex items-center gap-2 max-w-3xl mx-auto">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Type a message..."
              className="flex-1 rounded-2xl border-border/60 bg-secondary/30 h-11 text-[15px]"
            />
            <Button
              onClick={handleSend}
              disabled={!inputText.trim()}
              size="icon"
              className="h-11 w-11 rounded-2xl shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <BottomNav />
      </div>
    );
  }

  // ─── Lobby view ───
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <div className="lg:hidden">
        <Header onlineCount={onlineCount} />
      </div>

      <div className="flex-1 px-4 sm:px-6 py-6 max-w-2xl mx-auto w-full space-y-6">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary">
            <Users className="h-3.5 w-3.5" /> Group Chat
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
            Chat with <span className="text-gradient">Multiple People</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Create or join group rooms — set your own limits!
          </p>
        </motion.div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button variant="glow" className="h-14 rounded-2xl gap-2 text-sm font-semibold">
                <Plus className="h-5 w-5" /> Create Room
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Group Room</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Room Name</label>
                  <Input
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="My Awesome Room"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Topic</label>
                  <Input
                    value={roomTopic}
                    onChange={(e) => setRoomTopic(e.target.value)}
                    placeholder="Gaming, Music, Movies..."
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Max Members: {maxMembers}
                  </label>
                  <input
                    type="range"
                    min={2}
                    max={50}
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>2</span><span>50</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-foreground">Visibility:</label>
                  <div className="flex gap-2">
                    <Button
                      variant={isPublic ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsPublic(true)}
                      className="gap-1.5 rounded-xl"
                    >
                      <Globe className="h-3.5 w-3.5" /> Public
                    </Button>
                    <Button
                      variant={!isPublic ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsPublic(false)}
                      className="gap-1.5 rounded-xl"
                    >
                      <Lock className="h-3.5 w-3.5" /> Private
                    </Button>
                  </div>
                </div>
                <Button onClick={handleCreate} variant="glow" className="w-full h-12 rounded-2xl gap-2">
                  <Sparkles className="h-4 w-4" /> Create Room
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                maxLength={6}
                className="rounded-xl font-mono tracking-widest text-center h-14 text-lg"
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
            </div>
          </div>
        </div>

        {joinCode.length === 6 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Button onClick={handleJoin} variant="outline" className="w-full h-11 rounded-2xl gap-2">
              <UserPlus className="h-4 w-4" /> Join Room {joinCode}
            </Button>
          </motion.div>
        )}

        {/* Public rooms */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Public Rooms</h2>
            <Badge variant="secondary" className="text-[10px]">{publicRooms.length}</Badge>
          </div>

          {publicRooms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-secondary/20 p-8 text-center">
              <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No public rooms yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Be the first to create one!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {publicRooms.map((room) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-4 hover:bg-card/70 transition-all"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                    <Hash className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">{room.name}</span>
                      <Crown className="h-3 w-3 text-primary/60 shrink-0" />
                      <span className="text-[10px] text-muted-foreground truncate">{room.creatorName}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{room.topic}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-muted-foreground">
                      {room.memberCount}/{room.maxMembers}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => joinRoom(room.id)}
                      disabled={room.memberCount >= room.maxMembers}
                      className="rounded-xl h-8 text-xs gap-1"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Join
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default GroupChatPage;
