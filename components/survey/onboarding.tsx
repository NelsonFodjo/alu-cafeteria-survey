'use client'

// ─── Onboarding screens: Intro → Email → Gender → Country ────────────────────

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSurveyStore } from '@/lib/store'
import { createClient, AFRICAN_COUNTRIES, type Gender } from '@/lib/utils'
import { Search, Loader2, ArrowRight } from 'lucide-react'

// ── Shared slide-in animation for each screen ─────────────────────────────────
const slideIn = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
}
const radialBg = 'radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--primary) 10%, transparent), var(--background))'

// ═══════════════════════════════════════════════════════════════════════════════
// IntroScreen
// ═══════════════════════════════════════════════════════════════════════════════
const SLIDES = [
  { text: 'Help us build a better cafeteria menu for every Alchemist', duration: 3800 },
  { text: 'Rate each dish — takes about 3 minutes', duration: 3200 },
  { text: 'Your responses are anonymous and go directly to the team', duration: 3500 },
  { text: 'Swipe right to like. Swipe left to pass.', duration: 3000 },
  { text: 'Ready?', duration: 1800 },
]

interface FoodImage { id: string; image_url: string; name: string }

export function IntroScreen({ liveCount = 0 }: { liveCount?: number }) {
  const [current, setCurrent] = useState(0)
  const [foodImages, setFoodImages] = useState<FoodImage[]>([])
  const setScreen = useSurveyStore((s) => s.setScreen)

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

  // Positions for the floating food bubble images
  const positions = [
    { top: '8%',  left: '4%',  size: 72, delay: 0   },
    { top: '12%', right: '6%', size: 56, delay: 0.4  },
    { bottom: '18%', left: '6%',  size: 64, delay: 0.8 },
    { bottom: '22%', right: '4%', size: 72, delay: 1.2 },
    { top: '42%', left: '2%',  size: 48, delay: 1.6  },
    { top: '38%', right: '2%', size: 52, delay: 2.0  },
  ]

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-background"
      style={{ background: 'radial-gradient(ellipse 90% 70% at 50% -5%, color-mix(in srgb, var(--primary) 12%, transparent), var(--background))', cursor: 'pointer' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.5 }}
      onClick={advance}
    >
      {/* Floating food images in the background */}
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
              scale:   { delay: pos.delay, duration: 0.6 },
              y:       { delay: pos.delay, duration: 4, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            <img src={food.image_url} alt="" draggable={false} className="h-full w-full object-cover" />
          </motion.div>
        )
      })}

      {/* ALU wordmark */}
      <motion.div
        className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex items-baseline gap-2"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <span className="text-2xl font-black tracking-tight text-primary" style={{ fontFamily: 'var(--font-heading)' }}>ALU</span>
        <span className="text-xs font-medium text-muted-foreground">Cafeteria Survey</span>
      </motion.div>

      {/* Cycling slide text */}
      <div className="relative z-10 flex max-w-sm flex-col items-center px-8 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={current}
            className="text-[22px] font-semibold leading-[1.35] text-foreground"
            style={{ fontFamily: 'var(--font-heading)' }}
            initial={{ opacity: 0, y: 28, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -24, filter: 'blur(8px)', scale: 0.94 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {SLIDES[current].text}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
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

      {/* Live respondent pill */}
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

      {/* Skip button */}
      <motion.button
        onClick={(e) => { e.stopPropagation(); setScreen('email') }}
        className="absolute right-6 top-6 z-20 cursor-pointer rounded-full bg-foreground/[0.06] px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
        whileTap={{ scale: 0.95 }}
      >
        Skip →
      </motion.button>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// EmailScreen — validates @alustudent.com and checks for existing student
// ═══════════════════════════════════════════════════════════════════════════════
export function EmailScreen() {
  const [email, setEmailValue] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { setEmail, setScreen, setStudentId } = useSurveyStore()

  const isValid = email.toLowerCase().endsWith('@alustudent.com')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) { setError('Use your ALU student email — @alustudent.com'); return }
    setIsLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: existing, error: q } = await supabase
        .from('students').select('id').eq('email', email.toLowerCase()).maybeSingle()
      if (q) throw q
      setEmail(email.toLowerCase())
      if (existing) { setStudentId(existing.id); setScreen('results') }
      else setScreen('gender')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center bg-background px-6"
      style={{ background: radialBg }}
      {...slideIn}
    >
      <div className="w-full max-w-sm">
        <motion.div
          className="mb-8 flex justify-center"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-4xl">👋</div>
        </motion.div>

        <motion.h1
          className="mb-2 text-center text-4xl font-bold text-foreground"
          style={{ fontFamily: 'var(--font-heading)' }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        >
          Welcome
        </motion.h1>
        <motion.p
          className="mb-10 text-center text-[15px] text-muted-foreground"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >
          Enter your ALU student email to begin
        </motion.p>

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-3"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        >
          <input
            type="email"
            placeholder="yourname@alustudent.com"
            value={email}
            onChange={(e) => { setEmailValue(e.target.value); setError('') }}
            disabled={isLoading}
            className="w-full rounded-2xl border border-border bg-card px-5 py-4 text-center text-[16px] text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none transition-colors"
          />
          {error && (
            <motion.p className="text-center text-sm text-destructive" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
              {error}
            </motion.p>
          )}
          <button
            type="submit"
            disabled={!email || isLoading}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-[16px] font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
          </button>
        </motion.form>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// GenderScreen
// ═══════════════════════════════════════════════════════════════════════════════
const GENDER_OPTIONS: { value: Gender; label: string; emoji: string; desc: string }[] = [
  { value: 'male',   label: 'Male',   emoji: '♂️', desc: 'He / Him' },
  { value: 'female', label: 'Female', emoji: '♀️', desc: 'She / Her' },
]

export function GenderScreen() {
  const { setGender, setScreen } = useSurveyStore()
  const [selected, setSelected] = useState<Gender | null>(null)

  const handleSelect = (value: Gender) => {
    setSelected(value)
    setGender(value)
    setTimeout(() => setScreen('country'), 320)
  }

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center bg-background px-6"
      style={{ background: radialBg }}
      {...slideIn}
    >
      <div className="w-full max-w-sm">
        <motion.p
          className="mb-3 text-center text-sm font-medium uppercase tracking-widest text-primary"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        >
          About you
        </motion.p>
        <motion.h1
          className="mb-10 text-center text-4xl font-bold text-foreground"
          style={{ fontFamily: 'var(--font-heading)' }}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        >
          How do you identify?
        </motion.h1>

        <div className="flex gap-4">
          {GENDER_OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`flex flex-1 cursor-pointer flex-col items-center gap-3 rounded-3xl border py-8 transition-all ${
                selected === opt.value
                  ? 'border-primary/60 bg-primary/10 shadow-lg shadow-primary/10'
                  : 'border-border bg-card hover:bg-secondary'
              }`}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 280, damping: 22 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="text-5xl">{opt.emoji}</span>
              <div>
                <p className={`text-lg font-semibold ${selected === opt.value ? 'text-primary' : 'text-foreground'}`} style={{ fontFamily: 'var(--font-heading)' }}>
                  {opt.label}
                </p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CountryScreen — creates the student record in Supabase
// ═══════════════════════════════════════════════════════════════════════════════
export function CountryScreen() {
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { country, setCountry, setScreen, email, gender, setStudentId, studentId } = useSurveyStore()

  const filtered = AFRICAN_COUNTRIES.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))

  const handleContinue = async () => {
    if (!country || !email || !gender) return
    setIsLoading(true)
    setError('')
    try {
      const supabase = createClient()
      if (studentId) {
        // Retake path: student already exists, update demographics
        await supabase.from('students').update({ gender, country }).eq('id', studentId)
      } else {
        const { data, error: err } = await supabase
          .from('students').insert({ email: email.toLowerCase(), gender, country }).select('id').single()
        if (err) throw err
        setStudentId(data.id)
      }
      setScreen('category-transition')
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
      {...slideIn}
    >
      {/* Header */}
      <div className="shrink-0 px-6 pb-3 pt-12">
        <motion.p
          className="mb-2 text-center text-sm font-medium uppercase tracking-widest text-primary"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        >
          Almost there
        </motion.p>
        <motion.h1
          className="mb-5 text-center text-4xl font-bold text-foreground"
          style={{ fontFamily: 'var(--font-heading)' }}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        >
          Where are you from?
        </motion.h1>

        <motion.div className="relative" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search country…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-border bg-card py-3 pl-11 pr-5 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none transition-colors"
          />
        </motion.div>
      </div>

      {/* Country grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-2">
        <motion.div
          className="grid grid-cols-3 gap-2 pb-2 sm:grid-cols-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        >
          {filtered.map((c, i) => (
            <motion.button
              key={c.code}
              onClick={() => setCountry(c.name)}
              className={`flex cursor-pointer flex-col items-center gap-1 rounded-2xl border p-3 transition-all ${
                country === c.name
                  ? 'border-primary/60 bg-primary/10 shadow-md shadow-primary/10'
                  : 'border-border bg-card hover:bg-secondary'
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.015, 0.4) }}
              whileTap={{ scale: 0.93 }}
            >
              <span className="text-3xl leading-none">{c.flag}</span>
              <span className={`line-clamp-2 text-center text-[11px] font-medium ${country === c.name ? 'text-primary' : 'text-muted-foreground'}`}>
                {c.name}
              </span>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-6 pb-8 pt-4">
        {country && (
          <motion.p className="mb-3 text-center text-sm text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            Selected: <span className="font-medium text-foreground">{country}</span>
          </motion.p>
        )}
        {error && <p className="mb-3 text-center text-sm text-destructive">{error}</p>}
        <button
          onClick={handleContinue}
          disabled={!country || isLoading}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-[16px] font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Let's go <ArrowRight className="h-4 w-4" /></>}
        </button>
      </div>
    </motion.div>
  )
}
