'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { translations } from '@/lib/translations'
import type { Locale } from '@/lib/translations'

function getActiveStep(secondsElapsed: number) {
  if (secondsElapsed < 30) return 0
  if (secondsElapsed < 75) return 1
  if (secondsElapsed < 110) return 2
  return 3
}

export default function AuditStatus({
  auditId,
  brandName,
  createdAt,
  locale,
}: {
  auditId: string
  brandName: string
  createdAt: string
  locale: Locale
}) {
  const router = useRouter()
  const t = translations[locale]
  const startTime = new Date(createdAt).getTime()
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - startTime) / 1000))
  const [dots, setDots] = useState('')

  const steps = [
    { key: 'prompts', label: t.step1Label, detail: t.step1Detail },
    { key: 'visibility', label: t.step2Label, detail: t.step2Detail },
    { key: 'identity', label: t.step3Label, detail: t.step3Detail },
    { key: 'report', label: t.step4Label, detail: t.step4Detail },
  ]

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.')
    }, 500)

    const elapsedInterval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    const pollInterval = setInterval(async () => {
      const res = await fetch(`/api/audit-status/${auditId}`)
      if (res.ok) {
        const { status } = await res.json()
        if (status === 'completed' || status === 'failed') {
          router.refresh()
        }
      }
    }, 5000)

    return () => {
      clearInterval(dotsInterval)
      clearInterval(elapsedInterval)
      clearInterval(pollInterval)
    }
  }, [auditId, router, startTime])

  const activeStep = getActiveStep(elapsed)
  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-10">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-5" />
          <h2 className="font-semibold text-lg mb-1">{t.auditStatusTitle}{dots}</h2>
          <p className="text-gray-400 text-sm">{t.auditStatusSub(brandName, timeStr)}</p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, i) => {
            const isDone = i < activeStep
            const isActive = i === activeStep
            const isPending = i > activeStep

            return (
              <div key={step.key} className={`flex gap-4 items-start p-4 rounded-lg transition-colors ${isActive ? 'bg-gray-50' : ''}`}>
                <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5 text-xs font-medium ${
                  isDone ? 'bg-black text-white' :
                  isActive ? 'border-2 border-black bg-white' :
                  'border-2 border-gray-200 bg-white text-gray-300'
                }`}>
                  {isDone ? '✓' : i + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isPending ? 'text-gray-300' : 'text-gray-900'}`}>
                    {step.label}
                    {isActive && <span className="ml-2 text-xs font-normal text-gray-400">{t.auditStatusActive}{dots}</span>}
                  </p>
                  <p className={`text-xs mt-0.5 ${isPending ? 'text-gray-200' : 'text-gray-400'}`}>
                    {step.detail}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-center text-gray-300 text-xs mt-8">{t.auditStatusNote}</p>
      </div>
    </div>
  )
}
