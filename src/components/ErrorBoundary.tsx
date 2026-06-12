import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  private getFallbackPath() {
    return window.location.pathname.startsWith('/taro') ? '/taro/' : '/';
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] 页面崩溃:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
          background: 'linear-gradient(145deg, #0f0d0a 0%, #1c1711 58%, #16201d 100%)',
          color: '#e9ddc8',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: '1px solid rgba(212, 176, 102, 0.45)',
            display: 'grid',
            placeItems: 'center',
            marginBottom: '1rem',
            color: '#d4b066',
            fontFamily: 'Georgia, serif',
            fontSize: '1.5rem',
          }}>月</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#d4b066' }}>
            神秘力量中断了连接
          </h2>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', color: '#8b7355' }}>
            页面发生了意外错误，请尝试刷新
          </p>
          <button
            onClick={() => {
              this.handleReset();
              window.location.href = this.getFallbackPath();
            }}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              border: '1px solid #c9a96e',
              background: 'transparent',
              color: '#c9a96e',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            返回首页
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
