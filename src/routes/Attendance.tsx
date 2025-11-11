import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../auth';

type Member = { id: string; vin: string; name: string };

type Status = 'present' | 'late' | 'absent' | 'excused';

export default function Attendance() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(false);

  const canEdit = user?.role === 'admin' || user?.role === 'instructor';

  const load = async () => {
    const [mRes, aRes] = await Promise.all([
      api.get('/members'),
      api.get('/attendance', { params: { date } })
    ]);
    setMembers(mRes.data);
    const map: Record<string, Status> = {};
    (aRes.data as any[])?.forEach((a: any) => { map[a.memberId] = a.status; });
    setStatuses(map);
  };

  useEffect(() => { load(); }, [date]);

  const presentCount = useMemo(() => Object.values(statuses).filter(s => s==='present').length, [statuses]);

  const setStatus = (id: string, s: Status) => setStatuses(prev => ({...prev, [id]: s}));

  const submit = async () => {
    setLoading(true);
    await api.post('/attendance/bulk', { date, records: Object.entries(statuses).map(([memberId, status])=>({ memberId, status })) });
    setLoading(false);
  };

  return (
    <div className="grid">
      <div className="card">
        <h2>Attendance</h2>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
          <div className="kpi">Present: {presentCount}/{members.length}</div>
        </div>
        <table className="table" style={{marginTop:12}}>
          <thead><tr><th>VIN</th><th>Name</th><th>Status</th></tr></thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id}>
                <td className="mono">{m.vin}</td>
                <td>{m.name}</td>
                <td>
                  <select className="input" disabled={!canEdit} value={statuses[m.id]||''} onChange={e=>setStatus(m.id, e.target.value as Status)}>
                    <option value="">-</option>
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                    <option value="excused">Excused</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {canEdit && (
          <button className="button" onClick={submit} disabled={loading}>
            {loading? 'Saving...' : 'Save Attendance'}
          </button>
        )}
      </div>
    </div>
  );
}
