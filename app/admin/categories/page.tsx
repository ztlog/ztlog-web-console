'use client';

import { useEffect, useState } from 'react';
import { categoriesApi } from '@/lib/api/categories';
import { Category } from '@/lib/api/types';
import ConfirmModal from '@/components/ConfirmModal';
import AlertMessage from '@/components/AlertMessage';

// ── Helpers ───────────────────────────────────────────────────────────────────

function flattenTree(cats: Category[], depth = 0): { cat: Category; depth: number }[] {
  return cats.flatMap(c => [
    { cat: c, depth },
    ...flattenTree(c.categories ?? [], depth + 1),
  ]);
}

function descendantIds(cat: Category): Set<number> {
  const ids = new Set<number>([cat.cateNo]);
  for (const child of cat.categories ?? []) {
    descendantIds(child).forEach(id => ids.add(id));
  }
  return ids;
}

// ── Add Panel ─────────────────────────────────────────────────────────────────

interface AddPanelProps {
  allFlat: { cat: Category; depth: number }[];
  addName: string;
  addParent: number | null;
  addDispOrd: number | '';
  saving: boolean;
  onNameChange: (v: string) => void;
  onParentChange: (v: number | null) => void;
  onDispOrdChange: (v: number | '') => void;
  onSave: () => void;
  onCancel: () => void;
}

function AddPanel({
  allFlat, addName, addParent, addDispOrd, saving,
  onNameChange, onParentChange, onDispOrdChange, onSave, onCancel,
}: AddPanelProps) {
  return (
    <div className="mb-4 p-4 bg-card border border-primary/20 rounded-lg shadow-sm">
      <p className="text-xs font-semibold text-text-light mb-3 uppercase tracking-wider">카테고리 추가</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        {/* 카테고리명 */}
        <div className="flex flex-col gap-1">
          <label htmlFor="cat-add-name" className="text-xs font-medium text-text-light">카테고리명 *</label>
          <input
            id="cat-add-name"
            type="text"
            value={addName}
            onChange={e => onNameChange(e.target.value)}
            placeholder="이름 입력"
            autoFocus
            maxLength={50}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); onSave(); }
              if (e.key === 'Escape') onCancel();
            }}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-white text-text
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {/* 상위 카테고리 */}
        <div className="flex flex-col gap-1">
          <label htmlFor="cat-add-parent" className="text-xs font-medium text-text-light">상위 카테고리</label>
          <select
            id="cat-add-parent"
            value={addParent ?? ''}
            onChange={e => onParentChange(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-white text-text
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="">없음 (루트 카테고리)</option>
            {allFlat.map(({ cat, depth }) => (
              <option key={cat.cateNo} value={cat.cateNo}>
                {'　'.repeat(depth)}{depth > 0 ? '└ ' : ''}{cat.cateNm}
              </option>
            ))}
          </select>
        </div>

        {/* 노출 순서 */}
        <div className="flex flex-col gap-1">
          <label htmlFor="cat-add-disp-ord" className="text-xs font-medium text-text-light">노출 순서</label>
          <input
            id="cat-add-disp-ord"
            type="number"
            value={addDispOrd}
            onChange={e => onDispOrdChange(e.target.value ? Number(e.target.value) : '')}
            placeholder="순서"
            min={1}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-white text-text
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          disabled={saving || !addName.trim()}
          className="px-4 py-1.5 bg-primary text-white text-sm font-medium rounded-lg
            hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          추가
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 text-text-light text-sm border border-border rounded-lg
            hover:bg-bg hover:text-text transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  );
}

// ── Edit Panel ────────────────────────────────────────────────────────────────

interface EditPanelProps {
  cat: Category;
  editName: string;
  editUpperCateNo: number | null;
  editDispOrd: number | '';
  editUseYn: 'Y' | 'N';
  allFlat: { cat: Category; depth: number }[];
  saving: boolean;
  onNameChange: (v: string) => void;
  onUpperChange: (v: number | null) => void;
  onDispOrdChange: (v: number | '') => void;
  onUseYnChange: (v: 'Y' | 'N') => void;
  onSave: () => void;
  onCancel: () => void;
}

