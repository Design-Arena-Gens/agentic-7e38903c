import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../auth';

export default function Performance() {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [form, setForm] = useState<{ memberId?: string; category?: string; score?: number; rating?: number }>({});

  const canEdit = user?.role === 'admin' || user?.role === 'instructor';

  const load = async () => {
    const [mRes, pRes] = await Promise.all([api.get('/members'), api.get('/performance')]);
    setMembers(mRes.data);
    setEntries(pRes.data);
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.memberId) return;
    await api.post('/performance', form);
    setForm({});
    await load();
  };

  const recent = useMemo(() => entries.slice(-10).reverse(), [entries]);

  return (
    <div className="grid">
      <div className="card">
        <h2>Performance</h2>
        {canEdit && (
          <div className="grid" style={{gridTemplateColumns:'repeat(4,minmax(0,1fr))'}}>
            <select className="input" value={form.memberId||''} onChange={e=>setForm(f=>({...f, memberId:e.target.value}))}>
              <option value="">Select member</option>
              {members.map((m:any)=> <option key={m.id} value={m.id}>{m.name} ({m.vin})</option>)}
            </select>
            <input className="input" placeholder="Category" value={form.category||''} onChange={e=>setForm(f=>({...f, category:e.target.value}))} />
            <input className="input" type="number" placeholder="Score" value={form.score??''} onChange={e=>setForm(f=>({...f, score:Number(e.target.value)}))} />
            <input className="input" type="number" placeholder="Rating (1-5)" value={form.rating??''} onChange={e=>setForm(f=>({...f, rating:Number(e.target.value)}))} />
            <button className="button" onClick={submit}>Add</button>
          </div>
        )}
        <table className="table" style={{marginTop:12}}>
          <thead><tr><th>When</th><th>Member</th><th>Category</th><th>Score</th><th>Rating</th></tr></thead>
          <tbody>
            {recent.map((e:any, i:number)=> (
              <tr key={i}>
                <td>{new Date(e.createdAt).toLocaleString()}</td>
                <td>{members.find((m:any)=>m.id===e.memberId)?.name}</td>
                <td>{e.category}</td>
                <td>{e.score}</td>
                <td>{e.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
