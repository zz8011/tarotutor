import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AiResponse from './AiResponse';

describe('AiResponse 组件', () => {
  it('应渲染正常文本', () => {
    render(<AiResponse text="你好，世界" />);
    expect(screen.getByText('你好，世界')).toBeInTheDocument();
  });

  it('应过滤 XSS payload（不渲染 script 标签）', () => {
    const xssText = '<script>alert("xss")</script>正常内容';
    render(<AiResponse text={xssText} />);
    expect(screen.queryByText('alert("xss")')).not.toBeInTheDocument();
    expect(screen.getByText('正常内容')).toBeInTheDocument();
  });

  it('应渲染多段落文本', () => {
    const multiParagraph = '第一段内容\n\n第二段内容\n\n第三段内容';
    render(<AiResponse text={multiParagraph} />);
    expect(screen.getByText('第一段内容')).toBeInTheDocument();
    expect(screen.getByText('第二段内容')).toBeInTheDocument();
    expect(screen.getByText('第三段内容')).toBeInTheDocument();
  });

  it('应支持自定义 className', () => {
    const { container } = render(<AiResponse text="测试" className="custom-class" />);
    const root = container.querySelector('.ai-response');
    expect(root).toHaveClass('custom-class');
  });

  it('空文本应返回 null', () => {
    const { container } = render(<AiResponse text="" />);
    expect(container.firstChild).toBeNull();
  });
});
