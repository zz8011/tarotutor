type WxFeedback = {
  showToast?: (options: { title: string; icon?: 'none' | 'success' | 'error'; duration?: number }) => void;
};

declare const wx: WxFeedback | undefined;

export function showToast(title: string) {
  if (typeof wx !== 'undefined' && wx.showToast) {
    wx.showToast({ title, icon: 'none', duration: 1800 });
  }
}
