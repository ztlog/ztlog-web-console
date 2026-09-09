'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { authApi } from '@/lib/api/auth';

export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  async function handleLogin(e: FormEvent) {
    e.preventDefault();

    if (!userId || !password) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authApi.login(userId, password);
      if (res.code === 'SUCCESS' && res.data) {
        login(res.data);
        router.push('/admin');
      } else {
        setError(res.message || '로그인에 실패했습니다.');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text">
            <span className="text-primary">ZT</span>Log Admin
          </h1>
          <p className="text-text-light mt-2">관리자 계정으로 로그인하세요</p>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-lg shadow-lg border border-border p-8">
          {error && (
            <div id="login-error" role="alert" className="mb-4 p-3 bg-danger/10 text-danger text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} noValidate>
            <div className="mb-5">
              <label htmlFor="userId" className="block text-sm font-medium text-text mb-1.5">
                아이디
              </label>
              <input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="아이디를 입력하세요"
                autoComplete="username"
                required
                aria-invalid={!!error}
                aria-describedby={error ? 'login-error' : undefined}
                disabled={loading}
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm text-text bg-white
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors
                  disabled:opacity-50"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-text mb-1.5">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
                required
                aria-invalid={!!error}
                aria-describedby={error ? 'login-error' : undefined}
                disabled={loading}
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm text-text bg-white
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors
                  disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-white rounded-lg font-medium text-sm
                hover:bg-primary-hover transition-colors
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-text-light mt-6">
          &copy; 2025 ZTLog. All rights reserved.
        </p>
      </div>
    </div>
  );
}
