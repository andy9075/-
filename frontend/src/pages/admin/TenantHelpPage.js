import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight, Monitor, Package, Warehouse, Users, ShoppingCart, BarChart3, Settings, Globe, DollarSign, FileText, RotateCcw, Shield, CreditCard, Tag, Box, AlertCircle, ArrowLeftRight, Calendar, TrendingUp, Megaphone, Banknote, ClipboardList, Target, Clock, Bell, Video, Play, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axios, { API, BACKEND_URL } from "@/lib/api";

const Section = ({ icon: Icon, title, color, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <Card className="bg-slate-800 border-slate-700 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-700/50 transition-colors" data-testid={`help-section-${title.replace(/\s+/g, '-').toLowerCase()}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}><Icon className="w-4 h-4 text-white" /></div>
        <span className="text-white font-medium flex-1">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <CardContent className="pt-0 pb-4 px-4"><div className="text-sm text-slate-300 space-y-2 pl-11">{children}</div></CardContent>}
    </Card>
  );
};

const Step = ({ n, children }) => (
  <div className="flex gap-2 items-start">
    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">{n}</span>
    <span>{children}</span>
  </div>
);

const Key = ({ children }) => <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-xs text-emerald-400 font-mono">{children}</kbd>;

export default function TenantHelpPage() {
  const [videos, setVideos] = useState([]);
  const [playVideo, setPlayVideo] = useState(null);
  const printRef = useRef(null);

  useEffect(() => { axios.get(`${API}/videos`).then(r => setVideos(r.data)).catch(() => {}); }, []);

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-4" data-testid="tenant-help-page">
      <div className="flex items-center gap-3 mb-6">
        <img src="/sellox-logo.png" alt="Sellox" className="w-10 h-10 rounded-xl" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Sellox 使用手册</h1>
          <p className="text-slate-400 text-sm">门店操作指南 — 适用于商家管理员和员工</p>
        </div>
        <Button onClick={handleExportPDF} variant="outline" className="border-slate-600 text-slate-300 print:hidden" data-testid="export-manual-pdf">
          <Download className="w-4 h-4 mr-2" /> 导出PDF
        </Button>
      </div>

      {/* Video Tutorials Section */}
      {videos.length > 0 && (
        <div className="print:hidden">
          <p className="text-xs text-red-400 font-medium uppercase tracking-wide mb-2">视频教程</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {videos.map(v => (
              <Card key={v.id} className="bg-slate-800 border-slate-700 overflow-hidden group cursor-pointer hover:border-slate-600 transition-colors" onClick={() => setPlayVideo(v)} data-testid={`help-video-${v.id}`}>
                <div className="relative aspect-video bg-slate-900 flex items-center justify-center">
                  <video src={`${BACKEND_URL}${v.url}`} className="w-full h-full object-cover" preload="metadata" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-10 h-10 text-white fill-white" />
                  </div>
                </div>
                <CardContent className="p-2">
                  <p className="text-white text-sm font-medium truncate">{v.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Video player modal */}
          {playVideo && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPlayVideo(null)}>
              <div className="max-w-4xl w-full bg-slate-900 rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <video src={`${BACKEND_URL}${playVideo.url}`} controls autoPlay className="w-full" />
                <div className="p-3 flex items-center justify-between">
                  <span className="text-white font-medium">{playVideo.title}</span>
                  <Button size="sm" variant="ghost" onClick={() => setPlayVideo(null)} className="text-slate-400">关闭</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== POS收银 ===== */}
      <p className="text-xs text-emerald-400 font-medium uppercase tracking-wide">收银操作</p>

      <Section icon={Monitor} title="POS 收银台" color="bg-emerald-500">
        <p className="text-slate-400 mb-2">日常收银操作指南。</p>
        <Step n="1">点击侧边栏 <strong>POS</strong> 按钮进入收银界面</Step>
        <Step n="2">输入用户名和密码登录，选择所在门店</Step>
        <Step n="3"><strong>开始班次</strong> — 输入开班现金金额</Step>
        <Step n="4">扫描条码或搜索商品，商品会自动添加到购物车</Step>
        <Step n="5">按 <Key>F9</Key> 结算，选择支付方式，确认</Step>
        <div className="mt-3 p-3 bg-slate-900 rounded-lg">
          <p className="text-emerald-400 font-medium text-xs mb-2">快捷键：</p>
          <div className="grid grid-cols-2 gap-1">
            <p><Key>F1</Key> 搜索商品</p>
            <p><Key>F2</Key> 库存查询</p>
            <p><Key>F3</Key> 清空购物车</p>
            <p><Key>F4</Key> 挂单</p>
            <p><Key>F9</Key> 结算</p>
            <p><Key>F10</Key> 取单</p>
            <p><Key>F11</Key> 退款（需权限）</p>
            <p><Key>Esc</Key> 关闭弹窗</p>
          </div>
        </div>
        <div className="mt-2 p-3 bg-slate-900 rounded-lg">
          <p className="text-amber-400 font-medium text-xs mb-1">支付方式快捷键：</p>
          <p><Key>F5</Key> 现金 &nbsp; <Key>F6</Key> 刷卡 &nbsp; <Key>F7</Key> BioPago &nbsp; <Key>F8</Key> 转账</p>
        </div>
      </Section>

      <Section icon={Package} title="库存查询（F2）" color="bg-amber-500">
        <p className="text-slate-400 mb-2">在POS收银时快速查看商品库存。</p>
        <Step n="1">按 <Key>F2</Key> 或点击 <strong>F2 库存</strong> 按钮</Step>
        <Step n="2">搜索商品名称或编码</Step>
        <Step n="3">查看各仓库库存：数量、预留、可用</Step>
        <div className="mt-2 p-3 bg-slate-900 rounded-lg">
          <p className="text-xs"><span className="text-emerald-400">充足</span> = 库存正常 &nbsp; <span className="text-amber-400">偏低</span> = 低于最低库存 &nbsp; <span className="text-red-400">缺货</span> = 无库存</p>
        </div>
      </Section>

      <Section icon={RotateCcw} title="退款操作（F11）" color="bg-red-500">
        <p className="text-slate-400 mb-2">处理已完成订单的退款。<strong>需要管理员授予退款权限。</strong></p>
        <Step n="1">在POS中按 <Key>F11</Key>（需有退款权限）</Step>
        <Step n="2">输入订单号并点击 <strong>搜索</strong></Step>
        <Step n="3">查看完整订单详情</Step>
        <Step n="4">勾选/取消勾选要退款的商品（支持部分退款）</Step>
        <Step n="5">输入退款原因（可选），点击 <strong>退款</strong></Step>
        <p className="text-red-400 text-xs mt-2">注意：收银员默认无退款权限，需要管理员在员工管理中授权。</p>
      </Section>

      {/* ===== 商品管理 ===== */}
      <p className="text-xs text-blue-400 font-medium uppercase tracking-wide pt-2">商品管理</p>

      <Section icon={Package} title="商品管理" color="bg-blue-500">
        <Step n="1">进入 <strong>商品 → 商品管理</strong></Step>
        <Step n="2">点击 <strong>添加商品</strong> 创建新商品</Step>
        <Step n="3">填写编码、名称、分类、单位、成本价</Step>
        <Step n="4">设置3个价格等级：价格1（零售价）、价格2（会员价）、价格3（批发价）</Step>
        <Step n="5">上传商品图片（可选）</Step>
        <p className="mt-2"><strong>批量导入：</strong>使用 CSV 导入批量添加商品</p>
        <p><strong>分类管理：</strong>在 商品 → 分类管理 中管理</p>
        <p><strong>组合商品：</strong>在 商品 → 组合商品 中创建</p>
      </Section>

      <Section icon={Tag} title="分类管理" color="bg-violet-500">
        <Step n="1">进入 <strong>商品 → 分类管理</strong></Step>
        <Step n="2">点击 <strong>添加分类</strong></Step>
        <Step n="3">输入分类名称并保存</Step>
        <p className="mt-2">分类用于商品归类和POS快速筛选。</p>
      </Section>

      <Section icon={Box} title="组合商品" color="bg-pink-500">
        <Step n="1">进入 <strong>商品 → 组合商品</strong></Step>
        <Step n="2">创建组合，选择包含的商品和数量</Step>
        <Step n="3">设置组合价格（可低于单品总价）</Step>
        <p className="mt-2">组合商品在POS中可作为一个商品销售。</p>
      </Section>

      {/* ===== 库存管理 ===== */}
      <p className="text-xs text-purple-400 font-medium uppercase tracking-wide pt-2">库存管理</p>

      <Section icon={Warehouse} title="仓库与库存" color="bg-purple-500">
        <Step n="1"><strong>仓库管理：</strong>在 仓库 → 仓库管理 中创建仓库</Step>
        <Step n="2"><strong>入库：</strong>通过采购单将商品入库</Step>
        <Step n="3"><strong>调拨：</strong>在仓库间转移库存</Step>
        <Step n="4"><strong>盘点：</strong>在库存盘点中进行手动校正</Step>
        <Step n="5"><strong>预警：</strong>在库存预警中查看低库存商品</Step>
      </Section>

      <Section icon={ArrowLeftRight} title="库存调拨" color="bg-orange-500">
        <Step n="1">进入 <strong>仓库 → 调拨管理</strong></Step>
        <Step n="2">选择源仓库和目标仓库</Step>
        <Step n="3">添加要调拨的商品和数量</Step>
        <Step n="4">确认调拨，库存自动更新</Step>
      </Section>

      <Section icon={AlertCircle} title="库存预警" color="bg-red-500">
        <p className="text-slate-400 mb-2">自动监控库存不足的商品。</p>
        <Step n="1">进入 <strong>仓库 → 库存预警</strong></Step>
        <Step n="2">系统自动显示低于最低库存的商品</Step>
        <Step n="3">可快速创建采购单补货</Step>
      </Section>

      <Section icon={ClipboardList} title="库存盘点" color="bg-cyan-500">
        <Step n="1">进入 <strong>仓库 → 库存盘点</strong></Step>
        <Step n="2">选择仓库，系统显示当前库存</Step>
        <Step n="3">输入实际盘点数量</Step>
        <Step n="4">确认后系统自动计算差异并更新</Step>
      </Section>

      {/* ===== 采购管理 ===== */}
      <p className="text-xs text-orange-400 font-medium uppercase tracking-wide pt-2">采购管理</p>

      <Section icon={FileText} title="采购管理" color="bg-orange-500">
        <Step n="1">先在 <strong>采购 → 供应商管理</strong> 中添加供应商</Step>
        <Step n="2">在 <strong>采购 → 采购管理</strong> 中创建采购单</Step>
        <Step n="3">选择供应商、入库仓库，添加商品</Step>
        <Step n="4">货物到达后确认入库 → 库存自动增加</Step>
        <Step n="5">如有问题，可创建采购退货单</Step>
      </Section>

      {/* ===== 销售管理 ===== */}
      <p className="text-xs text-green-400 font-medium uppercase tracking-wide pt-2">销售管理</p>

      <Section icon={ShoppingCart} title="销售管理" color="bg-green-500">
        <p><strong>销售记录：</strong>查看所有销售，可按日期/门店/支付方式筛选</p>
        <p><strong>在线订单：</strong>管理在线商城的订单</p>
        <p><strong>日结：</strong>每日现金对账</p>
        <p><strong>退款记录：</strong>查看所有已处理的退款</p>
        <p><strong>批发：</strong>B2B批量销售</p>
      </Section>

      <Section icon={Calendar} title="日结" color="bg-teal-500">
        <Step n="1">进入 <strong>销售 → 日结</strong></Step>
        <Step n="2">选择日期和门店</Step>
        <Step n="3">系统显示当日销售汇总</Step>
        <Step n="4">核对现金、刷卡等各支付方式金额</Step>
      </Section>

      <Section icon={Globe} title="在线商城" color="bg-indigo-500">
        <p className="text-slate-400 mb-2">您的客户可以在线浏览和下单。</p>
        <Step n="1">点击侧边栏 <strong>Shop</strong> 按钮查看您的商城</Step>
        <Step n="2">将商城链接分享给客户</Step>
        <Step n="3">客户浏览商品、加入购物车、下单</Step>
        <Step n="4">您在 <strong>销售 → 在线订单</strong> 中查看和处理订单</Step>
        <Step n="5">处理、发货、完成订单</Step>
      </Section>

      {/* ===== 客户管理 ===== */}
      <p className="text-xs text-cyan-400 font-medium uppercase tracking-wide pt-2">客户管理</p>

      <Section icon={Users} title="客户与积分" color="bg-cyan-500">
        <Step n="1">进入 <strong>CRM → 客户管理</strong></Step>
        <Step n="2">添加客户，填写姓名、电话、邮箱</Step>
        <Step n="3">客户消费自动积分（$1 = 1积分）</Step>
        <Step n="4">积分可在POS结算时抵扣（100积分 = $1）</Step>
        <Step n="5">VIP等级根据消费自动升级</Step>
      </Section>

      <Section icon={Megaphone} title="促销活动" color="bg-pink-500">
        <Step n="1">进入 <strong>CRM → 促销活动</strong></Step>
        <Step n="2">创建活动：设置名称、时间范围</Step>
        <Step n="3">选择促销类型（折扣、满减等）</Step>
        <Step n="4">活动期间POS自动应用促销规则</Step>
      </Section>

      {/* ===== 报表与财务 ===== */}
      <p className="text-xs text-violet-400 font-medium uppercase tracking-wide pt-2">报表与财务</p>

      <Section icon={BarChart3} title="报表与分析" color="bg-violet-500">
        <p><strong>仪表盘：</strong>今日销售额、趋势、热销商品</p>
        <p><strong>销售报表：</strong>按日期筛选，支持导出Excel</p>
        <p><strong>利润分析：</strong>成本与收入对比、商品毛利</p>
        <p><strong>销售目标：</strong>设定月度目标，跟踪完成进度</p>
        <p><strong>应收应付：</strong>账款跟踪管理</p>
      </Section>

      <Section icon={DollarSign} title="多币种与汇率" color="bg-yellow-500">
        <p className="text-slate-400 mb-2">支持美元和本地货币（VES/Bs.）。</p>
        <Step n="1">进入 <strong>财务 → 汇率管理</strong></Step>
        <Step n="2">设置 USD 对 VES 的汇率</Step>
        <Step n="3">POS 自动显示双币价格</Step>
      </Section>

      {/* ===== 人事管理 ===== */}
      <p className="text-xs text-red-400 font-medium uppercase tracking-wide pt-2">人事与系统</p>

      <Section icon={Shield} title="员工与权限管理" color="bg-red-500">
        <p className="text-slate-400 mb-2">管理员工并控制每个人的操作权限。</p>
        <Step n="1">进入 <strong>人事 → 员工管理</strong></Step>
        <Step n="2">点击 <strong>添加</strong> 创建新员工</Step>
        <Step n="3">选择角色预设：管理员/经理/收银员/员工</Step>
        <Step n="4">通过勾选框自定义每个权限：</Step>
        <div className="mt-1 p-3 bg-slate-900 rounded-lg grid grid-cols-2 gap-1 text-xs">
          <p><strong>POS</strong> — 使用收银台</p>
          <p><strong>折扣</strong> — 申请折扣</p>
          <p><strong>退款</strong> — 处理退款</p>
          <p><strong>作废</strong> — 作废交易</p>
          <p><strong>商品</strong> — 管理商品</p>
          <p><strong>库存</strong> — 管理库存</p>
          <p><strong>客户</strong> — 管理客户</p>
          <p><strong>报表</strong> — 查看报表</p>
          <p><strong>导出</strong> — 导出数据</p>
          <p><strong>成本价</strong> — 查看成本价</p>
          <p><strong>设置</strong> — 系统设置</p>
          <p><strong>员工</strong> — 管理员工</p>
        </div>
        <Step n="5">设置 <strong>最大折扣%</strong> 限制折扣金额</Step>
      </Section>

      <Section icon={Clock} title="考勤管理" color="bg-slate-500">
        <Step n="1">进入 <strong>人事 → 考勤管理</strong></Step>
        <Step n="2">员工打卡记录自动生成</Step>
        <Step n="3">查看迟到、早退、缺勤统计</Step>
      </Section>

      <Section icon={Settings} title="系统设置" color="bg-slate-500">
        <p><strong>门店管理：</strong>添加门店，设置总部</p>
        <p><strong>支付设置：</strong>配置银行转账、Pago Movil、WhatsApp</p>
        <p><strong>系统设置：</strong>公司信息、发票格式、小票设置</p>
        <p><strong>审计日志：</strong>追踪所有系统操作记录</p>
      </Section>

      <Section icon={Monitor} title="安装桌面应用（PWA）" color="bg-teal-500">
        <p className="text-slate-400 mb-2">将 Sellox 安装到桌面，方便快速访问和离线使用。</p>
        <Step n="1">用 Chrome/Edge 浏览器打开 Sellox</Step>
        <Step n="2">点击地址栏中的安装图标</Step>
        <Step n="3">应用会像普通程序一样安装到桌面</Step>
        <Step n="4"><strong>离线收银：</strong>断网时POS仍可使用！网络恢复后自动同步。</Step>
      </Section>

      <Section icon={Bell} title="常见问题" color="bg-slate-500">
        <div className="space-y-3">
          <div>
            <p className="text-white font-medium">Q: 如何开始使用POS收银？</p>
            <p>A: 点击侧边栏POS按钮 → 登录 → 选择门店 → 开始班次 → 即可开始收银</p>
          </div>
          <div>
            <p className="text-white font-medium">Q: 收银员无法退款怎么办？</p>
            <p>A: 管理员需在 员工管理 中为该收银员勾选"退款"权限</p>
          </div>
          <div>
            <p className="text-white font-medium">Q: 如何查看今天的销售额？</p>
            <p>A: 登录后默认显示仪表盘，包含今日销售统计</p>
          </div>
          <div>
            <p className="text-white font-medium">Q: 断网了还能收银吗？</p>
            <p>A: 可以！PWA模式下POS支持离线收银，网络恢复后自动同步数据</p>
          </div>
          <div>
            <p className="text-white font-medium">Q: 如何导出销售报表？</p>
            <p>A: 进入报表页面 → 设置筛选条件 → 点击导出按钮即可下载Excel</p>
          </div>
        </div>
      </Section>

      <div className="text-center py-6 text-slate-600 text-xs">
        <p>Sellox v1.0 — Smart POS System</p>
        <p>Powered by Sellox &copy; 2026</p>
      </div>
    </div>
  );
}
