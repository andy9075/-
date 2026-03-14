import React, { useState, useEffect, useRef } from "react";
import { Video, Loader2, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import axios, { API } from "@/lib/api";
import { toast } from "sonner";

const TUTORIALS = [
  { name: "POS 收银操作教程", category: "pos" },
  { name: "商品管理教程", category: "products" },
  { name: "库存管理教程", category: "inventory" },
  { name: "销售与退款教程", category: "sales" },
  { name: "客户管理教程", category: "customers" },
  { name: "报表与分析教程", category: "reports" },
  { name: "系统设置教程", category: "settings" },
];

export default function VideoGenerator({ onComplete }) {
  const [generating, setGenerating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setShowDialog(true);
    setProgress(0);

    // Start progress animation (generation takes ~3-5 mins with TTS)
    timerRef.current = setInterval(() => {
      setProgress(p => Math.min(p + 1, 95));
    }, 3500);

    try {
      await axios.post(`${API}/videos/generate-tutorials`);
      toast.success("正在生成带语音解说的教程视频！包括录屏和中文旁白，请稍等3-5分钟...");

      // Poll for completion
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const res = await axios.get(`${API}/videos`);
          const tutorialVideos = res.data.filter(v =>
            v.title && TUTORIALS.some(t => v.title.includes(t.name.split("教程")[0]))
          );
          // Check if we got new videos (generated in last 5 minutes)
          const recent = tutorialVideos.filter(v => {
            const created = new Date(v.created_at);
            return (Date.now() - created.getTime()) < 5 * 60 * 1000;
          });
          if (recent.length >= 5 || attempts > 120) {
            clearInterval(pollInterval);
            clearInterval(timerRef.current);
            setProgress(100);
            setGenerating(false);
            if (recent.length > 0) {
              toast.success(`已生成 ${recent.length} 个带语音解说的教程视频！`);
            }
            if (onComplete) onComplete();
          }
        } catch {}
      }, 5000);
    } catch (e) {
      clearInterval(timerRef.current);
      setGenerating(false);
      toast.error("生成失败: " + (e.response?.data?.detail || e.message));
    }
  };

  return (
    <>
      <Button onClick={handleGenerate} disabled={generating} className="bg-red-500 hover:bg-red-600" data-testid="generate-all-videos-btn">
        {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Video className="w-4 h-4 mr-2" />}
        {generating ? "生成中..." : "生成语音解说教程"}
      </Button>

      <Dialog open={showDialog} onOpenChange={v => { if (!generating) setShowDialog(v); }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-red-400" /> 生成语音解说教程
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              系统正在自动录制真实操作并生成中文语音解说。流程：生成旁白音频 → 录制屏幕操作 → 合并为带解说的教程视频。
            </p>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>录制进度</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Tutorial list */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {TUTORIALS.map((t, i) => {
                const stepProgress = Math.floor(progress / (100 / TUTORIALS.length));
                const isDone = i < stepProgress;
                const isCurrent = i === stepProgress && generating;
                return (
                  <div key={t.category} className={`flex items-center gap-3 p-2 rounded-lg ${isCurrent ? 'bg-red-500/10 border border-red-500/30' : isDone ? 'bg-emerald-500/10' : 'bg-slate-700/30'}`}>
                    {isDone ? (
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : isCurrent ? (
                      <div className="w-4 h-4 flex-shrink-0">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-600 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${isDone ? 'text-emerald-400' : isCurrent ? 'text-red-400' : 'text-slate-400'}`}>
                      {t.name}
                    </span>
                    {isCurrent && <span className="text-xs text-red-400 ml-auto">录制中...</span>}
                  </div>
                );
              })}
            </div>

            {!generating && progress >= 95 && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center">
                <Check className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                <p className="text-emerald-400 font-medium">录制完成！</p>
                <p className="text-slate-400 text-xs mt-1">视频已保存，刷新页面查看</p>
              </div>
            )}

            {!generating && (
              <Button onClick={() => { setShowDialog(false); if (onComplete) onComplete(); }} variant="outline" className="w-full border-slate-600 text-slate-300">
                {progress >= 95 ? "完成" : "关闭"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { TUTORIALS };
