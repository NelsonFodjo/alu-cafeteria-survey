'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSurveyStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import confetti from 'canvas-confetti'

export function OpenFeedbackScreen() {
  const { openFeedback, setOpenFeedback, studentId, responses, setScreen, setIsDone } = useSurveyStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const totalLiked = responses.filter((r) => r.liked).length
  const totalDisliked = responses.filter((r) => !r.liked).length
  const likedPct = responses.length > 0 ? Math.round((totalLiked / responses.length) * 100) : 0

  const handleSubmit = async () => {
    if (!studentId) return
    setIsLoading(true)
    setError('')
    try {
      const supabase = createClient()
      if (responses.length > 0) {
        const { error: e } = await supabase.from('responses').upsert(
          responses.map((r) => ({
            student_id: studentId,
            food_item_id: r.food_item_id,
            liked: r.liked,
            what_is_wrong: r.what_is_wrong || null,
            suggestion: r.suggestion || null,
          })),
          { onConflict: 'student_id,food_item_id' },
        )
        if (e) throw e
      }
      if (openFeedback.trim()) {
        const { error: e } = await supabase.from('open_feedback').insert({ student_id: studentId, content: openFeedback.trim() })
        if (e) throw e
      }
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#F5A623', '#22c55e', '#ffffff'] })
      setIsDone(true)
      setTimeout(() => setScreen('results'), 1000)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 flex flex-col bg-background"
      style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, color-mix(in srgb, var(--primary) 9%, transparent), var(--background))' }}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-1 flex-col px-6 pb-8 pt-10">
        <motion.h1
          className="mb-2 text-center text-3xl font-bold text-foreground"
          style={{ fontFamily: 'var(--font-heading)' }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {"Anything else?"}
        </motion.h1>
        <motion.p
          className="mb-6 text-center text-[14px] text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          {"We're listening. Tell us everything."}
        </motion.p>

        {/* Personal stats */}
        <motion.div
          className="mb-5 overflow-hidden rounded-2xl border border-border bg-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
        >
          <div className="flex items-center gap-4 p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-500">{totalLiked}</p>
              <p className="text-xs text-muted-foreground">liked</p>
            </div>
            <div className="flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-foreground/[0.08]">
                <motion.div
                  className="h-full rounded-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${likedPct}%` }}
                  transition={{ duration: 0.9, delay: 0.3, ease: 'easeOut' }}
                />
              </div>
              <p className="mt-1.5 text-center text-[11px] text-muted-foreground">{responses.length} items rated</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{totalDisliked}</p>
              <p className="text-xs text-muted-foreground">disliked</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="flex-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <textarea
            value={openFeedback}
            onChange={(e) => setOpenFeedback(e.target.value)}
            placeholder="Suggestions, complaints, praise, new dish ideas — anything goes…"
            className="h-full min-h-[160px] w-full resize-none rounded-2xl border border-border bg-card p-4 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none transition-colors"
          />
        </motion.div>

        {error && (
          <motion.p className="mt-3 text-center text-sm text-destructive" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {error}
          </motion.p>
        )}

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-[16px] font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Submit Survey →'}
        </button>
      </div>
    </motion.div>
  )
}
