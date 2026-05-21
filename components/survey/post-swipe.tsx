'use client'

// ─── Post-swipe screens: CategoryTransition → DislikeDetail → FeedbackDetail → OpenFeedback ──

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSurveyStore } from '@/lib/store'
import { createClient, CATEGORIES, CATEGORY_CONFIG, type Category, type FoodItem } from '@/lib/utils'
import { Check, ArrowRight, Loader2, Heart, X } from 'lucide-react'
import confetti from 'canvas-confetti'

// ═══════════════════════════════════════════════════════════════════════════════
// CategoryTransition
// For the very first category (breakfast) this shows an interactive swipe demo
// using two real food images. For all subsequent categories it shows the normal
// "Up next: <Category>" splash. Auto-advances after the demo completes.
// ═══════════════════════════════════════════════════════════════════════════════
export function CategoryTransition({ category, foodItems }: { category: Category; foodItems: FoodItem[] }) {
  const setScreen = useSurveyStore((s) => s.setScreen)
  const categoryIndex = CATEGORIES.indexOf(category)
  const config = CATEGORY_CONFIG[category]
  const isFirst = categoryIndex === 0

  // ── Normal (non-first) transition ──────────────────────────────────────────
  useEffect(() => {
    if (isFirst) return
    const t = setTimeout(() => setScreen('swipe'), 1800)
    return () => clearTimeout(t)
  }, [isFirst, setScreen])

  if (!isFirst) {
    return (
      <motion.div
        className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-background"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
      >
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 50%, color-mix(in srgb, var(--primary) 15%, transparent), transparent)' }}
        />
        <motion.div className="absolute top-14 flex gap-2" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {CATEGORIES.map((cat, i) => (
            <div key={cat} className={`rounded-full transition-all duration-500 ${
              i < categoryIndex ? 'h-2 w-2 bg-primary/50' : i === categoryIndex ? 'h-2 w-8 bg-primary' : 'h-2 w-2 bg-foreground/15'
            }`} />
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
          <motion.div className="flex flex-col items-center gap-1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Up next</p>
            <h1 className="text-6xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>{config.label}</h1>
          </motion.div>
        </div>
        <motion.div className="absolute bottom-0 left-0 h-[2px] bg-primary/50" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1.8, ease: 'linear' }} />
      </motion.div>
    )
  }

  // ── First-category swipe demo ───────────────────────────────────────────────
  return <SwipeDemo foodItems={foodItems} onDone={() => setScreen('swipe')} />
}

