import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Building2, Shield, Settings, Users, Monitor, DollarSign, BarChart3, Globe, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

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
    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-bold">{n}</span>
    <span>{children}</span>
  </div>
);

export default function SuperAdminHelpPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'admin' && !user?.tenant_id;
  if (!isSuperAdmin) return <Navigate to="/admin/help" replace />;

  return (
    <div className="space-y-4" data-testid="super-admin-help-page">
      <div className="flex items-center gap-3 mb-6">
        <img src="/sellox-logo.png" alt="Sellox" className="w-10 h-10 rounded-xl" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Sellox 系统管理员手册</h1>
          <p className="text-slate-400 text-sm">SaaS 平台管理指南 — 适用于系统拥有者</p>
        </div>
        <Button onClick={() => window.print()} variant="outline" className="border-slate-600 text-slate-300 print:hidden" data-testid="export-admin-manual-pdf">
          <Download className="w-4 h-4 mr-2" /> 导出PDF
        </Button>
      </div>

      <p className="text-xs text-amber-400 font-medium uppercase tracking-wide">平台管理</p>

      <Section icon={Building2} title="商家管理（SaaS）" color="bg-amber-500">
        <p className="text-slate-400 mb-2">管理使用 Sellox 系统的客户（商家/租户）。</p>
        <Step n="1">进入 <strong>系统设置 → SaaS商家管理</strong></Step>
        <Step n="2">点击 <strong>"添加商家"</strong> 创建新客户</Step>
        <Step n="3">填写：商家名称、联系方式、管理员用户名和密码</Step>
        <Step n="4">选择套餐：<strong>Basic</strong>（基础版）/ <strong>Pro</strong>（专业版）/ <strong>Enterprise</strong>（企业版）</Step>
        <Step n="5">将商家ID、用户名和密码提供给客户</Step>
        <div className="mt-3 p-3 bg-slate-900 rounded-lg">
          <p className="text-amber-400 font-medium text-xs mb-1">套餐说明：</p>
          <p><strong>Basic</strong> — POS收银、商品管理、库存管理、客户管理、基础报表（1个门店）</p>
          <p><strong>Pro</strong> — 包含Basic全部 + 在线商城、高级报表、促销活动、批发、多门店</p>
          <p><strong>Enterprise</strong> — 包含Pro全部 + 佣金系统、API访问、无限门店和用户</p>
        </div>
        <div className="mt-2 p-3 bg-slate-900 rounded-lg">
          <p className="text-blue-400 font-medium text-xs mb-1">快捷操作：</p>
          <p><strong>复制商城链接</strong> — 分享给商家的客户进行在线下单</p>
          <p><strong>打开商城</strong> — 预览商家的在线商店</p>
          <p><strong>启用/禁用</strong> — 控制商家账号状态</p>
        </div>
      </Section>

      <Section icon={Users} title="商家用户管理" color="bg-blue-500">
        <p className="text-slate-400 mb-2">每个商家可以自行管理自己的员工和权限。</p>
        <Step n="1">商家管理员登录后，进入 <strong>人事 → 员工管理</strong></Step>
        <Step n="2">可添加员工，分配角色（管理员/经理/收银员/员工）</Step>
        <Step n="3">通过勾选框自定义每个员工的权限</Step>
        <div className="mt-2 p-3 bg-slate-900 rounded-lg">
          <p className="text-emerald-400 font-medium text-xs mb-1">权限类型：</p>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <p><strong>POS</strong> — 使用收银台</p>
            <p><strong>折扣</strong> — 申请折扣</p>
            <p><strong>退款</strong> — 处理退款</p>
            <p><strong>作废</strong> — 作废交易</p>
            <p><strong>商品</strong> — 管理商品</p>
            <p><strong>库存</strong> — 管理库存</p>
            <p><strong>客户</strong> — 管理客户</p>
            <p><strong>报表</strong> — 查看报表</p>
          </div>
        </div>
      </Section>

      <p className="text-xs text-emerald-400 font-medium uppercase tracking-wide pt-2">系统管理</p>

      <Section icon={DollarSign} title="套餐与计费" color="bg-green-500">
        <p className="text-slate-400 mb-2">管理商家的订阅套餐和功能限制。</p>
        <Step n="1">在 <strong>SaaS商家管理</strong> 页面查看每个商家的当前套餐</Step>
        <Step n="2">可升级或降级商家套餐</Step>
        <Step n="3">不同套餐自动限制可用功能模块</Step>
        <div className="mt-2 p-3 bg-slate-900 rounded-lg">
          <p className="text-amber-400 font-medium text-xs mb-1">功能限制示例：</p>
          <p>Basic 无法访问在线商城、批发、佣金等高级功能</p>
          <p>Pro 无法使用 API 接入和无限门店</p>
        </div>
      </Section>

      <Section icon={Shield} title="安全与审计" color="bg-red-500">
        <p className="text-slate-400 mb-2">监控平台安全和操作记录。</p>
        <Step n="1">每个商家的数据完全隔离（独立数据库）</Step>
        <Step n="2">超级管理员无法查看商家的销售金额（隐私保护）</Step>
        <Step n="3">每个商家有独立的审计日志记录所有操作</Step>
        <div className="mt-2 p-3 bg-slate-900 rounded-lg">
          <p className="text-emerald-400 font-medium text-xs mb-1">数据隔离：</p>
          <p>每个商家使用独立数据库，确保数据不会混淆</p>
          <p>JWT 令牌包含商家标识，防止越权访问</p>
        </div>
      </Section>

      <Section icon={Globe} title="在线商城管理" color="bg-indigo-500">
        <p className="text-slate-400 mb-2">每个商家自动拥有独立的在线商店。</p>
        <Step n="1">商城地址格式：<code className="text-emerald-400 bg-slate-900 px-1 rounded">/shop/[商家ID]</code></Step>
        <Step n="2">在商家管理页面，点击 <strong>复制商城链接</strong> 获取地址</Step>
        <Step n="3">点击 <strong>打开商城</strong> 可直接预览</Step>
        <Step n="4">商家的客户可以浏览商品、下单购买</Step>
      </Section>

      <Section icon={Monitor} title="部署与维护" color="bg-teal-500">
        <p className="text-slate-400 mb-2">系统部署和日常维护说明。</p>
        <Step n="1">系统支持 Docker 一键部署</Step>
        <Step n="2">使用 <code className="text-emerald-400 bg-slate-900 px-1 rounded">docker-compose up -d</code> 启动所有服务</Step>
        <Step n="3">数据库自动备份建议每日执行</Step>
        <Step n="4">PWA 支持离线收银，断网后自动同步</Step>
        <div className="mt-2 p-3 bg-slate-900 rounded-lg">
          <p className="text-blue-400 font-medium text-xs mb-1">重要提醒：</p>
          <p>定期备份 MongoDB 数据库</p>
          <p>确保 SSL 证书有效（HTTPS）</p>
          <p>监控服务器资源使用情况</p>
        </div>
      </Section>

      <Section icon={Settings} title="常见问题" color="bg-slate-500">
        <div className="space-y-3">
          <div>
            <p className="text-white font-medium">Q: 如何创建新商家？</p>
            <p>A: 进入 SaaS商家管理 → 点击添加商家 → 填写信息 → 选择套餐 → 保存</p>
          </div>
          <div>
            <p className="text-white font-medium">Q: 商家忘记密码怎么办？</p>
            <p>A: 在商家管理页面可以重置商家管理员的密码</p>
          </div>
          <div>
            <p className="text-white font-medium">Q: 如何禁用某个商家？</p>
            <p>A: 在商家列表中点击该商家的启用/禁用开关即可</p>
          </div>
          <div>
            <p className="text-white font-medium">Q: 数据安全如何保证？</p>
            <p>A: 每个商家使用独立数据库，JWT认证确保访问隔离，审计日志记录所有操作</p>
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
