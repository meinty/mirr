import type { Locale } from './translations'

export function getClientLocale(): Locale {
  if (typeof document === 'undefined') return 'nl'
  const match = document.cookie.match(/mirr_locale=([^;]+)/)
  return match?.[1] === 'en' ? 'en' : 'nl'
}

export function setClientLocale(locale: Locale) {
  document.cookie = `mirr_locale=${locale}; path=/; max-age=31536000; SameSite=Lax`
}
