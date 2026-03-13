import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

export default function LoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(username, password);
      const from = location.state?.from || "/admin";
      navigate(from);
      toast.success(t('login') + " OK");
    } catch (error) {
      toast.error(error.response?.data?.detail || t('login') + " failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">POS</CardTitle>
          <p className="text-slate-400 text-sm">{t('storeManagement')} · {t('warehouseManagement')}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm text-slate-300 mb-1 block">{t('username')}</label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t('username')} className="bg-slate-700/50 border-slate-600 text-white" data-testid="login-username" />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1 block">{t('password')}</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('password')} className="bg-slate-700/50 border-slate-600 text-white" data-testid="login-password" />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600" disabled={isLoading} data-testid="login-submit">
              {isLoading ? t('loading') : t('login')}
            </Button>
            <p className="text-center text-slate-400 text-xs mt-4">admin / admin123</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
