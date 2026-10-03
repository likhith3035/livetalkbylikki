import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Key,
  Shield,
  Sparkles,
  CheckCircle2,
  Trash2,
  Cpu,
  Zap,
  ClipboardPaste,
  RefreshCw,
  Layers,
  Check,
  Gift,
  ExternalLink,
} from "lucide-react";
import {
  AIProvider,
  StudioAPIKeys,
  detectKeyProvider,
  getAutoDetectedAPIKeys,
  saveDetectedAPIKey,
  removeAPIKey,
  scanAllKeySources,
  detectKeyFromClipboard,
  DetectedSourceInfo,
} from "../services/apiKeyDetectionService";
import {
  isOpenModelsEnabled,
  setOpenModelsEnabled,
  getSelectedOpenModelId,
  setSelectedOpenModelId,
  VERIFIED_OPEN_MODELS,
  autoRecognizeOpenModel,
} from "../services/openModelService";
import { toast } from "sonner";

interface CodeStudioKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysChanged: () => void;
}

export const CodeStudioKeyModal: React.FC<CodeStudioKeyModalProps> = ({
  isOpen,
  onClose,
  onKeysChanged,
}) => {
  const [keys, setKeys] = useState<StudioAPIKeys>({});
  const [sources, setSources] = useState<DetectedSourceInfo[]>([]);
  const [inputKey, setInputKey] = useState("");
  const [openModelsOn, setOpenModelsOn] = useState(true);
  const [selectedModel, setSelectedModel] = useState("");
  const [scanning, setScanning] = useState(false);

  const syncState = () => {
    const scan = scanAllKeySources();
    setKeys(scan.keys);
    setSources(scan.sources);
    setOpenModelsOn(isOpenModelsEnabled());
    setSelectedModel(getSelectedOpenModelId());
  };

  useEffect(() => {
    if (isOpen) {
      syncState();
    }
  }, [isOpen]);

  const detectedInfo = detectKeyProvider(inputKey);
  const recognizedOpen = autoRecognizeOpenModel(Boolean(keys.groq), Boolean(keys.openrouter));

  const handleSaveKey = () => {
    if (!inputKey.trim()) return;
    const detected = saveDetectedAPIKey(inputKey);
    toast.success(`Saved API key for ${detected.displayName}!`);
    setInputKey("");
    syncState();
    onKeysChanged();
  };

  const handleRemove = (provider: AIProvider) => {
    removeAPIKey(provider);
    syncState();
    toast.info(`Removed ${provider} API key`);
    onKeysChanged();
  };

  const handleToggleOpenModels = (checked: boolean) => {
    setOpenModelsOn(checked);
    setOpenModelsEnabled(checked, Boolean(keys.groq), Boolean(keys.openrouter));
    if (checked) {
      const rec = autoRecognizeOpenModel(Boolean(keys.groq), Boolean(keys.openrouter));
      setSelectedModel(rec.model.id);
      setSelectedOpenModelId(rec.model.id);
      toast.success(`🤖 Auto-Recognized Open Model: ${rec.model.name}!`);
    } else {
      toast.info("Open Model routing disabled");
    }
    onKeysChanged();
  };

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    setSelectedOpenModelId(modelId);
    toast.success("Active Open Model updated");
    onKeysChanged();
  };

  const handleScanClipboard = async () => {
    setScanning(true);
    try {
      const res = await detectKeyFromClipboard();
      if (res.success) {
        toast.success(res.message);
        syncState();
        onKeysChanged();
      } else {
        toast.error(res.message);
      }
    } finally {
      setScanning(false);
    }
  };

  const handleRescanSources = () => {
    setScanning(true);
    try {
      const scan = scanAllKeySources();
      setKeys(scan.keys);
      setSources(scan.sources);
      toast.success(
        scan.sources.length > 0
          ? `Discovered ${scan.sources.length} keys across storage, environment & URL!`
          : "Scanned all sources. No additional keys found."
      );
      onKeysChanged();
    } finally {
      setScanning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[94vw] sm:max-w-lg p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card/95 backdrop-blur-2xl border border-border/60 shadow-2xl text-left max-h-[90vh] overflow-y-auto font-sans">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#f0be65] via-[#e5a83b] to-[#d48c18] text-stone-950 flex items-center justify-center shadow-md">
              <Key className="w-4 h-4" />
            </span>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-foreground">
                AI Keys & Open Model Recognition
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Auto-detects keys from shared app storage, environment, or clipboard.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 1. Open Models Auto-Recognition Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-yellow-500/10 border border-primary/30 my-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-primary" />
                <span>Auto-Recognize Open Models</span>
              </span>
              <p className="text-[11px] text-muted-foreground">
                Automatically routes code tasks to top open-weights (DeepSeek R1, Qwen 2.5 Coder, Llama 3.3).
              </p>
            </div>

            <Switch
              checked={openModelsOn}
              onCheckedChange={handleToggleOpenModels}
              aria-label="Toggle open models"
            />
          </div>

          {openModelsOn && (
            <div className="space-y-2 pt-2 border-t border-primary/20">
              {/* Live auto-recognition highlight banner */}
              <div className="p-2.5 rounded-xl bg-background/80 border border-emerald-500/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <div className="min-w-0">
                    <span className="font-black text-xs text-foreground truncate block">
                      Auto-Recognized: {recognizedOpen.model.name}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium truncate block">
                      {recognizedOpen.reason}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 shrink-0">
                  {recognizedOpen.speed}
                </span>
              </div>

              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Or Select Preferred Open Model
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {VERIFIED_OPEN_MODELS.map((m) => {
                  const isSelected = selectedModel === m.id;
                  const isAutoRecognized = recognizedOpen.model.id === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleSelectModel(m.id)}
                      className={`p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? "bg-primary/15 border-primary text-foreground font-bold shadow-sm"
                          : "bg-background/60 border-border/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate">{m.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {isAutoRecognized && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                              Auto
                            </span>
                          )}
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground block truncate">
                        {m.recommendedFor}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. Quick Actions: Auto-Detect from Clipboard & Rescan Sources */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleScanClipboard}
            disabled={scanning}
            className="flex-1 h-8 text-xs font-bold gap-1.5 border-dashed border-primary/50 text-primary hover:bg-primary/10 cursor-pointer"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>Auto-Detect From Clipboard</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRescanSources}
            disabled={scanning}
            className="h-8 px-2.5 text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Rescan shared app storage & environment"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Rescan Sources</span>
          </Button>
        </div>

        {/* 🎁 Free ₹100 Sarvam AI Key Banner */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-purple-500/15 border border-amber-500/30 text-xs space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <Gift className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>Get ₹100 Free AI Key (Sarvam AI)</span>
            </div>
            <a
              href="https://dashboard.sarvam.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-extrabold text-amber-400 hover:underline flex items-center gap-1 bg-amber-500/20 px-2 py-0.5 rounded-lg"
            >
              <span>dashboard.sarvam.ai</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-[11px] text-foreground/80 leading-relaxed">
            Want free AI credits? Sign up on <strong>Sarvam AI</strong> with any email (or temp mail) to receive <strong>₹100 worth of free API credits</strong>! Create a secret key in <em>API Keys</em> tab and paste it below.
          </p>
        </div>

        {/* 3. Smart Paste & Auto-Detect Key Input */}
        <div className="space-y-2 mb-3">
          <Label className="text-xs font-bold text-foreground">
            Paste API Key (Auto-Detects Provider)
          </Label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="Paste Sarvam AI key, sk-proj-..., AIzaSy..., or gsk_..."
                className="h-9 font-mono text-xs pr-24 bg-background/80 border-border/60"
              />
              {detectedInfo.provider !== "unknown" && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  {detectedInfo.displayName.split(" ")[0]}
                </span>
              )}
            </div>

            <Button
              onClick={handleSaveKey}
              disabled={!inputKey.trim()}
              size="sm"
              className="h-9 px-3.5 bg-primary text-primary-foreground font-bold text-xs cursor-pointer shadow-md"
            >
              Save Key
            </Button>
          </div>

          {inputKey.trim() && (
            <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recognized format: {detectedInfo.displayName}</span>
            </p>
          )}
        </div>

        {/* 4. Auto-Detected Sources List */}
        {sources.length > 0 && (
          <div className="mb-3 space-y-1.5">
            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Auto-Detected Sources ({sources.length})
            </Label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {sources.map((src, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-muted/60 border border-border/50 text-foreground font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="font-bold capitalize">{src.provider}:</span>
                  <span className="text-muted-foreground truncate max-w-[150px]">{src.sourceName}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 5. Active Synchronized Keys List */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-foreground">Active Synchronized Keys</Label>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {(["sarvam", "gemini", "groq", "openrouter", "openai", "claude", "deepseek"] as AIProvider[]).map((prov) => {
              const activeVal = keys[prov];
              return (
                <div
                  key={prov}
                  className="flex items-center justify-between p-2 rounded-xl bg-muted/40 border border-border/50 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full ${activeVal ? "bg-emerald-400" : "bg-muted-foreground/30"}`} />
                    <span className="font-bold text-foreground capitalize truncate">
                      {prov === "sarvam" ? "Sarvam AI (₹100 Free)" : prov}
                    </span>
                    {activeVal ? (
                      <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[120px]">
                        ••••{activeVal.slice(-4)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">Not set</span>
                    )}
                  </div>

                  {activeVal && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(prov)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-red-400 cursor-pointer"
                      title={`Remove ${prov} key`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Privacy Note */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/20 border border-border/40 text-[10px] text-muted-foreground mt-3">
          <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            API keys are strictly stored on your local browser (LocalStorage). Never uploaded to any external server.
          </span>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-border/40">
          <Button onClick={onClose} size="sm" className="cursor-pointer text-xs font-bold">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
