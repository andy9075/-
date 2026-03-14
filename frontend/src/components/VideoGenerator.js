import React, { useState, useRef, useCallback } from "react";
import { Video, Loader2, Check, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import axios, { API } from "@/lib/api";
import { toast } from "sonner";

// All tutorial sections data
const TUTORIALS = [
  {
    category: "pos",
    title: "POS 收银操作教程",
    steps: [
      { title: "进入POS", text: "点击侧边栏 POS 按钮\n进入收银界面" },
      { title: "登录", text: "输入用户名和密码\n选择所在门店" },
      { title: "开始班次", text: "输入开班现金金额\n点击确认开始" },
      { title: "添加商品", text: "扫描条码或搜索商品\n商品自动添加到购物车\n\n快捷键: F1 搜索" },
      { title: "结算 (F9)", text: "按 F9 结算\n选择支付方式\n输入收款金额\n确认完成" },
      { title: "快捷键一览", text: "F1 搜索商品  F2 库存查询\nF3 清空购物车  F4 挂单\nF9 结算  F10 取单\nF11 退款  Esc 关闭" },
    ]
  },
  {
    category: "products",
    title: "商品管理教程",
    steps: [
      { title: "进入商品管理", text: "侧边栏 → 商品管理 → 商品管理" },
      { title: "添加商品", text: "点击 添加商品 按钮\n填写编码、名称、分类" },
      { title: "设置价格", text: "成本价 → 自动计算利润率\n价格1(零售) 价格2(会员) 价格3(批发)" },
      { title: "设置税率", text: "选择IVA税率:\n16% General\n8% Reducido\n0% Exento" },
      { title: "上传图片", text: "点击上传区域\n选择商品图片\n支持 JPG/PNG 格式" },
      { title: "完成", text: "点击保存\n商品创建成功！" },
    ]
  },
  {
    category: "inventory",
    title: "库存管理教程",
    steps: [
      { title: "仓库管理", text: "侧边栏 → 仓库管理\n创建和管理仓库" },
      { title: "库存查询", text: "POS中按 F2\n快速查看各仓库库存" },
      { title: "库存调拨", text: "仓库 → 调拨管理\n选择源仓库和目标仓库\n添加商品和数量" },
      { title: "库存盘点", text: "仓库 → 库存盘点\n选择仓库\n输入实际数量\n系统自动计算差异" },
      { title: "库存预警", text: "仓库 → 库存预警\n自动显示低库存商品\n可快速创建采购单" },
    ]
  },
  {
    category: "customers",
    title: "客户管理教程",
    steps: [
      { title: "客户管理", text: "侧边栏 → 客户管理\n添加和管理客户信息" },
      { title: "添加客户", text: "点击添加按钮\n填写姓名、电话、邮箱" },
      { title: "积分系统", text: "消费自动积分\n$1 = 1积分\n100积分 = $1\nPOS结算时可抵扣" },
      { title: "VIP等级", text: "根据消费金额自动升级\n不同等级享不同优惠" },
    ]
  },
  {
    category: "sales",
    title: "销售与退款教程",
    steps: [
      { title: "销售记录", text: "侧边栏 → 销售管理\n查看所有销售记录\n可按日期/门店筛选" },
      { title: "退款操作", text: "POS中按 F11\n输入订单号搜索\n查看订单详情" },
      { title: "选择退款商品", text: "勾选要退款的商品\n支持部分退款\n输入退款原因" },
      { title: "确认退款", text: "点击退款按钮\n库存自动回退\n金额自动退还" },
      { title: "注意事项", text: "退款需要管理员授权\n在员工管理中勾选退款权限" },
    ]
  },
  {
    category: "reports",
    title: "报表与分析教程",
    steps: [
      { title: "仪表盘", text: "登录后默认显示\n今日销售额、趋势、热销商品" },
      { title: "销售报表", text: "报表 → 销售报表\n按日期筛选\n支持导出Excel" },
      { title: "税务报表", text: "报表 → Reporte Fiscal\n选择日期范围\n查看IVA分税率明细\n支持CSV导出" },
      { title: "利润分析", text: "报表 → 利润分析\n成本与收入对比\n商品毛利排行" },
    ]
  },
  {
    category: "settings",
    title: "系统设置教程",
    steps: [
      { title: "公司信息", text: "系统设置 → 公司信息\n填写公司名、RIF税号\n地址、电话" },
      { title: "税务设置", text: "IVA/Impuestos 卡片\n设置默认税率\n启用/禁用IVA" },
      { title: "打印设置", text: "选择默认打印格式:\n80mm 热敏小票\nA4 发票\nFiscal SENIAT\n针式打印机" },
      { title: "员工权限", text: "人事 → 员工管理\n添加员工\n勾选每个权限\n设置最大折扣%" },
    ]
  },
];

// Canvas video generator
function generateVideoFromSteps(title, steps, onProgress) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9", videoBitsPerSecond: 2000000 });
    const chunks = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      resolve(blob);
    };
    recorder.onerror = reject;
    recorder.start(100);

    const totalFrames = steps.length * 120 + 90; // ~4s per step + 3s intro at 30fps
    let frame = 0;

    function drawFrame() {
      if (frame >= totalFrames) {
        recorder.stop();
        return;
      }

      // Clear
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, 1280, 720);

      // Progress bar
      const progress = frame / totalFrames;
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 710, 1280, 10);
      ctx.fillStyle = "#10b981";
      ctx.fillRect(0, 710, 1280 * progress, 10);

      if (frame < 90) {
        // Title slide (3 seconds)
        const titleAlpha = Math.min(1, frame / 30);
        ctx.globalAlpha = titleAlpha;

        // Logo area
        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.roundRect(565, 200, 150, 150, 20);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 60px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("S", 640, 300);

        // Title
        ctx.fillStyle = "#f8fafc";
        ctx.font = "bold 36px sans-serif";
        ctx.fillText(title, 640, 430);

        ctx.fillStyle = "#64748b";
        ctx.font = "20px sans-serif";
        ctx.fillText("Sellox POS System", 640, 470);

        ctx.globalAlpha = 1;
      } else {
        // Step slides
        const stepFrame = frame - 90;
        const stepIndex = Math.min(Math.floor(stepFrame / 120), steps.length - 1);
        const localFrame = stepFrame - stepIndex * 120;
        const step = steps[stepIndex];

        // Step number badge
        const slideAlpha = localFrame < 15 ? localFrame / 15 : (localFrame > 105 ? (120 - localFrame) / 15 : 1);
        ctx.globalAlpha = Math.max(0, Math.min(1, slideAlpha));

        // Step indicator
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.roundRect(40, 30, 1200, 60, 10);
        ctx.fill();

        ctx.fillStyle = "#475569";
        ctx.font = "16px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`步骤 ${stepIndex + 1} / ${steps.length}`, 60, 67);

        // Step dots
        for (let i = 0; i < steps.length; i++) {
          ctx.fillStyle = i <= stepIndex ? "#10b981" : "#334155";
          ctx.beginPath();
          ctx.arc(400 + i * 30, 60, 8, 0, Math.PI * 2);
          ctx.fill();
        }

        // Main content area
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.roundRect(80, 120, 1120, 560, 16);
        ctx.fill();

        // Step number circle
        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.arc(200, 250, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 40px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(stepIndex + 1), 200, 265);

        // Step title
        const titleSlide = Math.min(1, Math.max(0, (localFrame - 5) / 15));
        ctx.globalAlpha = Math.max(0, Math.min(1, slideAlpha * titleSlide));
        ctx.fillStyle = "#f8fafc";
        ctx.font = "bold 32px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(step.title, 280, 260);

        // Divider
        ctx.fillStyle = "#10b981";
        ctx.fillRect(280, 280, 200, 3);

        // Step text with line breaks
        const textSlide = Math.min(1, Math.max(0, (localFrame - 15) / 20));
        ctx.globalAlpha = Math.max(0, Math.min(1, slideAlpha * textSlide));
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "24px sans-serif";
        const lines = step.text.split("\n");
        lines.forEach((line, i) => {
          ctx.fillText(line, 280, 330 + i * 40);
        });

        ctx.globalAlpha = 1;
      }

      // Watermark
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#475569";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("Sellox POS - Tutorial", 1250, 700);
      ctx.globalAlpha = 1;

      onProgress(Math.round(progress * 100));
      frame++;
      requestAnimationFrame(drawFrame);
    }

    drawFrame();
  });
}

