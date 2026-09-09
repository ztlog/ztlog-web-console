'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Markdown } from 'tiptap-markdown';
import { common, createLowlight } from 'lowlight';
import { useCallback, useEffect, useRef, useState } from 'react';

const lowlight = createLowlight(common);

interface TipTapEditorProps {
  /** 마크다운 문자열 — 블로그(ztlog-web-ui)가 마크다운 렌더러를 쓰므로 이 포맷으로 저장한다. */
  value: string;
  onChange: (markdown: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

type ToolbarButtonProps = {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
};

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      // 마우스 클릭 시 에디터 선택 영역이 풀리는 것만 막고, 실제 실행은 onClick에서 처리한다.
      // (onMouseDown에서 실행하면 키보드 Enter/Space로는 동작하지 않아 접근성이 깨진다)
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`p-1.5 rounded text-sm transition-colors
        ${active ? 'bg-primary text-white' : 'text-text-light hover:bg-border hover:text-text'}
        disabled:opacity-40 disabled:cursor-not-allowed
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-1 self-center" aria-hidden="true" />;
}

export default function TipTapEditor({ value, onChange, disabled = false, placeholder = '내용을 입력하세요...' }: TipTapEditorProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);

  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const imageUrlInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, link: false, underline: false }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false }),
      ImageExtension.configure({ HTMLAttributes: { loading: 'lazy' } }),
      CodeBlockLowlight.configure({ lowlight }),
      Markdown,
    ],
    content: value,
    immediatelyRender: false,
    editable: !disabled,
    editorProps: {
      attributes: {
        'aria-label': '본문 내용',
        'aria-multiline': 'true',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.storage.markdown.getMarkdown());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.storage.markdown.getMarkdown()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  const openLinkInput = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href ?? '';
    setLinkUrl(prev);
    setShowImageInput(false);
    setShowLinkInput(true);
    setTimeout(() => linkInputRef.current?.focus(), 0);
  }, [editor]);

  const applyLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    }
    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const cancelLink = useCallback(() => {
    setShowLinkInput(false);
    setLinkUrl('');
  }, []);

  const openImageInput = useCallback(() => {
    setImageUrl('');
    setImageAlt('');
    setShowLinkInput(false);
    setShowImageInput(true);
    setTimeout(() => imageUrlInputRef.current?.focus(), 0);
  }, []);

  const applyImage = useCallback(() => {
    if (!editor) return;
    const src = imageUrl.trim();
    if (src === '') return;
    editor.chain().focus().setImage({ src, alt: imageAlt.trim() || undefined }).run();
    setShowImageInput(false);
    setImageUrl('');
    setImageAlt('');
  }, [editor, imageUrl, imageAlt]);

  const cancelImage = useCallback(() => {
    setShowImageInput(false);
    setImageUrl('');
    setImageAlt('');
  }, []);

  if (!editor) return null;

  return (
    <div className={disabled ? 'opacity-50' : ''}>
      {/* Toolbar */}
      <div
        role="toolbar"
        aria-label="서식 도구 모음"
        className="sticky top-28 z-[5] flex flex-wrap items-center gap-0.5 py-2 border-b border-border bg-bg/95 backdrop-blur"
      >
        {/* Headings */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="제목 1">H1</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="제목 2">H2</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="제목 3">H3</ToolbarButton>

        <Divider />

        {/* Inline formatting */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="굵게">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="기울임">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><line x1="19" y1="4" x2="10" y2="4" strokeWidth="2" strokeLinecap="round"/><line x1="14" y1="20" x2="5" y2="20" strokeWidth="2" strokeLinecap="round"/><line x1="15" y1="4" x2="9" y2="20" strokeWidth="2" strokeLinecap="round"/></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="밑줄">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="4" y1="21" x2="20" y2="21" strokeWidth="2" strokeLinecap="round"/></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="취소선">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round"/><path d="M16 6C16 6 14.5 4 12 4C9.5 4 7 5.5 7 8C7 10.5 9.76 11.47 12 12" strokeWidth="2" strokeLinecap="round"/><path d="M8 18C8 18 9.5 20 12 20C14.5 20 17 18.5 17 16C17 14.58 16.27 13.67 15 13" strokeWidth="2" strokeLinecap="round"/></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="인라인 코드">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><polyline points="16 18 22 12 16 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="8 6 2 12 8 18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </ToolbarButton>

        <Divider />

        {/* Alignment */}
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="왼쪽 정렬">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="12" x2="15" y2="12" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="18" x2="18" y2="18" strokeWidth="2" strokeLinecap="round"/></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="가운데 정렬">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="12" x2="18" y2="12" strokeWidth="2" strokeLinecap="round"/><line x1="4" y1="18" x2="20" y2="18" strokeWidth="2" strokeLinecap="round"/></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="오른쪽 정렬">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="12" x2="21" y2="12" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="18" x2="21" y2="18" strokeWidth="2" strokeLinecap="round"/></svg>
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="불릿 목록">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><line x1="9" y1="6" x2="20" y2="6" strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="12" x2="20" y2="12" strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="18" x2="20" y2="18" strokeWidth="2" strokeLinecap="round"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="번호 목록">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><line x1="10" y1="6" x2="21" y2="6" strokeWidth="2" strokeLinecap="round"/><line x1="10" y1="12" x2="21" y2="12" strokeWidth="2" strokeLinecap="round"/><line x1="10" y1="18" x2="21" y2="18" strokeWidth="2" strokeLinecap="round"/><text x="2" y="8" fontSize="7" fill="currentColor" fontFamily="sans-serif">1.</text><text x="2" y="14" fontSize="7" fill="currentColor" fontFamily="sans-serif">2.</text><text x="2" y="20" fontSize="7" fill="currentColor" fontFamily="sans-serif">3.</text></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="인용구">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="코드 블록">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/><polyline points="9 9 5 12 9 15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="15 9 19 12 15 15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </ToolbarButton>

        <Divider />

        {/* Link */}
        <ToolbarButton onClick={openLinkInput} active={editor.isActive('link')} title="링크">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </ToolbarButton>

        {/* Image */}
        <ToolbarButton onClick={openImageInput} title="이미지 삽입">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="2" />
            <circle cx="8.5" cy="9.5" r="1.5" strokeWidth="2" />
            <path d="M21 15l-5-5-9 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </ToolbarButton>

        <Divider />

        {/* Undo / Redo */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="실행 취소">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 14 4 9 9 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 20v-7a4 4 0 0 0-4-4H4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="다시 실행">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><polyline points="15 14 20 9 15 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 20v-7a4 4 0 0 1 4-4h12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </ToolbarButton>
      </div>

      {/* Link input panel */}
      {showLinkInput && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-bg/50">
          <label htmlFor="tiptap-link-url" className="sr-only">링크 URL</label>
          <input
            id="tiptap-link-url"
            ref={linkInputRef}
            type="url"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
              if (e.key === 'Escape') cancelLink();
            }}
            placeholder="https://example.com"
            className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <button
            type="button"
            onClick={applyLink}
            className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          >
            적용
          </button>
          <button
            type="button"
            onClick={cancelLink}
            className="px-3 py-1.5 text-sm border border-border text-text-light rounded-lg hover:bg-bg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          >
            취소
          </button>
        </div>
      )}

      {/* Image input panel */}
      {showImageInput && (
        <div className="flex flex-col gap-2 px-3 py-2.5 border-b border-border bg-bg/50">
          <div className="flex items-center gap-2">
            <label htmlFor="tiptap-image-url" className="sr-only">이미지 URL</label>
            <input
              id="tiptap-image-url"
              ref={imageUrlInputRef}
              type="url"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); applyImage(); }
                if (e.key === 'Escape') cancelImage();
              }}
              placeholder="이미지 URL (https://example.com/image.jpg)"
              className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="tiptap-image-alt" className="sr-only">대체 텍스트 (이미지 설명)</label>
            <input
              id="tiptap-image-alt"
              type="text"
              value={imageAlt}
              onChange={e => setImageAlt(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); applyImage(); }
                if (e.key === 'Escape') cancelImage();
              }}
              placeholder="대체 텍스트 (이미지 설명, 스크린리더용)"
              className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <button
              type="button"
              onClick={applyImage}
              disabled={!imageUrl.trim()}
              className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
            >
              삽입
            </button>
            <button
              type="button"
              onClick={cancelImage}
              className="px-3 py-1.5 text-sm border border-border text-text-light rounded-lg hover:bg-bg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Editor Area */}
      <EditorContent
        editor={editor}
        className="tiptap-content py-4 text-base leading-relaxed text-text focus:outline-none"
      />
    </div>
  );
}
