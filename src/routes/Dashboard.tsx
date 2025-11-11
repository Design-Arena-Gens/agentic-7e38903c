import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function Dashboard() {
  const [summary, setSummary] = useState<any | null>(null);

  useEffect(() => {
    api.get('/dashboard/summary').then((res) => setSummary(res.data));
  }, []);

  return (
    <div className="grid">
      <div className="card">
        <h2>Overview</h2>
        {summary ? (
          <div className="grid" style={{marginTop:12}}>
            <div className="card"><div>Total Members</div><div className="kpi">{summary.totalMembers}</div></div>
            <div className="card"><div>Today Present</div><div className="kpi">{summary.todayPresent}</div></div>
            <div className="card"><div>7d Avg Attendance</div><div className="kpi">{summary.sevenDayAvg.toFixed(1)}%</div></div>
            <div className="card"><div>Recent Perf Entries</div><div className="kpi">{summary.recentPerformanceCount}</div></div>
          </div>
        ) : 'Loading...'}
      </div>

      <div className="card">
        <h3>Daily Attendance (last 14 days)</h3>
        <div style={{height: 260}}>
          {summary ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.attendanceSeries}>
                <defs>
                  <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#233055" />
                <XAxis dataKey="date" stroke="#9ca3af"/>
                <YAxis stroke="#9ca3af"/>
                <Tooltip/>
                <Area type="monotone" dataKey="present" stroke="#60a5fa" fillOpacity={1} fill="url(#colorPv)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : 'Loading...'}
        </div>
      </div>
    </div>
  );
}
