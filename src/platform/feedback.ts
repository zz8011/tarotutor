type WxFeedback = {
  showToast?: (options: { title: string; icon?: 'none' | 'success' | 'error'; duration?: number }) => void;
};

declare const wx: WxFeedback | undefined;

const TOAST_DURATION = 1800;
const TOAST_ID = 'app-web-toast';

/**
 * Web 端 toast 回退：注入一个轻量 DOM 提示条（无依赖）。
 * 重复调用时复用同一节点并重置消失计时，避免堆叠。
 */
let hideTimer: ReturnType<typeof setTimeout> | undefined;

function showWebToast(title: string) {
  if (typeof document === 'undefined') return;

  let toast = document.getElementById(TOAST_ID);
  if (!toast) {
    toast = document.createElement('div');
    toast.id = TOAST_ID;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    Object.assign(toast.style, {
      position: 'fixed',
      left: '50%',
      bottom: '88px',
      transform: 'translateX(-50%)',
      maxWidth: '80vw',
      padding: '10px 18px',
      borderRadius: '999px',
      background: 'rgba(20, 16, 38, 0.92)',
      color: '#f5f0ff',
      fontSize: '14px',
      lineHeight: '1.4',
      textAlign: 'center',
      zIndex: '9999',
      boxShadow: '0 6px 24px rgba(0, 0, 0, 0.35)',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 0.25s ease',
    } satisfies Partial<CSSStyleDeclaration>);
    document.body.appendChild(toast);
  }

  toast.textContent = title;
  // 强制 reflow 使透明度过渡在新建节点上也能生效
  void toast.offsetHeight;
  toast.style.opacity = '1';

  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    const node = document.getElementById(TOAST_ID);
    if (!node) return;
    node.style.opacity = '0';
    setTimeout(() => node.remove(), 300);
  }, TOAST_DURATION);
}

export function showToast(title: string) {
  if (typeof wx !== 'undefined' && wx.showToast) {
    wx.showToast({ title, icon: 'none', duration: TOAST_DURATION });
    return;
  }
  showWebToast(title);
}
