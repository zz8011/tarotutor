import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, BookOpen, Star, User } from 'lucide-react';
import './BottomNav.scss';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { path: '/', icon: Sparkles, label: '首页' },
    { path: '/library', icon: BookOpen, label: '百科' },
    { path: '/spread', icon: Star, label: '牌阵' },
    { path: '/profile', icon: User, label: '我的' },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <button
          key={item.path}
          className={`nav-item ${currentPath === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <item.icon size={22} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
