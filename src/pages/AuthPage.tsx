import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function AuthPage() {
  const { login, register, loading, error } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const navigate = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password, nickname || undefined);
      navigate('/');
    } catch {
      /* error 已在 store，UI 显示 */
    }
  };

  return (
    <div className="auth-page" style={{ maxWidth: 360, margin: '80px auto', padding: 20 }}>
      <h2 style={{ textAlign: 'center' }}>{mode === 'login' ? '登录' : '注册'}</h2>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {mode === 'register' && (
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="昵称（可选）" />
        )}
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="邮箱" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密码（至少8位）" required minLength={8} />
        {error && <p style={{ color: 'crimson', margin: 0 }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ padding: '8px 0' }}>
          {loading ? '...' : mode === 'login' ? '登录' : '注册'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 16 }}>
        <button
          type="button"
          onClick={() => setMode((m) => (m === 'login' ? 'register' : 'login'))}
          style={{ background: 'none', border: 'none', color: 'var(--accent-gold, #06c)', cursor: 'pointer' }}
        >
          {mode === 'login' ? '没账号？去注册' : '有账号？去登录'}
        </button>
      </p>
    </div>
  );
}
