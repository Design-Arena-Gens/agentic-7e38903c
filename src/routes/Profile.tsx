import { useAuth } from '../auth';

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="card" style={{maxWidth:600}}>
      <h2>Profile</h2>
      <p><b>Name:</b> {user.name}</p>
      <p><b>Email:</b> {user.email}</p>
      <p><b>Role:</b> {user.role}</p>
    </div>
  );
}
