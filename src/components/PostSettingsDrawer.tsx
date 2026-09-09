'use client';

import { useEffect, useRef } from 'react';
import TagSelector from '@/components/TagSelector';

interface FlatCategory {
  cateNo: number;
  cateNm: string;
  _depth: number;
}

interface PostSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  heading: string;
  categories: FlatCategory[];
  categoryError?: string;
  selectedCateNo: number | null;
  onCateNoChange: (cateNo: number | null) => void;
  selectedTags: number[];
  onTagsChange: (tags: number[]) => void;
  onSubmit: () => void;
  submitLabel: string;
  saving?: boolean;
}

export default function PostSettingsDrawer({
  open,
  onClose,
  heading,
  categories,
  categoryError,
  selectedCateNo,
  onCateNoChange,
  selectedTags,
  onTagsChange,
  onSubmit,
  submitLabel,
  saving = false,
}: PostSettingsDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = 'post-settings-drawer-heading';

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative h-full w-full max-w-sm bg-card border-l border-border shadow-xl flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 id={titleId} className="text-base font-semibold text-text">{heading}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="설정 패널 닫기"
            className="p-1.5 rounded text-text-light hover:bg-bg hover:text-text transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          <div>
            <h3 id="post-settings-category-label" className="mb-2 text-sm font-semibold tracking-wider uppercase text-text">카테고리</h3>
            {categoryError && <p className="mb-2 text-xs text-danger" role="alert">{categoryError}</p>}
            <select
              aria-labelledby="post-settings-category-label"
              value={selectedCateNo ?? ''}
              onChange={(e) => onCateNoChange(e.target.value ? Number(e.target.value) : null)}
              disabled={saving}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50"
            >
              <option value="">카테고리 없음</option>
              {categories.map((cat) => (
                <option key={cat.cateNo} value={cat.cateNo}>
                  {'  '.repeat(cat._depth)}{cat.cateNm}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold tracking-wider uppercase text-text">태그</h3>
            <TagSelector selectedTags={selectedTags} onChange={onTagsChange} disabled={saving} />
          </div>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 bg-bg text-text-light rounded-lg font-medium text-sm hover:bg-border transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className="flex-1 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {saving ? '저장 중...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
