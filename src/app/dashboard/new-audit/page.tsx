'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NewAuditPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    brand_name: '',
    category: '',
    positioning: '',
    competitor_1: '',
    competitor_2: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    // Check credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (!profile || profile.credits < 1) {
      setError('Niet genoeg credits. Koop credits om een audit te starten.')
      setLoading(false)
      return
    }

    // Maak audit aan
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .insert({
        user_id: user.id,
        brand_name: form.brand_name,
        category: form.category,
        positioning: form.positioning,
        competitors: [form.competitor_1, form.competitor_2].filter(Boolean),
        status: 'queued',
      })
      .select()
      .single()

    if (auditError || !audit) {
      setError('Er ging iets mis. Probeer het opnieuw.')
      setLoading(false)
      return
    }

    // Trek credit af
    await supabase
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('id', user.id)

    router.push(`/dashboard/audits/${audit.id}`)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-8 py-4">
        <span className="text-lg font-semibold tracking-tight">Mirr</span>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-12">
        <h1 className="text-2xl font-semibold mb-2">Nieuwe audit</h1>
        <p className="text-gray-500 text-sm mb-10">Vul de merkgegevens in. Hoe meer context, hoe scherper de analyse.</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1.5">Merknaam</label>
            <input
              name="brand_name"
              value={form.brand_name}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="bijv. Alpro"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Categorie</label>
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="bijv. plant-based zuivel"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Merkpositionering</label>
            <p className="text-gray-400 text-xs mb-2">Beschrijf kort wie het merk is, wat het wil uitstralen en voor wie het is.</p>
            <textarea
              name="positioning"
              value={form.positioning}
              onChange={handleChange}
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
              placeholder="bijv. Alpro is een pionier in plant-based voeding, gericht op bewuste consumenten die duurzaamheid en smaak combineren..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Concurrent 1</label>
              <input
                name="competitor_1"
                value={form.competitor_1}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="bijv. Oatly"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Concurrent 2</label>
              <input
                name="competitor_2"
                value={form.competitor_2}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="bijv. Elmlea"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="pt-2 flex justify-between items-center">
            <p className="text-gray-400 text-xs">Dit kost 1 credit</p>
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Starten...' : 'Audit starten'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
