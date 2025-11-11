import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import styles from './NavBar.module.css';

export function NavBar() {
  const { user, logout, token } = useAuth();
  const loc = useLocation();
  const active = (p: string) => (loc.pathname.startsWith(p) ? styles.active : '');

  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>Vinyasa Club</div>
      {token && (
        <ul className={styles.links}>
          <li><Link className={active('/dashboard')} to="/dashboard">Dashboard</Link></li>
          <li><Link className={active('/members')} to="/members">Members</Link></li>
          <li><Link className={active('/attendance')} to="/attendance">Attendance</Link></li>
          <li><Link className={active('/performance')} to="/performance">Performance</Link></li>
        </ul>
      )}
      <div className={styles.right}>
        {user ? (
          <>
            <Link to="/profile" className={styles.user}>{user.name} ({user.role})</Link>
            <button className={styles.logout} onClick={logout}>Logout</button>
          </>
        ) : (
          <Link to="/login" className={styles.login}>Login</Link>
        )}
      </div>
    </nav>
  );
}
