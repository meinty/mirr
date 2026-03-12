'use client'

import { useRouter } from 'next/navigation'
import { setClientLocale } from '@/lib/locale-client'
import type { Locale } from '@/lib/translations'

export function LanguageSwitcher({ current }: { current: Locale }) {
  const router = useRouter()

  function toggle() {
    const next: Locale = current === 'nl' ? 'en' : 'nl'
    setClientLocale(next)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      className="text-sm text-gray-400 hover:text-gray-700 font-medium tabular-nums"
    >
      {current === 'nl' ? 'EN' : 'NL'}
    </button>
  )
}
