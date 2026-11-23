import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationsService, type AppNotification } from '../../lib/api/notifications.service'
import { getStoredSession } from '../../lib/auth'
import { Skeleton } from '../ui/feedback'

export function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const signedIn = Boolean(getStoredSession()?.user)

  const refreshCount = useCallback(() => {
    if (!signedIn) return
    notificationsService.unreadCount().then(setUnread).catch(() => undefined)
  }, [signedIn])

  useEffect(() => {
    refreshCount()
    const timer = window.setInterval(refreshCount, 60_000)
    return () => window.clearInterval(timer)
  }, [refreshCount])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const toggle = async () => {
    const next = !open
    setOpen(next)
    if (next) {
      setLoading(true)
      try {
        const list = await notificationsService.list()
        setItems(list)
        setUnread(list.filter((n) => !n.read).length)
      } finally {
        setLoading(false)
      }
    }
  }

  const openNotification = async (notification: AppNotification) => {
    if (!notification.read) {
      await notificationsService.markRead(notification._id).catch(() => undefined)
      setItems((current) => current.map((n) => (n._id === notification._id ? { ...n, read: true } : n)))
      setUnread((count) => Math.max(0, count - 1))
    }
    setOpen(false)
    if (notification.link) navigate(notification.link)
  }

  const markAll = async () => {
    await notificationsService.markAllRead().catch(() => undefined)
    setItems((current) => current.map((n) => ({ ...n, read: true })))
    setUnread(0)
  }

  if (!signedIn) return null

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => void toggle()}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
        aria-expanded={open}
        className="focus-ring relative flex h-9 w-9 items-center justify-center border border-line text-ink-soft transition-colors hover:border-ink hover:text-ink"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unread > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center bg-accent px-1 font-mono text-[8px] font-medium text-accent-ink">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-50 w-80 border border-line bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Notifications</span>
            {unread > 0 ? (
              <button type="button" onClick={() => void markAll()} className="font-mono text-[9px] uppercase tracking-[0.1em] text-accent hover:underline">
                Mark all read
              </button>
            ) : null}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {loading ? (
              <li className="space-y-3 px-4 py-3" role="status" aria-label="Loading notifications">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index}>
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="mt-1.5 h-3 w-full" />
                  </div>
                ))}
              </li>
            ) : !items.length ? (
              <li className="px-4 py-6 text-center text-xs text-muted">You're all caught up.</li>
            ) : (
              items.map((notification) => (
                <li key={notification._id}>
                  <button
                    type="button"
                    onClick={() => void openNotification(notification)}
                    className={`block w-full px-4 py-3 text-left transition-colors hover:bg-canvas-alt ${notification.read ? 'opacity-60' : ''}`}
                  >
                    <span className="flex items-start gap-2">
                      {!notification.read ? <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /> : <span className="mt-1.5 h-1.5 w-1.5 shrink-0" />}
                      <span>
                        <span className="block text-[12px] font-medium text-ink">{notification.title}</span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-muted">{notification.body}</span>
                        <span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-muted">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
