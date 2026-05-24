import React, { useMemo } from 'react';
import DOMPurify from 'isomorphic-dompurify';

interface Props {
  content: string;
  className?: string;
}

export const LatexRenderer: React.FC<Props> = ({ content, className = '' }) => {
  const renderedContent = useMemo(() => {
    if (!content) return { __html: '' };

    // Use DOMPurify to allow safe HTML tags (<p>, <strong>, etc)
    // while preventing XSS. It handles both AI plain text and Rich Text Editor output.
    const cleanHtml = DOMPurify.sanitize(content);

    return { __html: cleanHtml };
  }, [content]);

  return (
    <div
      className={`prose max-w-none latex-content whitespace-pre-wrap ${className}`}
      dangerouslySetInnerHTML={renderedContent}
    />
  );
};
