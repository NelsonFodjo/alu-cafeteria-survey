'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSurveyStore } from '@/lib/store'
import { CATEGORIES, CATEGORY_CONFIG, type Category } from '@/lib/types'

export function CategoryTransition({ category }: { category: Category }) {
  const setScreen = useSurveyStore((state) => state.setScreen)
  const categoryIndex = CATEGORIES.indexOf(category)
  const config = CATEGORY_CONFIG[category]

  useEffect(() => {
    const t = setTimeout(() => setScreen('swipe'), 1800)
    return () => clearTimeout(t)
  }, [setScreen])

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Radial glow */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 50%, color-mix(in srgb, var(--primary) 15%, transparent), transparent)',
        }}
      />

      {/* Step indicator */}
      <motion.div
        className="absolute top-14 flex gap-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {CATEGORIES.map((cat, i) => (
          <div
            key={cat}
            className={`rounded-full transition-all duration-500 ${
              i < categoryIndex
                ? 'h-2 w-2 bg-primary/50'
                : i === categoryIndex
                  ? 'h-2 w-8 bg-primary'
                  : 'h-2 w-2 bg-foreground/15'
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            Up next
          </p>
          <h1
            className="text-6xl font-bold text-foreground"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {config.label}
          </h1>
        </motion.div>
      </div>

      {/* Loading bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-[2px] bg-primary/50"
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration: 1.8, ease: 'linear' }}
      />
    </motion.div>
  )
}
