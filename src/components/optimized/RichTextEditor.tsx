import React, { useMemo, useRef, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = 'Nhập nội dung...',
  className = ''
}) => {
  const reactQuillRef = useRef<ReactQuill>(null);

  // Custom image handler to insert base64 (Quill does this by default, 
  // but defining it explicitly allows for future expansion e.g. upload to server)
  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    input.onchange = async () => {
      if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          const base64ImageSrc = reader.result as string;
          const quill = reactQuillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, 'image', base64ImageSrc);
            quill.setSelection(range.index + 1, 0);
          }
        };
        reader.readAsDataURL(file);
      }
    };
  }, []);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'], // image and basic table (via HTML) support
        ['clean'],
      ],
      handlers: {
        image: imageHandler
      }
    },
    // Adding keyboard bindings to stop propagation if needed for dnd-kit
    keyboard: {
      bindings: {
        // Prevent default space bar jump when editing
      }
    }
  }), [imageHandler]);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'align',
    'blockquote', 'code-block',
    'link', 'image', 'video'
  ];

  return (
    <div className={`rich-text-editor-container bg-white rounded-lg border border-slate-200 overflow-hidden ${className}`}>
      {/* We add a specific class so we can ignore drag events on the editor */}
      <div 
        className="nodrag" 
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <ReactQuill
          ref={reactQuillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          className="border-none"
        />
      </div>
      <style>{`
        .rich-text-editor-container .ql-toolbar {
          border: none !important;
          border-bottom: 1px solid #e2e8f0 !important;
          background: #f8fafc;
        }
        .rich-text-editor-container .ql-container {
          border: none !important;
          font-family: inherit;
          font-size: 14px;
        }
        .rich-text-editor-container .ql-editor {
          min-height: 120px;
        }
      `}</style>
    </div>
  );
};
