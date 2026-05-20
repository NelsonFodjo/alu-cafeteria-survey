'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useDrag } from '@use-gesture/react'
import { useSurveyStore } from '@/lib/store'
import { CATEGORIES, CATEGORY_CONFIG, type FoodItem } from '@/lib/types'
import { X, Heart } from 'lucide-react'
import confetti from 'canvas-confetti'

function playSwipeSound(direction: 'left' | 'right') {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AC()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    if (direction === 'right') {
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12)
    } else {
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.14)
    }
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
    osc.start()
    osc.stop(ctx.currentTime + 0.22)
    osc.onended = () => ctx.close()
  } catch {}
}

export function SwipeScreen({ foodItems }: { foodItems: FoodItem[] }) {
  const {
    currentCategory, setCurrentCategory,
    currentCardIndex, setCurrentCardIndex,
    addResponse, setScreen, responses,
  } = useSurveyStore()

  const [isAnimating, setIsAnimating] = useState(false)

  // Direct DOM refs — no motion values needed for swipe
  const cardRef = useRef<HTMLDivElement>(null)
  const likeOverlayRef = useRef<HTMLDivElement>(null)
  const nopeOverlayRef = useRef<HTMLDivElement>(null)

  const categoryItems = foodItems.filter((item) => item.category === currentCategory)
  const currentItem = categoryItems[currentCardIndex]
  const nextItem = categoryItems[currentCardIndex + 1]
  const categoryIndex = CATEGORIES.indexOf(currentCategory)
  const config = CATEGORY_CONFIG[currentCategory]

  const globalProgress = foodItems.length > 0 ? (responses.length / foodItems.length) * 100 : 0

  // Reset card position when card changes
  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    card.style.transition = 'none'
    card.style.transform = 'translateX(0) rotate(0deg)'
    if (likeOverlayRef.current) likeOverlayRef.current.style.opacity = '0'
    if (nopeOverlayRef.current) nopeOverlayRef.current.style.opacity = '0'
  }, [currentCardIndex, currentCategory])

  const advanceCard = useCallback(() => {
    if (currentCardIndex + 1 >= categoryItems.length) {
      const nextIdx = categoryIndex + 1
      if (nextIdx < CATEGORIES.length) {
        confetti({ particleCount: 55, spread: 65, origin: { y: 0.6 }, gravity: 2.2, scalar: 0.7, colors: ['#F5A623', '#22c55e', '#ffffff'] })
        setCurrentCategory(CATEGORIES[nextIdx])
        setCurrentCardIndex(0)
        setScreen('category-transition')
      } else {
        setScreen('dislike-detail')
      }
    } else {
      setCurrentCardIndex(currentCardIndex + 1)
    }
    setIsAnimating(false)
  }, [currentCardIndex, categoryItems.length, categoryIndex, setCurrentCategory, setCurrentCardIndex, setScreen])

  const swipeCard = useCallback(
    (direction: 'left' | 'right') => {
      if (!currentItem || isAnimating || !cardRef.current) return
      setIsAnimating(true)

      addResponse({ food_item_id: currentItem.id, liked: direction === 'right' })
      playSwipeSound(direction)
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(30)

      // Animate via CSS transition — exact same approach as reference
      cardRef.current.style.transition = 'transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      cardRef.current.style.transform = direction === 'right'
        ? 'translateX(130vw) rotate(22deg)'
        : 'translateX(-130vw) rotate(-22deg)'

      setTimeout(advanceCard, 400)
    },
    [currentItem, isAnimating, addResponse, advanceCard],
  )

  const bind = useDrag(
    (state) => {
      if (isAnimating || !cardRef.current) return

      const { distance, direction, dragging } = state
      const [x] = distance        // absolute distance from drag start
      const [xDir] = direction    // current direction: +1 right, -1 left

      if (dragging) {
        // Follow finger directly — same as reference: translateX(distance * direction)
        cardRef.current.style.transition = 'none'
        const xPos = x * xDir
        const rot = (xPos / 300) * 22
        cardRef.current.style.transform = `translateX(${xPos}px) rotate(${rot}deg)`

        // Update LIKE / NOPE overlay opacity via refs
        if (likeOverlayRef.current) {
          likeOverlayRef.current.style.opacity = String(Math.min(1, Math.max(0, (xPos - 30) / 130)))
        }
        if (nopeOverlayRef.current) {
          nopeOverlayRef.current.style.opacity = String(Math.min(1, Math.max(0, (-xPos - 30) / 130)))
        }
      } else {
        // Release — same as reference: x > 100 → fly off, else snap back
        if (x > 80) {
          swipeCard(xDir > 0 ? 'right' : 'left')
        } else {
          cardRef.current.style.transition = 'transform 0.3s ease'
          cardRef.current.style.transform = 'translateX(0) rotate(0deg)'
          if (likeOverlayRef.current) likeOverlayRef.current.style.opacity = '0'
          if (nopeOverlayRef.current) nopeOverlayRef.current.style.opacity = '0'
        }
      }
    },
    { filterTaps: true },
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isAnimating) return
      if (e.key === 'ArrowLeft') swipeCard('left')
      if (e.key === 'ArrowRight') swipeCard('right')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [swipeCard, isAnimating])

  if (!currentItem) return null

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Atmospheric blurred background */}
      <div className="absolute inset-0">
        <img
          src={currentItem.image_url}
          alt=""
          className="h-full w-full object-cover opacity-20 blur-2xl"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, color-mix(in srgb, var(--background) 50%, transparent), transparent, var(--background) 80%)' }}
        />
      </div>

      {/* Progress bar */}
      <div className="absolute left-0 right-0 top-0 z-50 h-[2px] bg-foreground/[0.06]">
        <motion.div
          className="h-full bg-primary"
          animate={{ width: `${globalProgress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Card area */}
      <div className="relative z-10 w-full max-w-sm px-5">
        {/* Next card (behind) */}
        {nextItem && (
          <div
            className="absolute inset-x-5 -bottom-4 overflow-hidden rounded-[28px] opacity-50"
            style={{ height: '68vh', transform: 'scale(0.93)' }}
          >
            <img src={nextItem.image_url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-background/40" />
          </div>
        )}

        {/* Current card — key forces remount for entry animation; no AnimatePresence
            so the old card's unmount never nulls cardRef after the new card has it */}
        <motion.div
            key={currentItem.id}
            style={{ height: '68vh' }}
            initial={{ scale: 0.86, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 110, damping: 13, mass: 1.1 }}
          >
            {/* Inner div: swipe transforms applied here via ref + CSS */}
            <div
              ref={cardRef}
              className="relative h-full cursor-grab overflow-hidden rounded-[28px] shadow-2xl active:cursor-grabbing touch-none select-none"
              {...(bind() as unknown as Record<string, unknown>)}
            >
              <img src={currentItem.image_url} alt={currentItem.name} className="h-full w-full object-cover" />

              {/* Bottom gradient */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black via-black/80 to-transparent" />

              {/* Progress dots */}
              <div className="absolute left-0 right-0 top-4 z-20 flex justify-center gap-[5px]">
                {categoryItems.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-300 ${
                      i < currentCardIndex
                        ? 'h-[3px] w-4 bg-white/40'
                        : i === currentCardIndex
                          ? 'h-[3px] w-7 bg-white'
                          : 'h-[3px] w-[5px] bg-white/15'
                    }`}
                  />
                ))}
              </div>

              {/* Category pill */}
              <div className="absolute left-4 top-10 z-20 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                <span>{config.emoji}</span>
                <span>{config.label}</span>
              </div>

              {/* Food name */}
              <div className="absolute inset-x-0 bottom-0 z-20 p-5 pb-6">
                <h2 className="text-[28px] font-bold leading-tight text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  {currentItem.name}
                </h2>
                <p className="mt-1 text-xs text-white/40">← → keys or swipe</p>
              </div>

              {/* LIKE overlay — opacity driven by ref */}
              <div ref={likeOverlayRef} className="pointer-events-none absolute inset-0 z-10" style={{ opacity: 0 }}>
                <div className="absolute inset-0 bg-gradient-to-l from-emerald-500/30 to-transparent" />
                <div className="absolute left-5 top-12 -rotate-[22deg] rounded-xl border-[3px] border-emerald-400 px-3 py-1">
                  <span className="text-2xl font-black tracking-wider text-emerald-400">LIKE</span>
                </div>
              </div>

              {/* NOPE overlay — opacity driven by ref */}
              <div ref={nopeOverlayRef} className="pointer-events-none absolute inset-0 z-10" style={{ opacity: 0 }}>
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 to-transparent" />
                <div className="absolute right-5 top-12 rotate-[22deg] rounded-xl border-[3px] border-red-400 px-3 py-1">
                  <span className="text-2xl font-black tracking-wider text-red-400">NOPE</span>
                </div>
              </div>
            </div>
          </motion.div>
      </div>

      {/* Action buttons */}
      <div className="relative z-10 mt-7 flex items-center gap-8">
        <motion.button
          onClick={() => swipeCard('left')}
          className="flex h-[64px] w-[64px] cursor-pointer items-center justify-center rounded-full border-2 border-red-500/40 bg-red-500/15 text-red-500 shadow-xl shadow-red-500/10 backdrop-blur-sm transition-all hover:bg-red-500/25 disabled:opacity-40"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.85 }}
          disabled={isAnimating}
        >
          <X className="h-7 w-7" strokeWidth={2.5} />
        </motion.button>

        <motion.button
          onClick={() => swipeCard('right')}
          className="flex h-[64px] w-[64px] cursor-pointer items-center justify-center rounded-full border-2 border-emerald-500/40 bg-emerald-500/15 text-emerald-500 shadow-xl shadow-emerald-500/10 backdrop-blur-sm transition-all hover:bg-emerald-500/25 disabled:opacity-40"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.85 }}
          disabled={isAnimating}
        >
          <Heart className="h-7 w-7" fill="currentColor" />
        </motion.button>
      </div>
    </div>
  )
}
