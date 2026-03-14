import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Store, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";
import axios, { API } from "@/lib/api";

export default function LoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [tenantId, setTenantId] = useState("");
  const [tUsername, setTUsername] = useState("");
  const [tPassword, setTPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, tenantLogin } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(username, password);
      navigate(location.state?.from || "/admin");
      toast.success(t('login') + " OK");
    } catch (error) {
      toast.error(error.response?.data?.detail || t('login') + " failed");
    } finally { setIsLoading(false); }
  };

  const handleTenantLogin = async (e) => {
    e.preventDefault();
    if (!tenantId || !tUsername || !tPassword) { toast.error("请填写所有字段"); return; }
    setIsLoading(true);
    try {
      const { tenant } = await tenantLogin(tenantId, tUsername, tPassword);
      navigate("/admin");
      toast.success(`${t('login')} OK - ${tenant?.name || ''}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || t('login') + " failed");
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">POS收银系统</CardTitle>
          <p className="text-slate-400 text-sm">{t('storeManagement')} · {t('warehouseManagement')}</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="w-full bg-slate-700/50 mb-4">
              <TabsTrigger value="admin" className="flex-1 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">管理员登录</TabsTrigger>
              <TabsTrigger value="tenant" className="flex-1 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">商家登录</TabsTrigger>
            </TabsList>

            <TabsContent value="admin">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div><label className="text-sm text-slate-300 mb-1 block">{t('username')}</label>
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t('username')} className="bg-slate-700/50 border-slate-600 text-white" data-testid="login-username" /></div>
                <div><label className="text-sm text-slate-300 mb-1 block">{t('password')}</label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('password')} className="bg-slate-700/50 border-slate-600 text-white" data-testid="login-password" /></div>
                <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600" disabled={isLoading} data-testid="login-submit">
                  {isLoading ? t('loading') : t('login')}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="tenant">
              <form onSubmit={handleTenantLogin} className="space-y-4">
                <div><label className="text-sm text-slate-300 mb-1 block">商家ID</label>
                  <Input value={tenantId} onChange={(e) => setTenantId(e.target.value)} placeholder="由管理员提供" className="bg-slate-700/50 border-slate-600 text-white" data-testid="tenant-id-input" /></div>
                <div><label className="text-sm text-slate-300 mb-1 block">{t('username')}</label>
                  <Input value={tUsername} onChange={(e) => setTUsername(e.target.value)} placeholder={t('username')} className="bg-slate-700/50 border-slate-600 text-white" data-testid="tenant-username-input" /></div>
                <div><label className="text-sm text-slate-300 mb-1 block">{t('password')}</label>
                  <Input type="password" value={tPassword} onChange={(e) => setTPassword(e.target.value)} placeholder={t('password')} className="bg-slate-700/50 border-slate-600 text-white" data-testid="tenant-password-input" /></div>
                <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600" disabled={isLoading} data-testid="tenant-login-submit">
                  {isLoading ? t('loading') : t('login')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
