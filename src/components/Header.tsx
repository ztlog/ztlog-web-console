'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { authApi } from '@/lib/api/auth';
import { AuthExpiredError } from '@/lib/api/client';
import Link from 'next/link';
import Image from 'next/image';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

const UNREAD_NOTIFICATION_COUNT = 3;

export default function Header({ onToggleSidebar, sidebarOpen }: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const router = useRouter();
  const { logout } = useAuth();

  const notificationsButtonRef = useRef<HTMLButtonElement>(null);
  const notificationsMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  function handleHeaderSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = headerSearch.trim();
    if (q) {
      router.push(`/admin/contents?q=${encodeURIComponent(q)}&type=TITLE_CONTENT`);
    }
  }

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch (e) {
      // 로그아웃 API 실패해도 로컬 토큰은 제거
      if (e instanceof AuthExpiredError) {
        // Already logged out
      }
    }
    logout();
  }

  function closeMenus() {
    setShowNotifications(false);
    setShowProfileMenu(false);
  }

  // Escape로 열린 메뉴 닫기 + 트리거 버튼으로 포커스 복귀
  useEffect(() => {
    if (!showNotifications && !showProfileMenu) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (showNotifications) {
        setShowNotifications(false);
        notificationsButtonRef.current?.focus();
      }
      if (showProfileMenu) {
        setShowProfileMenu(false);
        profileButtonRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showNotifications, showProfileMenu]);

  // 메뉴가 열리면 첫 항목으로 포커스 이동
  useEffect(() => {
    if (showNotifications) {
      notificationsMenuRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    }
  }, [showNotifications]);

  useEffect(() => {
    if (showProfileMenu) {
      profileMenuRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    }
  }, [showProfileMenu]);

  const focusRing =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 rounded-lg';

  return (
    <>
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-10">
        {/* Left: Hamburger + Search */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? '사이드바 메뉴 닫기' : '사이드바 메뉴 열기'}
            aria-expanded={sidebarOpen}
            aria-controls="primary-sidebar"
            className={`lg:hidden text-text-light hover:text-text transition-colors ${focusRing}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <form onSubmit={handleHeaderSearch} className="hidden sm:flex items-center bg-bg rounded-lg px-3 py-2">
            <label htmlFor="header-search" className="sr-only">게시물 검색</label>
            <svg className="w-4 h-4 text-text-light mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              id="header-search"
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="검색..."
              className="bg-transparent border-none outline-none text-sm text-text w-48"
            />
          </form>
        </div>

        {/* Right: Notifications + Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative">
            <button
              ref={notificationsButtonRef}
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              aria-haspopup="menu"
              aria-expanded={showNotifications}
              aria-controls="notification-menu"
              aria-label={`알림, 읽지 않은 알림 ${UNREAD_NOTIFICATION_COUNT}개`}
              className={`relative p-2 text-text-light hover:text-text transition-colors ${focusRing}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span
                aria-hidden="true"
                className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger rounded-full text-white text-[10px] flex items-center justify-center"
              >
                {UNREAD_NOTIFICATION_COUNT}
              </span>
            </button>

            {showNotifications && (
              <div
                id="notification-menu"
                ref={notificationsMenuRef}
                role="menu"
                aria-label="알림"
                className="absolute right-0 top-full mt-2 w-72 bg-card rounded-lg shadow-lg border border-border py-2"
              >
                <div className="px-4 py-2 border-b border-border">
                  <h4 className="text-sm font-semibold text-text">알림</h4>
                </div>
                <div className="py-1">
                  <Link href="/admin" role="menuitem" className={`block px-4 py-2.5 hover:bg-bg transition-colors ${focusRing}`}>
                    <p className="text-sm text-text">새 댓글이 등록되었습니다</p>
                    <p className="text-xs text-text-light mt-0.5">5분 전</p>
                  </Link>
                  <Link href="/admin" role="menuitem" className={`block px-4 py-2.5 hover:bg-bg transition-colors ${focusRing}`}>
                    <p className="text-sm text-text">게시물이 발행되었습니다</p>
                    <p className="text-xs text-text-light mt-0.5">12분 전</p>
                  </Link>
                  <Link href="/admin" role="menuitem" className={`block px-4 py-2.5 hover:bg-bg transition-colors ${focusRing}`}>
                    <p className="text-sm text-text">새로운 방문자 알림</p>
                    <p className="text-xs text-text-light mt-0.5">1시간 전</p>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              ref={profileButtonRef}
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              aria-haspopup="menu"
              aria-expanded={showProfileMenu}
              aria-controls="profile-menu"
              className={`flex items-center gap-2 hover:bg-bg rounded-lg px-2 py-1.5 transition-colors ${focusRing}`}
            >
              <Image src="/profile.png" alt="" width={32} height={32} className="rounded-full object-cover" />
              <span className="hidden sm:block text-sm text-text font-medium">Admin</span>
              <svg className="w-4 h-4 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showProfileMenu && (
              <div
                id="profile-menu"
                ref={profileMenuRef}
                role="menu"
                aria-label="프로필 메뉴"
                className="absolute right-0 top-full mt-2 w-48 bg-card rounded-lg shadow-lg border border-border py-2"
              >
                <Link
                  href="/admin/profile"
                  role="menuitem"
                  className={`block px-4 py-2 text-sm text-text hover:bg-bg transition-colors ${focusRing}`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    프로필
                  </span>
                </Link>
                <Link
                  href="/admin/settings"
                  role="menuitem"
                  className={`block px-4 py-2 text-sm text-text hover:bg-bg transition-colors ${focusRing}`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    설정
                  </span>
                </Link>
                <div className="border-t border-border my-1"></div>
                <button
                  onClick={handleLogout}
                  role="menuitem"
                  className={`w-full text-left block px-4 py-2 text-sm text-danger hover:bg-bg transition-colors ${focusRing}`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    로그아웃
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Backdrop */}
      {(showNotifications || showProfileMenu) && (
        <div className="fixed inset-0 z-5" onClick={closeMenus} aria-hidden="true" />
      )}
    </>
  );
}