function EditPanel({
  cat, editName, editUpperCateNo, editDispOrd, editUseYn,
  allFlat, saving,
  onNameChange, onUpperChange, onDispOrdChange, onUseYnChange,
  onSave, onCancel,
}: EditPanelProps) {
  const excluded = descendantIds(cat);
  const parentOptions = allFlat.filter(({ cat: c }) => !excluded.has(c.cateNo));

  return (
    <div className="ml-7 mt-1 mb-2 p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 카테고리명 */}
        <div className="flex flex-col gap-1">
          <label htmlFor="cat-edit-name" className="text-xs font-medium text-text-light">카테고리명</label>
          <input
            id="cat-edit-name"
            type="text"
            value={editName}
            onChange={e => onNameChange(e.target.value)}
            autoFocus
            maxLength={50}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); onSave(); }
              if (e.key === 'Escape') onCancel();
            }}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-white text-text
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {/* 상위 카테고리 */}
        <div className="flex flex-col gap-1">
          <label htmlFor="cat-edit-parent" className="text-xs font-medium text-text-light">상위 카테고리</label>
          <select
            id="cat-edit-parent"
            value={editUpperCateNo ?? ''}
            onChange={e => onUpperChange(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-white text-text
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="">없음 (루트)</option>
            {parentOptions.map(({ cat: c, depth }) => (
              <option key={c.cateNo} value={c.cateNo}>
                {'　'.repeat(depth)}{depth > 0 ? '└ ' : ''}{c.cateNm}
              </option>
            ))}
          </select>
        </div>

        {/* 노출 순서 */}
        <div className="flex flex-col gap-1">
          <label htmlFor="cat-edit-disp-ord" className="text-xs font-medium text-text-light">노출 순서</label>
          <input
            id="cat-edit-disp-ord"
            type="number"
            value={editDispOrd}
            onChange={e => onDispOrdChange(e.target.value ? Number(e.target.value) : '')}
            placeholder="미입력 시 자동"
            min={1}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-white text-text
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {/* 사용 여부 */}
        <div className="flex flex-col gap-1">
          <span id="cat-edit-useyn-label" className="text-xs font-medium text-text-light">사용 여부</span>
          <div className="flex gap-2" role="group" aria-labelledby="cat-edit-useyn-label">
            {(['Y', 'N'] as const).map(v => (
              <button
                key={v}
                type="button"
                onClick={() => onUseYnChange(v)}
                aria-pressed={editUseYn === v}
                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors
                  ${editUseYn === v
                    ? v === 'Y'
                      ? 'bg-success/10 text-success border-success/30'
                      : 'bg-danger/10 text-danger border-danger/30'
                    : 'bg-white text-text-light border-border hover:bg-bg'}`}
              >
                {v === 'Y' ? '사용' : '미사용'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onSave}
          disabled={saving || !editName.trim()}
          className="px-4 py-1.5 bg-primary text-white text-sm font-medium rounded-lg
            hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          저장
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 text-text-light text-sm border border-border rounded-lg
            hover:bg-bg hover:text-text transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  );
}

// ── Tree Node ─────────────────────────────────────────────────────────────────

interface NodeProps {
  cat: Category;
  depth: number;
  editingId: number | null;
  editName: string;
  editUpperCateNo: number | null;
  editDispOrd: number | '';
  editUseYn: 'Y' | 'N';
  allFlat: { cat: Category; depth: number }[];
  saving: boolean;
  onStartEdit: (cat: Category) => void;
  onEditNameChange: (v: string) => void;
  onEditUpperChange: (v: number | null) => void;
  onEditDispOrdChange: (v: number | '') => void;
  onEditUseYnChange: (v: 'Y' | 'N') => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (cateNo: number) => void;
  onOpenAdd: (parentCateNo: number | null) => void;
}

function CategoryNode({
  cat, depth,
  editingId, editName, editUpperCateNo, editDispOrd, editUseYn, allFlat,
  saving,
  onStartEdit, onEditNameChange, onEditUpperChange, onEditDispOrdChange, onEditUseYnChange,
  onSaveEdit, onCancelEdit,
  onDelete, onOpenAdd,
}: NodeProps) {
  const [expanded, setExpanded] = useState(true);
  const isEditing = editingId === cat.cateNo;
  const hasChildren = (cat.categories?.length ?? 0) > 0;

  const sharedChildProps = {
    editingId, editName, editUpperCateNo, editDispOrd, editUseYn, allFlat, saving,
    onStartEdit, onEditNameChange, onEditUpperChange, onEditDispOrdChange, onEditUseYnChange,
    onSaveEdit, onCancelEdit, onDelete, onOpenAdd,
  };

  return (
    <div className="select-none">
      {/* Node row */}
      <div
        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors group
          ${isEditing ? 'bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-bg/60'}`}
      >
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
          aria-label={`${cat.cateNm} 하위 카테고리 ${expanded ? '접기' : '펼치기'}`}
          tabIndex={hasChildren ? 0 : -1}
          className={`w-5 h-5 flex items-center justify-center rounded shrink-0 transition-colors
            text-text-light hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${!hasChildren ? 'invisible pointer-events-none' : ''}`}
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Folder icon */}
        <svg
          aria-hidden="true"
          className={`w-4 h-4 shrink-0 ${depth === 0 ? 'text-primary' : 'text-text-light'}`}
          fill={expanded && hasChildren ? 'currentColor' : 'none'}
          stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        </svg>

        {/* Name */}
        <span
          className={`flex-1 text-sm font-medium truncate transition-colors
            ${isEditing ? 'text-primary' : 'text-text cursor-pointer hover:text-primary'}`}
          onClick={() => !isEditing && onStartEdit(cat)}
          title={cat.cateNm}
        >
          {cat.cateNm}
        </span>

        {/* Badges */}
        {cat.dispOrd != null && (
          <span className="text-xs text-text-light shrink-0">#{cat.dispOrd}</span>
        )}
        <span
          className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
            ${cat.useYn === 'Y' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}
        >
          {cat.useYn === 'Y' ? '사용' : '미사용'}
        </span>

        {/* Action buttons */}
        <div className={`flex items-center gap-0.5 shrink-0 transition-opacity
          ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {isEditing ? (
            <button
              onClick={onCancelEdit}
              aria-label={`${cat.cateNm} 수정 취소`}
              title="취소"
              className="p-1.5 text-text-light hover:text-text hover:bg-bg rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <>
              {/* 수정 */}
              <button
                onClick={() => onStartEdit(cat)}
                aria-label={`${cat.cateNm} 수정`}
                title="수정"
                className="p-1.5 text-text-light hover:text-primary hover:bg-primary/10 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              {/* 하위 추가 */}
              <button
                onClick={() => onOpenAdd(cat.cateNo)}
                aria-label={`${cat.cateNm} 하위 카테고리 추가`}
                title="하위 카테고리 추가"
                className="p-1.5 text-text-light hover:text-primary hover:bg-primary/10 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
              {/* 삭제 */}
              <button
                onClick={() => onDelete(cat.cateNo)}
                aria-label={`${cat.cateNm} 삭제`}
                title="삭제"
                className="p-1.5 text-text-light hover:text-danger hover:bg-danger/10 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-danger focus-visible:outline-offset-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Edit panel */}
      {isEditing && (
        <EditPanel
          cat={cat}
          editName={editName}
          editUpperCateNo={editUpperCateNo}
          editDispOrd={editDispOrd}
          editUseYn={editUseYn}
          allFlat={allFlat}
          saving={saving}
          onNameChange={onEditNameChange}
          onUpperChange={onEditUpperChange}
          onDispOrdChange={onEditDispOrdChange}
          onUseYnChange={onEditUseYnChange}
          onSave={onSaveEdit}
          onCancel={onCancelEdit}
        />
      )}

      {/* Children */}
      {expanded && hasChildren && (
        <div className="ml-8 pl-3 border-l border-border/40 mt-0.5 mb-0.5 space-y-0.5">
          {cat.categories!.map(child => (
            <CategoryNode
              key={child.cateNo}
              cat={child}
              depth={depth + 1}
              {...sharedChildProps}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [tree, setTree] = useState<Category[]>([]);
  const [allFlat, setAllFlat] = useState<{ cat: Category; depth: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Add state
  const [addOpen, setAddOpen] = useState(false);
  const [addParent, setAddParent] = useState<number | null>(null);
  const [addName, setAddName] = useState('');
  const [addDispOrd, setAddDispOrd] = useState<number | ''>('');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editUpperCateNo, setEditUpperCateNo] = useState<number | null>(null);
  const [editDispOrd, setEditDispOrd] = useState<number | ''>('');
  const [editUseYn, setEditUseYn] = useState<'Y' | 'N'>('Y');

  async function loadCategories() {
    setLoading(true);
    setError('');
    try {
      const res = await categoriesApi.getList();
      const data = res.data as any;
      const list: Category[] =
        data?.list || data?.content || data?.categories || (Array.isArray(data) ? data : []);
      setTree(list);
      setAllFlat(flattenTree(list));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCategories(); }, []);

  // ── Add ──
  function computeNextDispOrd(parentCateNo: number | null, currentTree: Category[]): number {
    const siblings = parentCateNo === null
      ? currentTree
      : (allFlat.find(({ cat }) => cat.cateNo === parentCateNo)?.cat.categories ?? []);
    if (siblings.length === 0) return 1;
    return Math.max(...siblings.map(c => c.dispOrd ?? 0)) + 1;
  }

  function openAdd(parentCateNo: number | null) {
    setAddOpen(true);
    setAddParent(parentCateNo);
    setAddName('');
    setAddDispOrd(computeNextDispOrd(parentCateNo, tree));
    setEditingId(null);
  }

  function handleAddParentChange(parentCateNo: number | null) {
    setAddParent(parentCateNo);
    setAddDispOrd(computeNextDispOrd(parentCateNo, tree));
  }

  async function handleSaveAdd() {
    if (!addName.trim()) return;
    const parentDepth = addParent === null
      ? -1
      : (allFlat.find(({ cat }) => cat.cateNo === addParent)?.depth ?? 0);
    setSaving(true);
    try {
      await categoriesApi.create({
        cateNm: addName.trim(),
        cateDepth: parentDepth + 2,
        upperCateNo: addParent,
        dispOrd: addDispOrd !== '' ? Number(addDispOrd) : computeNextDispOrd(addParent, tree),
        useYn: 'Y',
      });
      setAddOpen(false);
      await loadCategories();
    } catch (e: unknown) {
      setError('추가 실패: ' + (e instanceof Error ? e.message : '오류가 발생했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  // ── Edit ──
  function handleStartEdit(cat: Category) {
    setEditingId(cat.cateNo);
    setEditName(cat.cateNm);
    setEditUpperCateNo(cat.upperCateNo ?? null);
    setEditDispOrd(cat.dispOrd ?? '');
    setEditUseYn(cat.useYn);
    setAddOpen(false);
  }

  async function handleSaveEdit() {
    if (!editName.trim() || editingId === null) return;
    const newDepth = editUpperCateNo === null
      ? 1
      : (allFlat.find(({ cat }) => cat.cateNo === editUpperCateNo)?.depth ?? 0) + 2;
    setSaving(true);
    try {
      await categoriesApi.update({
        cateNo: editingId,
        cateNm: editName.trim(),
        cateDepth: newDepth,
        upperCateNo: editUpperCateNo,
        dispOrd: editDispOrd !== '' ? Number(editDispOrd) : undefined,
        useYn: editUseYn,
      });
      setEditingId(null);
      await loadCategories();
    } catch (e: unknown) {
      setError('수정 실패: ' + (e instanceof Error ? e.message : '오류가 발생했습니다.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cateNo: number) {
    setError('');
    try {
      await categoriesApi.delete(cateNo);
      await loadCategories();
    } catch (e: unknown) {
      setError('삭제 실패: ' + (e instanceof Error ? e.message : '오류가 발생했습니다.'));
    } finally {
      setConfirmDelete(null);
    }
  }

  const sharedNodeProps = {
    editingId, editName, editUpperCateNo, editDispOrd, editUseYn, allFlat, saving,
    onStartEdit: handleStartEdit,
    onEditNameChange: setEditName,
    onEditUpperChange: setEditUpperCateNo,
    onEditDispOrdChange: setEditDispOrd,
    onEditUseYnChange: setEditUseYn,
    onSaveEdit: handleSaveEdit,
    onCancelEdit: () => setEditingId(null),
    onDelete: (cateNo: number) => setConfirmDelete(cateNo),
    onOpenAdd: openAdd,
  };

  return (
    <div>
      {confirmDelete !== null && (
        <ConfirmModal
          message={'정말 삭제하시겠습니까?\n하위 카테고리도 함께 삭제될 수 있습니다.'}
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">카테고리 관리</h1>
          <p className="mt-1 text-sm text-text-light">블로그 카테고리를 추가, 수정, 삭제합니다</p>
        </div>
        <button
          onClick={() => openAdd(null)}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium
            hover:bg-primary-hover transition-colors inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          카테고리 추가
        </button>
      </div>

      {/* Add panel */}
      {addOpen && (
        <AddPanel
          allFlat={allFlat}
          addName={addName}
          addParent={addParent}
          addDispOrd={addDispOrd}
          saving={saving}
          onNameChange={setAddName}
          onParentChange={handleAddParentChange}
          onDispOrdChange={setAddDispOrd}
          onSave={handleSaveAdd}
          onCancel={() => setAddOpen(false)}
        />
      )}

      {/* Tree */}
      {loading ? (
        <div role="status" aria-live="polite" className="flex items-center justify-center py-20">
          <div className="text-text-light">로딩 중...</div>
        </div>
      ) : error ? (
        <AlertMessage message={error} />
      ) : tree.length === 0 ? (
        <div className="p-12 text-center border rounded-lg bg-card border-border">
          <p className="text-text-light text-sm">등록된 카테고리가 없습니다.</p>
          <p className="text-text-light text-xs mt-1">우측 상단의 버튼으로 추가해보세요.</p>
        </div>
      ) : (
        <div className="p-4 border rounded-lg shadow-sm bg-card border-border space-y-1">
          {tree.map(cat => (
            <CategoryNode
              key={cat.cateNo}
              cat={cat}
              depth={0}
              {...sharedNodeProps}
            />
          ))}
        </div>
      )}
    </div>
  );
}
