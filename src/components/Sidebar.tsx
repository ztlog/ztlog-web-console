'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface MenuItem {
  label: string;
  href?: string;
  icon?: string;
  children?: { label: string; href: string }[];
}

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const menuItems: MenuItem[] = [
  {
    label: '대시보드',
    href: '/admin',
    icon: 'dashboard'
  },
  {
    label: '게시물',
    icon: 'article',
    children: [
      { label: '목록', href: '/admin/contents' },
      { label: '새 글 작성', href: '/admin/contents/new' }
    ]
  },
  {
    label: '카테고리',
    href: '/admin/categories',
    icon: 'folder'
  },
  {
    label: '태그',
    href: '/admin/tags',
    icon: 'category'
  },
  {
    label: '통계',
    href: '/admin/stats',
    icon: 'chart'
  },
  {
    label: '프로필',
    href: '/admin/profile',
    icon: 'profile'
  },
  {
    label: '설정',
    href: '/admin/settings',
    icon: 'settings'
  }
];

export default function Sidebar({ open, onOpenChange }: SidebarProps) {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({ '게시물': true });

  // lg 미만에서 사이드바가 닫혀 있으면 화면 밖으로 밀려 보이지 않지만 DOM에는 남아 있어
  // 키보드 Tab / 스크린리더가 숨겨진 메뉴로 들어갈 수 있다. 이때 inert로 상호작용을 차단한다.
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  const inert = !open && !isDesktop;

  function toggleMenu(label: string) {
    setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }));
  }

  function isActive(href: string) {
    return pathname === href;
  }

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="primary-sidebar"
        inert={inert || undefined}
        className={`fixed top-0 left-0 h-full w-64 bg-sidebar z-30 transition-transform duration-300 flex flex-col
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <Link href="/admin">
            <Image src="/logo.png" alt="ZTLog" width={40} height={40} />
          </Link>
        </div>

        {/* Navigation */}
        <nav aria-label="주 메뉴" className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.label}>
                {item.children ? (
                  // Parent menu with children
                  <>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      aria-expanded={!!expandedMenus[item.label]}
                      aria-controls={`submenu-${item.label}`}
                      className="w-full flex items-center justify-between px-6 py-3 text-sm text-gray-300 hover:bg-sidebar-hover hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2"
                    >
                      <span className="flex items-center gap-3">
                        {item.icon === 'article' && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        )}
                        {item.label}
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform ${expandedMenus[item.label] ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                    {expandedMenus[item.label] && (
                      <ul id={`submenu-${item.label}`} className="bg-black/20">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              aria-current={isActive(child.href) ? 'page' : undefined}
                              className={`block pl-14 pr-6 py-2.5 text-sm transition-colors
                                ${isActive(child.href) ? 'text-white bg-sidebar-active' : 'text-gray-400 hover:text-white hover:bg-sidebar-hover'}`}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  // Single menu item
                  <Link
                    href={item.href!}
                    aria-current={isActive(item.href!) ? 'page' : undefined}
                    className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors
                      ${isActive(item.href!) ? 'text-white bg-sidebar-active border-r-3 border-primary' : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'}`}
                  >
                    {item.icon === 'dashboard' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                        />
                      </svg>
                    )}
                    {item.icon === 'folder' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                        />
                      </svg>
                    )}
                    {item.icon === 'category' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                    )}
                    {item.icon === 'profile' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    )}
                    {item.icon === 'chart' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    )}
                    {item.icon === 'settings' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2">
            <Image src="/profile.png" alt="profile" width={32} height={32} className="rounded-full object-cover" />
            <div>
              <p className="text-white text-sm font-medium">Admin</p>
              <p className="text-gray-400 text-xs">관리자</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
