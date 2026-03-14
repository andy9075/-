import React, { useState, useEffect, useRef } from "react";
import { Video, Upload, Trash2, Edit, Circle, Square, Play, Download, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import axios, { API } from "@/lib/api";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "pos", label: "POS 收银" },
  { value: "products", label: "商品管理" },
  { value: "inventory", label: "库存管理" },
  { value: "sales", label: "销售管理" },
  { value: "customers", label: "客户管理" },
  { value: "reports", label: "报表" },
  { value: "settings", label: "系统设置" },
  { value: "general", label: "其他" },
];

export default function VideoTutorialsPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editVideo, setEditVideo] = useState(null);
  const [playVideo, setPlayVideo] = useState(null);
  const [recordTime, setRecordTime] = useState(0);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  const fetchVideos = () => { axios.get(`${API}/videos`).then(r => setVideos(r.data)).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { fetchVideos(); }, []);

  // Screen Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" }, audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setRecordedChunks(chunksRef.current);
        setPreviewUrl(URL.createObjectURL(blob));
        setShowPreview(true);
        setRecording(false);
        clearInterval(timerRef.current);
      };
      // If user stops sharing, also stop recording
      stream.getVideoTracks()[0].onended = () => { if (recorder.state === "recording") recorder.stop(); };
      recorder.start(1000);
      setMediaRecorder(recorder);
      setRecording(true);
      setRecordTime(0);
      timerRef.current = setInterval(() => setRecordTime(t => t + 1), 1000);
      toast.success("录屏开始！操作完成后点击停止");
    } catch (e) {
      if (e.name !== "NotAllowedError") toast.error("无法启动录屏: " + e.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
  };

  const uploadRecording = async (title, category) => {
    if (recordedChunks.length === 0) return;
    setUploading(true);
    try {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const formData = new FormData();
      formData.append("file", blob, `${title || 'tutorial'}.webm`);
      const res = await axios.post(`${API}/videos/upload`, formData, { headers: { "Content-Type": "multipart/form-data" }, timeout: 120000 });
      // Update title and category
      if (title || category) {
        await axios.put(`${API}/videos/${res.data.id}`, { title, category: category || "general" });
      }
      toast.success("视频上传成功！");
      setShowPreview(false);
      setRecordedChunks([]);
      setPreviewUrl(null);
      fetchVideos();
    } catch (e) {
      toast.error("上传失败: " + (e.response?.data?.detail || e.message));
    } finally {
      setUploading(false);
    }
  };

  // File upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(`${API}/videos/upload`, formData, { headers: { "Content-Type": "multipart/form-data" }, timeout: 120000 });
      toast.success("视频上传成功！");
      fetchVideos();
    } catch (err) {
      toast.error("上传失败: " + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("确定删除此视频？")) return;
    try { await axios.delete(`${API}/videos/${id}`); fetchVideos(); toast.success("已删除"); } catch { toast.error("删除失败"); }
  };

  const handleUpdateVideo = async () => {
    if (!editVideo) return;
    try {
      await axios.put(`${API}/videos/${editVideo.id}`, { title: editVideo.title, category: editVideo.category });
      setEditVideo(null);
      fetchVideos();
      toast.success("已更新");
    } catch { toast.error("更新失败"); }
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const formatSize = (bytes) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  const getCatLabel = (val) => CATEGORIES.find(c => c.value === val)?.label || val;

  return (
    <div className="space-y-6" data-testid="video-tutorials-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Video className="w-6 h-6 text-red-400" /> 视频教程管理
        </h1>
        <div className="flex gap-2">
          {!recording ? (
            <Button onClick={startRecording} className="bg-red-500 hover:bg-red-600" data-testid="start-recording-btn">
              <Circle className="w-4 h-4 mr-2 fill-current" /> 开始录屏
            </Button>
          ) : (
            <Button onClick={stopRecording} className="bg-red-600 hover:bg-red-700 animate-pulse" data-testid="stop-recording-btn">
              <Square className="w-4 h-4 mr-2 fill-current" /> 停止录屏 ({formatTime(recordTime)})
            </Button>
          )}
          <label className="cursor-pointer">
            <Button asChild variant="outline" className="border-slate-600 text-slate-300" disabled={uploading}>
              <span><Upload className="w-4 h-4 mr-2" /> {uploading ? "上传中..." : "上传视频"}</span>
            </Button>
            <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" data-testid="upload-video-input" />
          </label>
        </div>
      </div>

      {/* Recording info */}
      {recording && (
        <Card className="bg-red-500/10 border-red-500/30 animate-pulse">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
            <span className="text-red-400 font-medium">正在录屏... {formatTime(recordTime)}</span>
            <span className="text-slate-400 text-sm">请操作您要演示的功能，完成后点击"停止录屏"</span>
          </CardContent>
        </Card>
      )}

      {/* Video Grid */}
      {videos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map(v => (
            <Card key={v.id} className="bg-slate-800 border-slate-700 overflow-hidden group hover:border-slate-600 transition-colors">
              <div className="relative aspect-video bg-slate-900 flex items-center justify-center cursor-pointer" onClick={() => setPlayVideo(v)} data-testid={`video-play-${v.id}`}>
                <video src={`${API.replace('/api', '')}${v.url}`} className="w-full h-full object-cover" preload="metadata" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-12 h-12 text-white fill-white" />
                </div>
              </div>
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{v.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">{getCatLabel(v.category)}</Badge>
                      <span className="text-xs text-slate-500">{formatSize(v.size || 0)}</span>
                      <span className="text-xs text-slate-500">{new Date(v.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditVideo({...v})} className="text-blue-400 hover:text-blue-300 h-7 w-7 p-0"><Edit className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(v.id)} className="text-red-400 hover:text-red-300 h-7 w-7 p-0"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !loading && (
        <div className="text-center py-16">
          <FolderOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">还没有视频教程</p>
          <p className="text-slate-500 text-sm mt-1">点击 <strong>"开始录屏"</strong> 录制操作教程，或 <strong>"上传视频"</strong> 上传已有视频</p>
        </div>
      )}

      {/* Preview recorded video */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader><DialogTitle>录屏预览</DialogTitle></DialogHeader>
          <PreviewUpload previewUrl={previewUrl} onUpload={uploadRecording} uploading={uploading} />
        </DialogContent>
      </Dialog>

      {/* Play video */}
      <Dialog open={!!playVideo} onOpenChange={() => setPlayVideo(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-4xl p-0">
          {playVideo && (
            <div>
              <video src={`${API.replace('/api', '')}${playVideo.url}`} controls autoPlay className="w-full rounded-t-lg" />
              <div className="p-4">
                <h3 className="text-white font-medium">{playVideo.title}</h3>
                <p className="text-slate-400 text-sm mt-1">{getCatLabel(playVideo.category)} · {new Date(playVideo.created_at).toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit video */}
      <Dialog open={!!editVideo} onOpenChange={() => setEditVideo(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle>编辑视频信息</DialogTitle></DialogHeader>
          {editVideo && (
            <div className="space-y-4">
              <div><label className="text-xs text-slate-400">标题</label><Input value={editVideo.title} onChange={e => setEditVideo({...editVideo, title: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="edit-video-title" /></div>
              <div><label className="text-xs text-slate-400">分类</label>
                <Select value={editVideo.category || "general"} onValueChange={v => setEditVideo({...editVideo, category: v})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={handleUpdateVideo} className="w-full bg-emerald-500 hover:bg-emerald-600">保存</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sub-component for preview + upload form
function PreviewUpload({ previewUrl, onUpload, uploading }) {
  const [title, setTitle] = useState("教程视频");
  const [category, setCategory] = useState("general");
  return (
    <div className="space-y-4">
      {previewUrl && <video src={previewUrl} controls className="w-full rounded-lg max-h-96" />}
      <div><label className="text-xs text-slate-400">视频标题</label><Input value={title} onChange={e => setTitle(e.target.value)} className="bg-slate-700 border-slate-600" data-testid="preview-video-title" /></div>
      <div><label className="text-xs text-slate-400">分类</label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger>
          <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Button onClick={() => onUpload(title, category)} disabled={uploading} className="w-full bg-emerald-500 hover:bg-emerald-600" data-testid="upload-recorded-btn">
        <Upload className="w-4 h-4 mr-2" /> {uploading ? "上传中..." : "保存并上传"}
      </Button>
    </div>
  );
}
