import React, { useState, useEffect } from "react";
import { Clock, LogIn, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

export default function AttendancePage() {
  const { t } = useLang();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchRecords = async () => {
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const res = await axios.get(`${API}/attendance`, { params });
      setRecords(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { fetchRecords(); }, []);

  const handleClockIn = async () => {
    try { await axios.post(`${API}/attendance/clock-in`); toast.success(t('clockIn') + " OK"); fetchRecords(); }
    catch (e) { toast.error(e.response?.data?.detail || t('operationFailed')); }
  };
  const handleClockOut = async () => {
    try { await axios.post(`${API}/attendance/clock-out`); toast.success(t('clockOut') + " OK"); fetchRecords(); }
    catch (e) { toast.error(e.response?.data?.detail || t('operationFailed')); }
  };

  const todayRecord = records.find(r => r.date === new Date().toISOString().substring(0, 10));

  return (
    <div className="space-y-6" data-testid="attendance-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Clock className="w-6 h-6 text-blue-400" /> {t('attendance')}</h1>
        <div className="flex gap-2">
          {!todayRecord && <Button onClick={handleClockIn} className="bg-emerald-500 hover:bg-emerald-600" data-testid="clock-in-btn"><LogIn className="w-4 h-4 mr-2" /> {t('clockIn')}</Button>}
          {todayRecord && !todayRecord.clock_out && <Button onClick={handleClockOut} className="bg-orange-500 hover:bg-orange-600" data-testid="clock-out-btn"><LogOut className="w-4 h-4 mr-2" /> {t('clockOut')}</Button>}
          {todayRecord?.clock_out && <Badge className="bg-emerald-500/20 text-emerald-400 px-4 py-2">{t('present')} - {todayRecord.hours}h</Badge>}
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-700 border-slate-600 text-white w-40" />
        <span className="text-slate-400">-</span>
        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-700 border-slate-600 text-white w-40" />
        <Button onClick={fetchRecords} className="bg-blue-500 hover:bg-blue-600">{t('search')}</Button>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">{t('date')}</TableHead>
                <TableHead className="text-slate-300">{t('operator')}</TableHead>
                <TableHead className="text-slate-300">{t('clockIn')}</TableHead>
                <TableHead className="text-slate-300">{t('clockOut')}</TableHead>
                <TableHead className="text-slate-300">{t('hours')}</TableHead>
                <TableHead className="text-slate-300">{t('status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map(r => (
                <TableRow key={r.id} className="border-slate-700">
                  <TableCell className="text-white">{r.date}</TableCell>
                  <TableCell className="text-slate-300">{r.username}</TableCell>
                  <TableCell className="text-emerald-400 text-sm">{r.clock_in?.substring(11, 19)}</TableCell>
                  <TableCell className="text-orange-400 text-sm">{r.clock_out?.substring(11, 19) || '-'}</TableCell>
                  <TableCell className="text-blue-400">{r.hours || 0}h</TableCell>
                  <TableCell><Badge className={r.clock_out ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}>{r.clock_out ? t('present') : t('clockIn')}</Badge></TableCell>
                </TableRow>
              ))}
              {records.length === 0 && <TableRow><TableCell colSpan={6} className="text-slate-400 text-center py-8">{t('noData')}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
