import { FormEvent, useState } from 'react';
import { useAuth } from '../auth';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@vinyasa.club');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      location.href = '/dashboard';
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid">
      <form className="card" onSubmit={onSubmit} style={{maxWidth: 420, margin: '2rem auto', width: '100%'}}>
        <h2>Login</h2>
        <p>Use seeded credentials like <span className="mono">admin@vinyasa.club / password</span></p>
        <label>Email</label>
        <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
        <label style={{marginTop:8}}>Password</label>
        <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="????????" />
        {error && <p style={{color:'#f87171'}}>{error}</p>}
        <button className="button" style={{marginTop:12}} disabled={loading}>
          {loading? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
