'use client'

import { motion } from 'framer-motion'
import { useSurveyStore } from '@/lib/store'
import { Check, ArrowRight } from 'lucide-react'
import type { FoodItem } from '@/lib/types'

export function DislikeDetailScreen({ foodItems }: { foodItems: FoodItem[] }) {
  const { getDislikedResponses, selectedDislikedIds, toggleDislikedSelection, setScreen, setCurrentFeedbackIndex } = useSurveyStore()

  const dislikedResponses = getDislikedResponses()
  const dislikedItems = foodItems.filter((item) => dislikedResponses.some((r) => r.food_item_id === item.id))

  const handleFeedback = () => {
    if (selectedDislikedIds.length > 0) {
      setCurrentFeedbackIndex(0)
      setScreen('feedback-detail')
    }
  }

  if (dislikedItems.length === 0) {
    return (
      <motion.div
        className="fixed inset-0 flex flex-col items-center justify-center bg-background px-8"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, #22c55e 8%, transparent), var(--background))' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="flex flex-col items-center gap-5 text-center"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="shrink-0 px-6 pb-3 pt-12">
        <motion.h1
          className="mb-1.5 text-center text-3xl font-bold text-foreground"
          style={{ fontFamily: 'var(--font-heading)' }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
        >
          You didn't like these 👀
        </motion.h1>
        <motion.p
          className="text-center text-[14px] text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          Tap items you'd like to give feedback on
        </motion.p>
      </div>

      <div className="flex-1 overflow-y-auto px-6">
        <motion.div
          className="grid grid-cols-3 gap-2.5 pb-4 sm:grid-cols-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
        >
          {dislikedItems.map((item, i) => {
            const isSelected = selectedDislikedIds.includes(item.id)
            return (
              <motion.button
                key={item.id}
                onClick={() => toggleDislikedSelection(item.id)}
                className={`relative cursor-pointer overflow-hidden rounded-2xl border transition-all ${
                  isSelected
                    ? 'border-primary/60 shadow-md shadow-primary/10'
                    : 'border-border hover:border-foreground/20'
                }`}
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
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
        <button
          onClick={() => setScreen('open-feedback')}
          className="w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Skip →
        </button>
      </div>
    </motion.div>
  )
}
