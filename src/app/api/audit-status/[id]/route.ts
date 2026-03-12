import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { data: audit } = await supabase
    .from('audits')
    .select('status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!audit) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

  return NextResponse.json({ status: audit.status })
}
