'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSurveyStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { AFRICAN_COUNTRIES } from '@/lib/types'
import { Search, Loader2, ArrowRight } from 'lucide-react'

export function CountryScreen() {
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { country, setCountry, setScreen, email, gender, setStudentId } = useSurveyStore()

  const filtered = AFRICAN_COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  )

  const handleContinue = async () => {
    if (!country || !email || !gender) return
    setIsLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from('students')
        .insert({ email: email.toLowerCase(), gender, country })
        .select('id')
        .single()
      if (err) throw err
      setStudentId(data.id)
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
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="shrink-0 px-6 pb-3 pt-12">
        <motion.p
          className="mb-2 text-center text-sm font-medium uppercase tracking-widest text-primary"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Almost there
        </motion.p>
        <motion.h1
          className="mb-5 text-center text-4xl font-bold text-foreground"
          style={{ fontFamily: 'var(--font-heading)' }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          Where are you from?
        </motion.h1>

        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
        >
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

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-2">
        <motion.div
          className="grid grid-cols-3 gap-2 pb-2 sm:grid-cols-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {filtered.map((c, i) => (
            <motion.button
              key={c.code}
              onClick={() => setCountry(c.name)}
              className={`flex cursor-pointer flex-col items-center gap-1 rounded-2xl border p-3 transition-all ${
                country === c.name
                  ? 'border-primary/60 bg-primary/10 shadow-md shadow-primary/10'
                  : 'border-border bg-card hover:border-border hover:bg-secondary'
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
          <motion.p
            className="mb-3 text-center text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Selected: <span className="text-foreground font-medium">{country}</span>
          </motion.p>
        )}
        {error && (
          <p className="mb-3 text-center text-sm text-destructive">{error}</p>
        )}
        <button
          onClick={handleContinue}
          disabled={!country || isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-[16px] font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Let's go <ArrowRight className="h-4 w-4" /></>}
        </button>
      </div>
    </motion.div>
  )
}
