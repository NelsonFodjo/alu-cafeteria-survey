'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSurveyStore } from '@/lib/store'
import { ArrowRight } from 'lucide-react'
import type { FoodItem } from '@/lib/types'

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

  if (!currentItem) {
    setScreen('open-feedback')
    return null
  }

  return (
    <motion.div
      className="fixed inset-0 flex flex-col bg-background"
      style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, color-mix(in srgb, var(--primary) 9%, transparent), var(--background))' }}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-1 flex-col px-6 pb-8 pt-10">
        {/* Progress */}
        <div className="mb-6 flex justify-center gap-1.5">
          {selectedDislikedIds.map((_, i) => (
            <div
              key={i}
              className={`h-[3px] rounded-full transition-all duration-300 ${
                i < currentFeedbackIndex ? 'w-4 bg-primary/40' :
                i === currentFeedbackIndex ? 'w-7 bg-primary' : 'w-[5px] bg-foreground/12'
              }`}
            />
          ))}
        </div>

        {/* Food preview */}
        <motion.div
          className="mx-auto mb-5 overflow-hidden rounded-2xl border border-border"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <img src={currentItem.image_url} alt={currentItem.name} className="h-28 w-28 object-cover" />
        </motion.div>

        <motion.h2
          className="mb-6 text-center text-2xl font-bold text-foreground"
          style={{ fontFamily: 'var(--font-heading)' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
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