// ── SwipeDemo — animated tutorial with two real food images ──────────────────
function SwipeDemo({ foodItems, onDone }: { foodItems: FoodItem[]; onDone: () => void }) {
  const [card1, card2] = foodItems.length >= 2
    ? [foodItems[0], foodItems[1]]
    : [null, null]

  const [phase, setPhase] = useState<'idle' | 'right' | 'left' | 'done'>('idle')
  const [dismissed, setDismissed] = useState(false)
  const doneRef = useRef(false)

  const advance = () => {
    if (doneRef.current) return
    doneRef.current = true
    onDone()
  }

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('right'), 900)
    const t2 = setTimeout(() => { setDismissed(true); setPhase('idle') }, 1600)
    const t3 = setTimeout(() => setPhase('left'), 2400)
    const t4 = setTimeout(advance, 3400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const card1X = phase === 'right' ? '130vw' : '0px'
  const card1Rotate = phase === 'right' ? 22 : 0
  const card2X = phase === 'left' ? '-130vw' : '0px'
  const card2Rotate = phase === 'left' ? -22 : 0

  const likeOpacity = phase === 'right' ? 1 : 0
  const nopeOpacity = phase === 'left' ? 1 : 0

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-background"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
      onClick={advance}
      style={{ cursor: 'pointer' }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, color-mix(in srgb, var(--primary) 10%, transparent), transparent)' }} />

      <motion.div
        className="absolute top-12 left-0 right-0 flex flex-col items-center gap-1 px-8 text-center"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      >
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">How it works</p>
        <h1 className="text-[26px] font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          Swipe to rate your food
        </h1>
      </motion.div>

      {card1 && card2 && (
        <div className="relative w-full max-w-[280px]" style={{ height: '52vh' }}>
          {dismissed && (
            <motion.div
              className="absolute inset-0 overflow-hidden rounded-[24px] shadow-xl"
              initial={{ scale: 0.93, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <img src={card2.image_url} alt={card2.name} draggable={false} className="h-full w-full object-cover" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black via-black/70 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>{card2.name}</p>
              </div>
              <motion.div className="pointer-events-none absolute inset-0" style={{ opacity: nopeOpacity }} transition={{ duration: 0.2 }}>
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/40 to-transparent" />
                <div className="absolute right-4 top-10 rotate-[22deg] rounded-xl border-[3px] border-red-400 px-3 py-1">
                  <span className="text-xl font-black tracking-wider text-red-400">NOPE</span>
                </div>
              </motion.div>
              <AnimatePresence>
                {phase === 'left' && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-start pl-4"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    <motion.div
                      animate={{ x: [-4, -14, -4] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                      className="flex items-center gap-1 rounded-full bg-red-500/20 px-3 py-1.5 text-sm font-semibold text-red-400"
                    >
                      ← pass
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {!dismissed && (
            <motion.div
              className="absolute inset-0 overflow-hidden rounded-[24px] shadow-2xl"
              animate={{ x: card1X, rotate: card1Rotate }}
              transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <img src={card1.image_url} alt={card1.name} draggable={false} className="h-full w-full object-cover" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black via-black/70 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>{card1.name}</p>
              </div>
              <motion.div className="pointer-events-none absolute inset-0" animate={{ opacity: likeOpacity }} transition={{ duration: 0.2 }}>
                <div className="absolute inset-0 bg-gradient-to-l from-emerald-500/40 to-transparent" />
                <div className="absolute left-4 top-10 -rotate-[22deg] rounded-xl border-[3px] border-emerald-400 px-3 py-1">
                  <span className="text-xl font-black tracking-wider text-emerald-400">LIKE</span>
                </div>
              </motion.div>
              <AnimatePresence>
                {phase === 'right' && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-end pr-4"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    <motion.div
                      animate={{ x: [4, 14, 4] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                      className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1.5 text-sm font-semibold text-emerald-400"
                    >
                      like →
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      )}

      <motion.div
        className="mt-6 flex items-center gap-6"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-red-500/40 bg-red-500/15 text-red-500">
            <X className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="text-sm text-muted-foreground">Swipe left to pass</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-emerald-500/40 bg-emerald-500/15 text-emerald-500">
            <Heart className="h-4 w-4" fill="currentColor" />
          </div>
          <span className="text-sm text-muted-foreground">Swipe right to like</span>
        </div>
      </motion.div>

      <motion.p
        className="absolute bottom-8 text-xs text-muted-foreground/60"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
      >
        Tap anywhere to skip
      </motion.p>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DislikeDetailScreen
// Rules:
//   - If only 1 disliked item → must select it (auto-select and block skip)
//   - If 2–3 disliked items → must select ALL of them
//   - If 4+ disliked items → must select at least 2
//   - Skip is hidden; cannot proceed until selection requirement is met
// ═══════════════════════════════════════════════════════════════════════════════
export function DislikeDetailScreen({ foodItems }: { foodItems: FoodItem[] }) {
  const { getDislikedResponses, selectedDislikedIds, toggleDislikedSelection, setScreen, setCurrentFeedbackIndex } = useSurveyStore()
  const [showError, setShowError] = useState(false)

  const dislikedItems = foodItems.filter((item) =>
    getDislikedResponses().some((r) => r.food_item_id === item.id)
  )

  const total = dislikedItems.length
  const minRequired = total <= 3 ? total : 2
  const selectionMet = selectedDislikedIds.length >= minRequired

  const handleFeedback = () => {
    if (!selectionMet) { setShowError(true); return }
    setCurrentFeedbackIndex(0)
    setScreen('feedback-detail')
  }

  if (total === 0) {
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
            className="mt-4 flex cursor-pointer items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-[16px] font-semibold text-primary-foreground hover:opacity-90"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center bg-background px-6"
      style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, color-mix(in srgb, var(--primary) 9%, transparent), var(--background))' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-sm">

        <motion.h1
          className="mb-3 text-center text-3xl font-bold text-foreground"
          style={{ fontFamily: 'var(--font-heading)' }}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        >
          You didn't like these 👀
        </motion.h1>

        <motion.p
          className="mb-5 text-center text-[14px] leading-relaxed text-muted-foreground"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        >
          {total >= 2
            ? `We need you to select two or more from this list to provide more feedback to help us understand what's wrong with them. You're free to tell us that you just don't like them — that's already helpful.`
            : `Let us know if you'd like to give any feedback on this item. You're free to simply say you don't like it — that's enough.`}
        </motion.p>

        <motion.div
          className="mb-5 flex flex-wrap justify-center gap-3"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
        >
          {dislikedItems.map((item, i) => {
            const isSelected = selectedDislikedIds.includes(item.id)
            return (
              <motion.button
                key={item.id}
                onClick={() => { toggleDislikedSelection(item.id); setShowError(false) }}
                className={`relative w-[88px] cursor-pointer overflow-hidden rounded-2xl border-2 transition-all ${
                  isSelected
                    ? 'border-primary shadow-lg shadow-primary/20'
                    : showError && !isSelected
                      ? 'border-destructive/50 bg-destructive/5'
                      : 'border-border hover:border-foreground/30'
                }`}
                initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                whileTap={{ scale: 0.93 }}
              >
                <div className={`absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                  isSelected ? 'border-primary bg-primary' : 'border-white/60 bg-black/30'
                }`}>
                  {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>

                <img src={item.image_url} alt={item.name} className="aspect-square w-full object-cover" />

                <div className={`px-1.5 py-1.5 transition-colors ${isSelected ? 'bg-primary/15' : 'bg-card'}`}>
                  <p className={`truncate text-center text-[10px] font-semibold ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                    {item.name}
                  </p>
                </div>
              </motion.button>
            )
          })}
        </motion.div>

        <AnimatePresence>
          {showError && !selectionMet && (
            <motion.p
              className="mb-3 text-center text-sm font-medium text-destructive"
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            >
              {total === 1
                ? 'Please select the item before continuing.'
                : 'Please select at least 2 items before continuing.'}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button
          onClick={handleFeedback}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[16px] font-semibold transition-all ${
            selectionMet
              ? 'cursor-pointer bg-primary text-primary-foreground hover:opacity-90'
              : 'cursor-not-allowed bg-foreground/10 text-foreground/40'
          }`}
          whileTap={selectionMet ? { scale: 0.97 } : {}}
          whileHover={selectionMet ? { scale: 1.02 } : {}}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          Give Feedback ({selectedDislikedIds.length}) <ArrowRight className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// FeedbackDetailScreen — "what's wrong" is required before proceeding
// ═══════════════════════════════════════════════════════════════════════════════
export function FeedbackDetailScreen({ foodItems }: { foodItems: FoodItem[] }) {
  const { selectedDislikedIds, currentFeedbackIndex, setCurrentFeedbackIndex, updateResponse, setScreen } = useSurveyStore()
  const [whatIsWrong, setWhatIsWrong] = useState('')
  const [suggestion, setSuggestion] = useState('')
  const [showError, setShowError] = useState(false)

  const currentItemId = selectedDislikedIds[currentFeedbackIndex]
  const currentItem = foodItems.find((item) => item.id === currentItemId)
  const isLast = currentFeedbackIndex + 1 >= selectedDislikedIds.length

  useEffect(() => {
    if (!currentItem) setScreen('open-feedback')
  }, [currentItem, setScreen])

  const handleNext = () => {
    if (!whatIsWrong.trim()) { setShowError(true); return }
    updateResponse(currentItemId, { what_is_wrong: whatIsWrong.trim(), suggestion: suggestion.trim() })
    setWhatIsWrong('')
    setSuggestion('')
    setShowError(false)
    if (!isLast) setCurrentFeedbackIndex(currentFeedbackIndex + 1)
    else setScreen('open-feedback')
  }

  if (!currentItem) return null

  const charCount = whatIsWrong.length
  const isWhatIsWrongFilled = whatIsWrong.trim().length > 0

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center bg-background px-6"
      style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, color-mix(in srgb, var(--primary) 9%, transparent), var(--background))' }}
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="w-full max-w-[70%]">
        <div className="mb-5 flex justify-center gap-1.5">
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
          className="mb-4 flex justify-center"
          initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <div className="h-[120px] w-[120px] overflow-hidden rounded-2xl border border-border shadow-md">
            <img src={currentItem.image_url} alt={currentItem.name} className="h-full w-full object-cover" />
          </div>
        </motion.div>

        <motion.h2
          className="mb-5 text-center text-xl font-bold text-foreground"
          style={{ fontFamily: 'var(--font-heading)' }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        >
          {currentItem.name}
        </motion.h2>

        <div className="flex flex-col gap-3">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">
                What's wrong? <span className="text-destructive">*</span>
              </label>
              <span className={`text-[11px] tabular-nums ${showError && !isWhatIsWrongFilled ? 'text-destructive' : 'text-muted-foreground'}`}>
                {charCount} chars
              </span>
            </div>
            <textarea
              value={whatIsWrong}
              onChange={(e) => { setWhatIsWrong(e.target.value); if (e.target.value.trim()) setShowError(false) }}
              placeholder="Tell us what you dislike…"
              className={`w-full resize-none rounded-xl border bg-card p-3 text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors ${
                showError && !isWhatIsWrongFilled
                  ? 'border-destructive focus:border-destructive'
                  : isWhatIsWrongFilled
                    ? 'border-primary/50 focus:border-primary/70'
                    : 'border-border focus:border-primary/50'
              }`}
              rows={2}
            />
            <AnimatePresence>
              {showError && !isWhatIsWrongFilled && (
                <motion.p className="mt-1 text-xs text-destructive" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  Required — tell us what you disliked.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Suggestion? <span className="text-[11px] font-normal opacity-50">(optional)</span>
            </label>
            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="Any ideas for improvement…"
              className="w-full resize-none rounded-xl border border-border bg-card p-3 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none transition-colors"
              rows={2}
            />
          </div>
        </div>

        <motion.button
          onClick={handleNext}
          className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[15px] font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          {isLast ? 'Continue' : 'Next'} <ArrowRight className="h-4 w-4" />
        </motion.button>
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
      <div className="flex flex-1 flex-col px-6 pb-6 pt-8">
        <motion.h1
          className="mb-1 text-center text-2xl font-bold text-foreground"
          style={{ fontFamily: 'var(--font-heading)' }}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        >
          Anything else?
        </motion.h1>
        <motion.p
          className="mb-4 text-center text-[13px] text-muted-foreground"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        >
          {"We're listening. Tell us everything."}
        </motion.p>

        <motion.div
          className="mb-4 overflow-hidden rounded-xl border border-border bg-card"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-500">{totalLiked}</p>
              <p className="text-[11px] text-muted-foreground">liked</p>
            </div>
            <div className="flex-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]">
                <motion.div
                  className="h-full rounded-full bg-emerald-500"
                  initial={{ width: 0 }} animate={{ width: `${likedPct}%` }}
                  transition={{ duration: 0.9, delay: 0.3, ease: 'easeOut' }}
                />
              </div>
              <p className="mt-1 text-center text-[10px] text-muted-foreground">{responses.length} items rated</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-500">{totalDisliked}</p>
              <p className="text-[11px] text-muted-foreground">disliked</p>
            </div>
          </div>
        </motion.div>

        <motion.div className="flex-1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <textarea
            value={openFeedback}
            onChange={(e) => setOpenFeedback(e.target.value)}
            placeholder="Suggestions, complaints, praise, new dish ideas — anything goes…"
            className="h-full min-h-[120px] w-full resize-none rounded-xl border border-border bg-card p-3 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none transition-colors"
          />
        </motion.div>

        {error && (
          <motion.p className="mt-2 text-center text-sm text-destructive" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {error}
          </motion.p>
        )}

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-[15px] font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Survey →'}
        </button>
      </div>
    </motion.div>
  )
}
