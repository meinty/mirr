import { cookies } from 'next/headers'
import type { Locale } from './translations'

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const val = cookieStore.get('mirr_locale')?.value
  return val === 'en' ? 'en' : 'nl'
}
