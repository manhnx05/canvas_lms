import React, { useMemo } from 'react';

interface Props {
  content: string;
  className?: string;
}

export const LatexRenderer: React.FC<Props> = ({ content, className = '' }) => {
  const renderedContent = useMemo(() => {
    if (!content) return { __html: '' };

    const html = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br />');

    return { __html: html };
  }, [content]);

  return (
    <div
      className={`prose max-w-none latex-content ${className}`}
      dangerouslySetInnerHTML={renderedContent}
    />
  );
};
