import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClickOutside } from '../../hooks/use-click-outside'
import { clearSession, getStoredSession } from '../../lib/auth'
import { ChevronDown } from '../ui/icons'

export function ProfileMenu({ fallbackName, roleLabel }: { fallbackName: string; roleLabel: string }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const menuRef = useClickOutside<HTMLDivElement>(() => setOpen(false))
  const user = getStoredSession()?.user
  const name = user?.name || fallbackName

  const signOut = () => {
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="admin-profile"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Open ${name} profile menu`}
      >
        <span className="admin-avatar">{name.charAt(0).toUpperCase()}</span>
        <span className="admin-profile-copy"><strong>{name}</strong><small>{roleLabel}</small></span>
        <ChevronDown aria-hidden="true" />
      </button>
      {open ? (
        <div className="animate-menu absolute right-0 top-[calc(100%+8px)] z-50 w-56 border border-line bg-surface p-2 shadow-lift" role="menu" aria-label="Profile menu">
          <div className="border-b border-line px-2 py-2">
            <p className="truncate text-xs font-medium text-ink">{name}</p>
            <p className="mt-1 truncate text-[10px] text-muted">{user?.email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className="mt-1 w-full px-2 py-2 text-left text-xs text-danger transition-colors hover:bg-danger-soft"
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}
