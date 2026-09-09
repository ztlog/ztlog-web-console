'use client';

import { useEffect, useState } from 'react';
import { statsApi, ViewRankingItem, DailyGrowthItem, CommentStatsItem } from '@/lib/api/stats';
import AlertMessage from '@/components/AlertMessage';

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getSevenDaysAgo() {
  return new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

type ActionStatus = 'idle' | 'loading' | 'success' | 'error';

const ACTION_LABELS: Record<ActionStatus, string> = {
  idle: '',
  loading: '실행 중...',
  success: '완료',
  error: '오류 발생',
};

function actionButtonClass(status: ActionStatus) {
  const base = 'px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border';
  if (status === 'success') return `${base} bg-success/10 text-success border-success/30`;
  if (status === 'error') return `${base} bg-danger/10 text-danger border-danger/30`;
  return `${base} bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 disabled:opacity-50`;
}

const VIEW_RANKING_COLUMNS: (keyof ViewRankingItem)[] = ['ctntNo', 'title', 'totalViewCnt', 'todayViewCnt', 'viewCnt'];
const DAILY_GROWTH_COLUMNS: (keyof DailyGrowthItem)[] = ['statDate', 'baseDate', 'viewCnt', 'commentCnt', 'totalViewCnt', 'totalCommentCnt'];
const COMMENT_STATS_COLUMNS: (keyof CommentStatsItem)[] = ['ctntNo', 'title', 'commentCnt', 'totalCommentCnt'];

const COLUMN_LABELS: Record<string, string> = {
  ctntNo: '번호',
  title: '제목',
  totalViewCnt: '누적 조회수',
  todayViewCnt: '오늘 조회수',
  viewCnt: '조회수',
  statDate: '날짜',
  baseDate: '날짜',
  commentCnt: '댓글수',
  totalCommentCnt: '누적 댓글수',
};

interface DataTableProps<T extends object> {
  rows: T[];
  columns?: string[];
  loading?: boolean;
}

function DataTable<T extends object>({ rows, columns, loading }: DataTableProps<T>) {
  if (loading || rows.length === 0) {
    return (
      <div className="tbl-empty" role="status" aria-live="polite">
        {loading ? '조회 중...' : '데이터가 없습니다.'}
      </div>
    );
  }
  const records = rows as ReadonlyArray<Record<string, unknown>>;
  const keys = columns ? columns.filter(k => k in records[0]) : Object.keys(records[0]);
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {keys.map(k => (
              <th key={k} scope="col" className="tbl-th">{COLUMN_LABELS[k] ?? k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((row, i) => (
            <tr key={i} className="tbl-tr">
              {keys.map(k => (
                <td key={k} className="tbl-td">
                  {Array.isArray(row[k]) ? (row[k] as unknown[]).join(', ') : String(row[k] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function StatsPage() {
  const [viewRanking, setViewRanking] = useState<ViewRankingItem[]>([]);
  const [dailyGrowth, setDailyGrowth] = useState<DailyGrowthItem[]>([]);
  const [commentStats, setCommentStats] = useState<CommentStatsItem[]>([]);
  const [startDate, setStartDate] = useState(getSevenDaysAgo);
  const [endDate, setEndDate] = useState(getToday);
  const [loading, setLoading] = useState(true);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionStatus, setActionStatus] = useState<Record<string, ActionStatus>>({});

  useEffect(() => {
    loadInitialData();
    loadDailyGrowth();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    setError('');
    try {
      const [rankingRes, commentRes] = await Promise.allSettled([
        statsApi.getViewRanking(),
        statsApi.getCurrentComments(),
      ]);

      if (rankingRes.status === 'fulfilled' && rankingRes.value?.data) {
        const d = rankingRes.value.data as any;
        setViewRanking(d.list ?? d.content ?? (Array.isArray(d) ? d : []));
      }

      if (commentRes.status === 'fulfilled' && commentRes.value?.data) {
        const d = commentRes.value.data as any;
        setCommentStats(d.list ?? d.content ?? (Array.isArray(d) ? d : []));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function loadDailyGrowth() {
    setDailyLoading(true);
    try {
      const res = await statsApi.getDailyGrowth(startDate, endDate);
      if (res?.data) {
        const d = res.data as any;
        setDailyGrowth(d.list ?? d.content ?? (Array.isArray(d) ? d : []));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setDailyLoading(false);
    }
  }

  async function runAction(key: string, fn: () => Promise<any>) {
    setActionStatus(prev => ({ ...prev, [key]: 'loading' }));
    try {
      await fn();
      setActionStatus(prev => ({ ...prev, [key]: 'success' }));
    } catch {
      setActionStatus(prev => ({ ...prev, [key]: 'error' }));
    } finally {
      setTimeout(() => setActionStatus(prev => ({ ...prev, [key]: 'idle' })), 3000);
    }
  }

  const actions = [
    { key: 'syncTotalViews', label: '누적 조회수 업데이트', fn: () => statsApi.syncTotalViews() },
    { key: 'collectDailyStats', label: '일별 통계 기록', fn: () => statsApi.collectDailyStats() },
    { key: 'syncCommentStats', label: '실시간 댓글 통계 업데이트', fn: () => statsApi.syncCommentStats() },
    { key: 'collectViewRawLogs', label: '조회수 로우 데이터 추출', fn: () => statsApi.collectViewRawLogs(startDate, endDate) },
  ];

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">통계</h1>
          <p className="page-subtitle">블로그 통계 데이터를 확인하세요</p>
        </div>
        <div role="status" aria-live="polite" className="flex items-center justify-center py-20">
          <div className="text-text-light">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">통계</h1>
        <p className="page-subtitle">블로그 통계 데이터를 확인하세요</p>
      </div>

      {error && <AlertMessage message={error} />}

      {/* 집계 실행 액션 */}
      <div className="card p-6 mb-6">
        <h2 className="card-title mb-4">통계 집계 실행</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {actions.map(({ key, label, fn }) => {
            const status = actionStatus[key] ?? 'idle';
            return (
              <button
                key={key}
                onClick={() => runAction(key, fn)}
                disabled={status === 'loading'}
                className={actionButtonClass(status)}
              >
                {status === 'idle' ? label : ACTION_LABELS[status]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 일별 성장 통계 */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title">일별 성장 통계</h2>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="input-date"
            />
            <span className="text-text-light text-sm">~</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="input-date"
            />
            <button onClick={loadDailyGrowth} disabled={dailyLoading} className="btn-primary">
              {dailyLoading ? '조회 중...' : '조회'}
            </button>
          </div>
        </div>
        <DataTable rows={dailyGrowth} columns={DAILY_GROWTH_COLUMNS} loading={dailyLoading} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 조회수 랭킹 */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">조회수 통계 현황</h2>
            <button onClick={loadInitialData} className="btn-ghost">새로고침</button>
          </div>
          <DataTable rows={viewRanking} columns={VIEW_RANKING_COLUMNS} />
        </div>

        {/* 댓글 통계 */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">실시간 댓글 통계</h2>
            <button onClick={loadInitialData} className="btn-ghost">새로고침</button>
          </div>
          <DataTable rows={commentStats} columns={COMMENT_STATS_COLUMNS} />
        </div>
      </div>
    </div>
  );
}
