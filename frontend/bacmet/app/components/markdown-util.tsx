import ReactMarkdown from 'react-markdown';

export default function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        img: ({ node, ...props }) => (
          <img {...props} className="img-fluid" />
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
} 