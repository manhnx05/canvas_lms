import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface Props {
  content: string;
  className?: string;
}

export const LatexRenderer: React.FC<Props> = ({ content, className = '' }) => {
  // Render LaTeX formulas $inline$ và $$block$$
  const renderedContent = useMemo(() => {
    if (!content) return { __html: '' };

    // Regex tìm block ($$...$$) và inline ($...$)
    const regex = /(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$)/g;
    
    // Tách văn bản thành mảng các văn bản thuần và công thức LaTeX
    const segments = content.split(regex);
    let html = '';

    for (const segment of segments) {
      if (segment.startsWith('$$') && segment.endsWith('$$')) {
        // Block math
        const math = segment.slice(2, -2);
        try {
          html += katex.renderToString(math, {
            displayMode: true,
            throwOnError: false,
          });
        } catch (e) {
          html += segment; // Fallback
        }
      } else if (segment.startsWith('$') && segment.endsWith('$') && segment.length > 2) {
        // Inline math
        const math = segment.slice(1, -1);
        try {
          html += katex.renderToString(math, {
            displayMode: false,
            throwOnError: false,
          });
        } catch (e) {
          html += segment; // Fallback
        }
      } else {
        // Text bình thường. Đổi \n thành <br />
        html += segment
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br />');
      }
    }

    return { __html: html };
  }, [content]);

  return (
    <div
      className={`prose max-w-none latex-content ${className}`}
      dangerouslySetInnerHTML={renderedContent}
    />
  );
};
