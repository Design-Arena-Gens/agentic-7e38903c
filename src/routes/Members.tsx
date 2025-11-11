import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../auth';

type Member = { id: string; vin: string; name: string; email: string; year: number; branch: string };

export default function Members() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<Partial<Member>>({ name: '', email: '', branch: 'CSE', year: 1 });

  const canEdit = user?.role === 'admin' || user?.role === 'instructor';

  const load = async () => {
    const res = await api.get('/members');
    setMembers(res.data);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => members.filter(m =>
    m.name.toLowerCase().includes(query.toLowerCase()) ||
    m.email.toLowerCase().includes(query.toLowerCase()) ||
    m.vin.toLowerCase().includes(query.toLowerCase())
  ), [members, query]);

  const submit = async () => {
    await api.post('/members', form);
    setForm({ name: '', email: '', branch: 'CSE', year: 1 });
    await load();
  };

  const remove = async (id: string) => {
    await api.delete(`/members/${id}`);
    await load();
  };

  return (
    <div className="grid">
      <div className="card">
        <h2>Members</h2>
        <input className="input" placeholder="Search name/email/VIN" value={query} onChange={e=>setQuery(e.target.value)} />
        <table className="table" style={{marginTop:12}}>
          <thead><tr><th>VIN</th><th>Name</th><th>Email</th><th>Year</th><th>Branch</th><th></th></tr></thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id}>
                <td className="mono">{m.vin}</td>
                <td>{m.name}</td>
                <td>{m.email}</td>
                <td>{m.year}</td>
                <td>{m.branch}</td>
                <td>
                  {user?.role === 'admin' && (
                    <button className="button secondary" onClick={()=>remove(m.id)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canEdit && (
        <div className="card">
          <h3>Add Member</h3>
          <div className="grid" style={{gridTemplateColumns:'repeat(2,minmax(0,1fr))'}}>
            <input className="input" placeholder="Full name" value={form.name||''} onChange={e=>setForm(f=>({...f, name:e.target.value}))} />
            <input className="input" placeholder="Email" value={form.email||''} onChange={e=>setForm(f=>({...f, email:e.target.value}))} />
            <input className="input" type="number" placeholder="Year" value={form.year||1} onChange={e=>setForm(f=>({...f, year:Number(e.target.value)}))} />
            <input className="input" placeholder="Branch" value={form.branch||''} onChange={e=>setForm(f=>({...f, branch:e.target.value}))} />
          </div>
          <button className="button" style={{marginTop:12}} onClick={submit}>Create</button>
        </div>
      )}
    </div>
  );
}
