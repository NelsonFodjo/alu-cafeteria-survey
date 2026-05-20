'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSurveyStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'

interface FoodImage {
  id: string
  image_url: string
  name: string
}

const SLIDES = [
  { text: "Help us build a better cafeteria menu for every Alchemist", duration: 3800 },
  { text: "Rate each dish — takes about 3 minutes", duration: 3200 },
  { text: "Your responses are anonymous and go directly to the team", duration: 3500 },
  { text: "Swipe right to like. Swipe left to pass.", duration: 3000 },
  { text: "Ready?", duration: 1800 },
]

interface IntroScreenProps {
  liveCount?: number
}

export function IntroScreen({ liveCount = 0 }: IntroScreenProps) {
  const [current, setCurrent] = useState(0)
  const [foodImages, setFoodImages] = useState<FoodImage[]>([])
  const setScreen = useSurveyStore((state) => state.setScreen)

  useEffect(() => {
    createClient()
      .from('food_items')
      .select('id, image_url, name')
      .limit(6)
      .then(({ data }) => { if (data) setFoodImages(data) })
  }, [])

  const advance = useCallback(() => {
    if (current < SLIDES.length - 1) setCurrent((p) => p + 1)
    else setScreen('email')
  }, [current, setScreen])

  useEffect(() => {
    const t = setTimeout(advance, SLIDES[current].duration)
    return () => clearTimeout(t)
  }, [current, advance])

  const positions = [
    { top: '8%', left: '4%', size: 72, delay: 0 },
    { top: '12%', right: '6%', size: 56, delay: 0.4 },
    { bottom: '18%', left: '6%', size: 64, delay: 0.8 },
    { bottom: '22%', right: '4%', size: 72, delay: 1.2 },
    { top: '42%', left: '2%', size: 48, delay: 1.6 },
    { top: '38%', right: '2%', size: 52, delay: 2.0 },
  ]

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-background"
      style={{ background: 'radial-gradient(ellipse 90% 70% at 50% -5%, color-mix(in srgb, var(--primary) 12%, transparent), var(--background))' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.5 }}
      onClick={advance}
    >
      {/* Floating food images */}
      {foodImages.map((food, i) => {
        const pos = positions[i % positions.length]
        return (
          <motion.div
            key={food.id}
            className="pointer-events-none absolute overflow-hidden rounded-full"
            style={{ ...pos, width: pos.size, height: pos.size }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 0.15, scale: 1, y: [0, -12, 0] }}
            transition={{
              opacity: { delay: pos.delay, duration: 0.6 },
              scale: { delay: pos.delay, duration: 0.6 },
              y: { delay: pos.delay, duration: 4, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            <img src={food.image_url} alt="" draggable={false} className="h-full w-full object-cover" />
          </motion.div>
        )
      })}

      {/* ALU logo */}
      <motion.div
        className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex items-baseline gap-2"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <span
          className="text-2xl font-black tracking-tight text-primary"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          ALU
        </span>
        <span className="text-xs font-medium text-muted-foreground">Cafeteria Survey</span>
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 flex max-w-sm flex-col items-center px-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            className="flex flex-col items-center gap-5"
            initial={{ opacity: 0, y: 28, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -24, filter: 'blur(8px)', scale: 0.94 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <p
              className="text-[22px] font-semibold leading-[1.35] text-foreground"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {SLIDES[current].text}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide dots */}
      <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-2">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-400 ${
              i === current ? 'h-[3px] w-6 bg-primary' : i < current ? 'h-[3px] w-3 bg-foreground/30' : 'h-[3px] w-3 bg-foreground/10'
            }`}
          />
        ))}
      </div>

      {/* Live count */}
      <motion.div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-foreground/[0.06] px-4 py-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span className="text-xs text-muted-foreground">
          {liveCount > 0 ? `${liveCount} student${liveCount !== 1 ? 's' : ''} responded` : 'Be the first to respond'}
        </span>
      </motion.div>

      {/* Skip */}
      <motion.button
        onClick={(e) => { e.stopPropagation(); setScreen('email') }}
        className="absolute right-6 top-6 z-20 rounded-full bg-foreground/[0.06] px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
        whileTap={{ scale: 0.95 }}
      >
        Skip →
      </motion.button>
    </motion.div>
  )
}
