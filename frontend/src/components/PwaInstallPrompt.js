import React, { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    // Listen for install prompt
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); setShow(true); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 bg-slate-800 border border-emerald-500/30 rounded-xl p-4 shadow-2xl max-w-[280px] animate-in slide-in-from-bottom-4" data-testid="pwa-install-prompt">
      <button onClick={() => setShow(false)} className="absolute top-2 right-2 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center"><Download className="w-5 h-5 text-emerald-400" /></div>
        <div>
          <p className="text-white font-medium text-sm">安装到桌面</p>
          <p className="text-slate-400 text-xs">离线也能用</p>
        </div>
      </div>
      <Button onClick={handleInstall} className="w-full bg-emerald-500 hover:bg-emerald-600 text-sm" data-testid="pwa-install-btn">安装</Button>
    </div>
  );
}
