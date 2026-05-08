import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { communicationsApi } from '../../features/communications/api';

interface NotificationBellProps {
  href?: string;
}

export function NotificationBell({ href = '/comunicacoes' }: NotificationBellProps) {
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();

  const fetchCount = useCallback(async () => {
    try {
      const data = await communicationsApi.getUnreadCount();
      setUnread(data.count);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 60_000);
    return () => clearInterval(id);
  }, [fetchCount]);

  return (
    <button
      type="button"
      onClick={() => navigate(href)}
      className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
      title="Mensagens"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
      {unread > 0 && (
        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}
