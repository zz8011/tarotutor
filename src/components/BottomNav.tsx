import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, BookOpen, Star, User } from 'lucide-react';
import './BottomNav.scss';

const navItems = [
  { path: '/', icon: Sparkles, label: '首页' },
  { path: '/library', icon: BookOpen, label: '百科' },
  { path: '/spread', icon: Star, label: '牌阵' },
  { path: '/profile', icon: User, label: '我的' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="bottom-nav" aria-label="底部导航">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.path;
        return (
          <button
            key={item.path}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={22} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
