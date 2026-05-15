import { forwardRef } from 'react';

interface Props {
  html: string;
  onScroll?: React.UIEventHandler<HTMLDivElement>;
}

const MarkdownPreview = forwardRef<HTMLDivElement, Props>(({ html, onScroll }, ref) => {
  return (
    <div
      ref={ref}
      className="markdown-body"
      style={{ height: '100%', overflow: 'auto' }}
      dangerouslySetInnerHTML={{ __html: html }}
      onScroll={onScroll}
    />
  );
});

MarkdownPreview.displayName = 'MarkdownPreview';

export default MarkdownPreview;
