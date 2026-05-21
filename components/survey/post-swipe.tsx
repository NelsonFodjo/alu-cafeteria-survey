'use client'

// ─── Post-swipe screens: CategoryTransition → DislikeDetail → FeedbackDetail → OpenFeedback ──

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSurveyStore } from '@/lib/store'
import { createClient, CATEGORIES, CATEGORY_CONFIG, type Category, type FoodItem } from '@/lib/utils'
import { Check, ArrowRight, Loader2 } from 'lucide-react'
import confetti from 'canvas-confetti'

// ═══════════════════════════════════════════════════════════════════════════════
// CategoryTransition — shown briefly when moving to the next food category
// ═══════════════════════════════════════════════════════════════════════════════
export function CategoryTransition({ category }: { category: Category }) {
  const setScreen = useSurveyStore((s) => s.setScreen)
  const categoryIndex = CATEGORIES.indexOf(category)
  const config = CATEGORY_CONFIG[category]

  useEffect(() => {
    const t = setTimeout(() => setScreen('swipe'), 1800)
    return () => clearTimeout(t)
  }, [setScreen])

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-background"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
    >
      {/* Radial glow */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 50%, color-mix(in srgb, var(--primary) 15%, transparent), transparent)' }}
      />

      {/* Category progress dots */}
      <motion.div
        className="absolute top-14 flex gap-2"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      >
        {CATEGORIES.map((cat, i) => (
          <div
            key={cat}
            className={`rounded-full transition-all duration-500 ${
              i < categoryIndex  ? 'h-2 w-2 bg-primary/50' :
              i === categoryIndex ? 'h-2 w-8 bg-primary' :
                                   'h-2 w-2 bg-foreground/15'
            }`}
          />
        ))}
      </motion.div>

      <div className="relative z-10 flex flex-col items-center gap-5">
        <motion.span
          className="text-[88px] leading-none"
          initial={{ scale: 0.3, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.1 }}
        >
          {config.emoji}
        </motion.span>
        <motion.div
          className="flex flex-col items-center gap-1"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Up next</p>
          <h1 className="text-6xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            {config.label}
          </h1>
        </motion.div>
      </div>

      {/* Loading bar that fills over 1.8 s to signal auto-advance */}
      <motion.div
        className="absolute bottom-0 left-0 h-[2px] bg-primary/50"
        initial={{ width: '0%' }} animate={{ width: '100%' }}
        transition={{ duration: 1.8, ease: 'linear' }}
      />
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DislikeDetailScreen — lets user pick which disliked items to give feedback on
// ═══════════════════════════════════════════════════════════════════════════════
export function DislikeDetailScreen({ foodItems }: { foodItems: FoodItem[] }) {
  const { getDislikedResponses, selectedDislikedIds, toggleDislikedSelection, setScreen, setCurrentFeedbackIndex } = useSurveyStore()

  const dislikedItems = foodItems.filter((item) =>
    getDislikedResponses().some((r) => r.food_item_id === item.id)
  )

  const handleFeedback = () => {
    if (selectedDislikedIds.length > 0) {
      setCurrentFeedbackIndex(0)
      setScreen('feedback-detail')
    }
  }

  // If user liked everything, skip straight to open feedback
  if (dislikedItems.length === 0) {
    return (
      <motion.div
        className="fixed inset-0 flex flex-col items-center justify-center bg-background px-8"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, #22c55e 8%, transparent), var(--background))' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div
          className="flex flex-col items-center gap-5 text-center"
          initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 20 }}
        >
          <span className="text-7xl">🎉</span>
          <h1 className="text-4xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            You loved everything!
          </h1>
          <p className="text-muted-foreground">{"That's amazing. Let's wrap up."}</p>
          <button
            onClick={() => setScreen('open-feedback')}
            className="mt-4 flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-[16px] font-semibold text-primary-foreground hover:opacity-90"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="fixed inset-0 flex flex-col bg-background"
      style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, color-mix(in srgb, var(--primary) 9%, transparent), var(--background))' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="shrink-0 px-6 pb-3 pt-12">
        <motion.h1
          className="mb-1.5 text-center text-3xl font-bold text-foreground"
          style={{ fontFamily: 'var(--font-heading)' }}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        >
          You didn't like these 👀
        </motion.h1>
        <motion.p
          className="text-center text-[14px] text-muted-foreground"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        >
          Tap items you'd like to give feedback on
        </motion.p>
      </div>

      <div className="flex-1 overflow-y-auto px-6">
        <motion.div
          className="grid grid-cols-3 gap-2.5 pb-4 sm:grid-cols-4"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
        >
          {dislikedItems.map((item, i) => {
            const isSelected = selectedDislikedIds.includes(item.id)
            return (
              <motion.button
                key={item.id}
                onClick={() => toggleDislikedSelection(item.id)}
                className={`relative cursor-pointer overflow-hidden rounded-2xl border transition-all ${
                  isSelected ? 'border-primary/60 shadow-md shadow-primary/10' : 'border-border hover:border-foreground/20'
                }`}
                initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                whileTap={{ scale: 0.94 }}
              >
                {isSelected && (
                  <div className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                  </div>
                )}
                <img src={item.image_url} alt={item.name} className="aspect-square w-full object-cover" />
                <div className={`px-2 py-1.5 ${isSelected ? 'bg-primary/10' : 'bg-card'}`}>
                  <p className={`truncate text-center text-[11px] font-medium ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                    {item.name}
                  </p>
                </div>
              </motion.button>
            )
          })}
        </motion.div>
      </div>

      <div className="shrink-0 border-t border-border px-6 pb-8 pt-4">
        <button
          onClick={handleFeedback}
          disabled={selectedDislikedIds.length === 0}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-[16px] font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
        >
          Give Feedback ({selectedDislikedIds.length}) <ArrowRight className="h-4 w-4" />
        </button>
        <button onClick={() => setScreen('open-feedback')} className="w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground">
          Skip →
        </button>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// FeedbackDetailScreen — per-item feedback for selected dislikes
// ═══════════════════════════════════════════════════════════════════════════════
export function FeedbackDetailScreen({ foodItems }: { foodItems: FoodItem[] }) {
  const { selectedDislikedIds, currentFeedbackIndex, setCurrentFeedbackIndex, updateResponse, setScreen } = useSurveyStore()
  const [whatIsWrong, setWhatIsWrong] = useState('')
  const [suggestion, setSuggestion] = useState('')

  const currentItemId = selectedDislikedIds[currentFeedbackIndex]
  const currentItem = foodItems.find((item) => item.id === currentItemId)
  const isLast = currentFeedbackIndex + 1 >= selectedDislikedIds.length

  const handleNext = () => {
    updateResponse(currentItemId, { what_is_wrong: whatIsWrong, suggestion })
    setWhatIsWrong('')
    setSuggestion('')
    if (!isLast) setCurrentFeedbackIndex(currentFeedbackIndex + 1)
    else setScreen('open-feedback')
  }

  if (!currentItem) { setScreen('open-feedback'); return null }

  return (
    <motion.div
      className="fixed inset-0 flex flex-col bg-background"
      style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, color-mix(in srgb, var(--primary) 9%, transparent), var(--background))' }}
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-1 flex-col px-6 pb-8 pt-10">
        {/* Progress dots across selected items */}
        <div className="mb-6 flex justify-center gap-1.5">
          {selectedDislikedIds.map((_, i) => (
            <div
              key={i}
              className={`h-[3px] rounded-full transition-all duration-300 ${
                i < currentFeedbackIndex  ? 'w-4 bg-primary/40' :
                i === currentFeedbackIndex ? 'w-7 bg-primary' :
                                            'w-[5px] bg-foreground/12'
              }`}
            />
          ))}
        </div>

        <motion.div
          className="mx-auto mb-5 overflow-hidden rounded-2xl border border-border"
          initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <img src={currentItem.image_url} alt={currentItem.name} className="h-28 w-28 object-cover" />
        </motion.div>

        <motion.h2
          className="mb-6 text-center text-2xl font-bold text-foreground"
          style={{ fontFamily: 'var(--font-heading)' }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        >
          {currentItem.name}
        </motion.h2>

        <div className="flex flex-1 flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">What's wrong with it?</label>
            <textarea
              value={whatIsWrong}
              onChange={(e) => setWhatIsWrong(e.target.value)}
              placeholder="Tell us what you dislike about it…"
              className="w-full resize-none rounded-2xl border border-border bg-card p-4 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none transition-colors"
              rows={3}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">What would you suggest instead?</label>
            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="Share your ideas for improvement…"
              className="w-full resize-none rounded-2xl border border-border bg-card p-4 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none transition-colors"
              rows={3}
            />
          </div>
        </div>

        <button
          onClick={handleNext}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-[16px] font-semibold text-primary-foreground hover:opacity-90"
        >
          {isLast ? 'Continue' : 'Next'} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// OpenFeedbackScreen — free-text field + final Supabase submission
// ═══════════════════════════════════════════════════════════════════════════════
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
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-1 flex-col px-6 pb-8 pt-10">
        <motion.h1
          className="mb-2 text-center text-3xl font-bold text-foreground"
          style={{ fontFamily: 'var(--font-heading)' }}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        >
          Anything else?
        </motion.h1>
        <motion.p
          className="mb-6 text-center text-[14px] text-muted-foreground"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        >
          {"We're listening. Tell us everything."}
        </motion.p>

        {/* Personal stats summary */}
        <motion.div
          className="mb-5 overflow-hidden rounded-2xl border border-border bg-card"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
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
                  initial={{ width: 0 }} animate={{ width: `${likedPct}%` }}
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

        <motion.div className="flex-1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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
