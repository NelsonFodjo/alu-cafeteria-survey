'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDrag } from '@use-gesture/react'
import { useSurveyStore } from '@/lib/store'
import { CATEGORIES, CATEGORY_CONFIG, type Category, type FoodItem } from '@/lib/types'
import confetti from 'canvas-confetti'

export function SwipeScreen({ foodItems }: { foodItems: FoodItem[] }) {
  const {
    currentCategory, setCurrentCategory,
    currentCardIndex, setCurrentCardIndex,
    addResponse, setScreen, responses,
  } = useSurveyStore()

  const [isAnimating, setIsAnimating] = useState(false)
  const [nextCatAnnouncement, setNextCatAnnouncement] = useState<Category | null>(null)

  const cardRef = useRef<HTMLDivElement>(null)

  const categoryItems = foodItems.filter((item) => item.category === currentCategory)
  const currentItem = categoryItems[currentCardIndex]
  const nextItem = categoryItems[currentCardIndex + 1]
  const categoryIndex = CATEGORIES.indexOf(currentCategory)
  const config = CATEGORY_CONFIG[currentCategory]

  const totalItems = foodItems.length
  const answeredItems = responses.length

  // Reset card position when card changes
  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    card.style.transition = 'none'
    card.style.transform = 'translateX(0) rotate(0deg)'
  }, [currentCardIndex, currentCategory])

  const advanceCard = useCallback(() => {
    if (currentCardIndex + 1 >= categoryItems.length) {
      const nextIdx = categoryIndex + 1
      if (nextIdx < CATEGORIES.length) {
        const nextCat = CATEGORIES[nextIdx]
        confetti({ particleCount: 55, spread: 65, origin: { y: 0.6 }, gravity: 2.2, scalar: 0.7, colors: ['#F5A623', '#22c55e', '#ffffff'] })
        setCurrentCategory(nextCat)
        setCurrentCardIndex(0)
        setNextCatAnnouncement(nextCat)
        setTimeout(() => setNextCatAnnouncement(null), 2200)
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
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(30)

      cardRef.current.style.transition = 'transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      cardRef.current.style.transform = direction === 'right'
        ? 'translateX(130vw) rotate(22deg)'
        : 'translateX(-130vw) rotate(-22deg)'

      setTimeout(advanceCard, 400)
    },
    [currentItem, isAnimating, addResponse, advanceCard],
  )

  const bind = useDrag(
    ({ movement: [mx], distance: [dx], direction: [xDir], dragging, currentTarget }) => {
      if (isAnimating) return
      const el = (currentTarget as HTMLElement | null) ?? cardRef.current
      if (!el) return

      if (dragging) {
        el.style.transition = 'none'
        el.style.transform = `translateX(${mx}px) rotate(${(mx / 300) * 22}deg)`
      } else {
        if (dx > 100) {
          swipeCard(xDir > 0 ? 'right' : 'left')
        } else {
          el.style.transition = 'transform 0.3s ease'
          el.style.transform = 'translateX(0) rotate(0deg)'
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

  const globalProgress = totalItems > 0 ? (answeredItems / totalItems) * 100 : 0

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Atmospheric blurred background */}
      <div className="absolute inset-0">
        <img
          src={currentItem.image_url}
          alt=""
          draggable={false}
          className="h-full w-full object-cover opacity-20 blur-2xl"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, color-mix(in srgb, var(--background) 50%, transparent), transparent, var(--background) 80%)' }}
        />
      </div>

      {/* Progress bar + count */}
      <div className="absolute left-0 right-0 top-0 z-50">
        <div className="h-[2px] bg-foreground/[0.06]">
          <motion.div
            className="h-full bg-primary"
            animate={{ width: `${globalProgress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-end px-4 pt-1">
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {answeredItems} / {totalItems}
          </span>
        </div>
      </div>

      {/* Card area */}
      <div className="relative z-10 w-full max-w-sm px-5">
        {/* Next card (behind) */}
        {nextItem && (
          <div
            className="absolute inset-x-5 -bottom-4 overflow-hidden rounded-[28px] opacity-50"
            style={{ height: '68vh', transform: 'scale(0.93)' }}
          >
            <img src={nextItem.image_url} alt="" draggable={false} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-background/40" />
          </div>
        )}

        <motion.div
          key={currentItem.id}
          style={{ height: '68vh' }}
          initial={{ scale: 0.86, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 110, damping: 13, mass: 1.1 }}
        >
          <div
            ref={cardRef}
            className="relative h-full cursor-grab overflow-hidden rounded-[28px] shadow-2xl active:cursor-grabbing touch-none select-none"
            {...(bind() as unknown as Record<string, unknown>)}
          >
            {/* Transparent overlay prevents browser native image drag */}
            <div className="absolute inset-0 z-10" />

            <img
              src={currentItem.image_url}
              alt={currentItem.name}
              draggable={false}
              className="h-full w-full object-cover"
            />

            {/* Bottom gradient */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[60%] bg-gradient-to-t from-black via-black/80 to-transparent" />

            {/* Progress dots */}
            <div className="absolute left-0 right-0 top-4 z-30 flex justify-center gap-[5px]">
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
            <div className="absolute left-4 top-10 z-30 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
              <span>{config.emoji}</span>
              <span>{config.label}</span>
            </div>

            {/* Food info */}
            <div className="absolute inset-x-0 bottom-0 z-30 p-5 pb-6">
              <h2 className="text-[28px] font-bold leading-tight text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                {currentItem.name}
              </h2>
              {currentItem.description && (
                <p className="mt-1.5 text-sm leading-snug text-white/70">{currentItem.description}</p>
              )}
              <p className="mt-2 text-xs text-white/30">swipe or use ← → keys</p>
            </div>
          </div>
        </motion.div>

        {/* Inline category announcement pill */}
        <AnimatePresence>
          {nextCatAnnouncement && (
            <motion.div
              className="absolute left-1/2 top-4 z-50 -translate-x-1/2"
              initial={{ opacity: 0, y: -14, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            >
              <div className="flex items-center gap-2 rounded-full border border-border bg-card/95 px-4 py-2 shadow-lg backdrop-blur-md">
                <span className="text-base">{CATEGORY_CONFIG[nextCatAnnouncement].emoji}</span>
                <span className="text-sm font-semibold text-foreground">
                  Up next: {CATEGORY_CONFIG[nextCatAnnouncement].label}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Minimal action row */}
      <div className="relative z-10 mt-6 flex items-center gap-4">
        <motion.button
          onClick={() => swipeCard('left')}
          className="cursor-pointer rounded-xl border border-border bg-card/80 px-5 py-2.5 text-sm font-medium text-muted-foreground backdrop-blur-sm transition-all hover:border-destructive/40 hover:text-destructive disabled:opacity-30"
          whileTap={{ scale: 0.95 }}
          disabled={isAnimating}
        >
          Pass
        </motion.button>

        <motion.button
          onClick={() => swipeCard('right')}
          className="cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-30"
          whileTap={{ scale: 0.95 }}
          disabled={isAnimating}
        >
          Like
        </motion.button>
      </div>
    </div>
  )
}