export default function VideoGenerator({ onComplete }) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({});
  const [completed, setCompleted] = useState({});
  const [showDialog, setShowDialog] = useState(false);

  const generateAll = async () => {
    setGenerating(true);
    setShowDialog(true);
    const results = {};

    for (let i = 0; i < TUTORIALS.length; i++) {
      const tutorial = TUTORIALS[i];
      const key = tutorial.category;
      setProgress(p => ({ ...p, [key]: 0 }));

      try {
        const blob = await generateVideoFromSteps(
          tutorial.title,
          tutorial.steps,
          (pct) => setProgress(p => ({ ...p, [key]: pct }))
        );

        // Upload to server
        const formData = new FormData();
        formData.append("file", blob, `${tutorial.title}.webm`);
        const res = await axios.post(`${API}/videos/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 60000
        });
        // Update title and category
        await axios.put(`${API}/videos/${res.data.id}`, {
          title: tutorial.title,
          category: tutorial.category
        });

        results[key] = true;
        setCompleted(c => ({ ...c, [key]: true }));
      } catch (e) {
        console.error(`Failed to generate ${tutorial.title}:`, e);
        results[key] = false;
        setCompleted(c => ({ ...c, [key]: "error" }));
      }
    }

    setGenerating(false);
    const successCount = Object.values(results).filter(v => v === true).length;
    toast.success(`已生成 ${successCount}/${TUTORIALS.length} 个视频教程`);
    if (onComplete) onComplete();
  };

  const generateOne = async (tutorial) => {
    const key = tutorial.category;
    setGenerating(true);
    setShowDialog(true);
    setProgress(p => ({ ...p, [key]: 0 }));

    try {
      const blob = await generateVideoFromSteps(
        tutorial.title,
        tutorial.steps,
        (pct) => setProgress(p => ({ ...p, [key]: pct }))
      );
      const formData = new FormData();
      formData.append("file", blob, `${tutorial.title}.webm`);
      const res = await axios.post(`${API}/videos/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000
      });
      await axios.put(`${API}/videos/${res.data.id}`, {
        title: tutorial.title,
        category: tutorial.category
      });
      setCompleted(c => ({ ...c, [key]: true }));
      toast.success(`${tutorial.title} 生成完成`);
      if (onComplete) onComplete();
    } catch (e) {
      setCompleted(c => ({ ...c, [key]: "error" }));
      toast.error(`生成失败: ${e.message}`);
    }
    setGenerating(false);
  };

  return (
    <>
      <Button onClick={generateAll} disabled={generating} className="bg-purple-500 hover:bg-purple-600" data-testid="generate-all-videos-btn">
        <Video className="w-4 h-4 mr-2" /> {generating ? "生成中..." : "从手册生成全部视频"}
      </Button>

      <Dialog open={showDialog} onOpenChange={v => { if (!generating) setShowDialog(v); }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Video className="w-5 h-5 text-purple-400" /> 视频生成进度</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {TUTORIALS.map(t => {
              const key = t.category;
              const pct = progress[key];
              const done = completed[key];
              return (
                <div key={key} className="flex items-center gap-3 p-2 bg-slate-700/50 rounded-lg">
                  {done === true ? (
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  ) : done === "error" ? (
                    <span className="text-red-400 text-xs flex-shrink-0">失败</span>
                  ) : pct !== undefined ? (
                    <Loader2 className="w-5 h-5 text-purple-400 animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-600 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{t.title}</p>
                    {pct !== undefined && !done && (
                      <div className="w-full bg-slate-600 rounded-full h-1.5 mt-1">
                        <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                  {!done && !generating && (
                    <Button size="sm" variant="ghost" onClick={() => generateOne(t)} className="text-purple-400 hover:text-purple-300 h-7 px-2 text-xs">
                      <Play className="w-3 h-3 mr-1" /> 生成
                    </Button>
                  )}
                  {pct !== undefined && !done && <span className="text-xs text-slate-400">{pct}%</span>}
                </div>
              );
            })}
          </div>
          {!generating && (
            <Button onClick={() => setShowDialog(false)} variant="outline" className="w-full border-slate-600 text-slate-300 mt-2">关闭</Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export { TUTORIALS };
