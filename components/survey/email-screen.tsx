'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSurveyStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ArrowRight } from 'lucide-react'

export function EmailScreen() {
  const [email, setEmailValue] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { setEmail, setScreen, setStudentId } = useSurveyStore()

  const isValid = email.toLowerCase().endsWith('@alustudent.com')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) {
      setError('Use your ALU student email — @alustudent.com')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: existing, error: q } = await supabase
        .from('students')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle()
      if (q) throw q

      setEmail(email.toLowerCase())

      if (existing) {
        setStudentId(existing.id)
        setScreen('results')
      } else {
        setScreen('gender')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center bg-background px-6"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--primary) 10%, transparent), var(--background))' }}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="w-full max-w-sm">
        {/* Icon */}
        <motion.div
          className="mb-8 flex justify-center"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-4xl">
            👋
          </div>
        </motion.div>

        <motion.h1
          className="mb-2 text-center text-4xl font-bold text-foreground"
          style={{ fontFamily: 'var(--font-heading)' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          Welcome
        </motion.h1>
        <motion.p
          className="mb-10 text-center text-[15px] text-muted-foreground"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Enter your ALU student email to begin
        </motion.p>

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="relative">
            <input
              type="email"
              placeholder="yourname@alustudent.com"
              value={email}
              onChange={(e) => { setEmailValue(e.target.value); setError('') }}
              disabled={isLoading}
              className="w-full rounded-2xl border border-border bg-card px-5 py-4 text-center text-[16px] text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-0 transition-colors"
            />
          </div>

          <AnimateErrorWrapper show={!!error}>
            <p className="text-center text-sm text-destructive">{error}</p>
          </AnimateErrorWrapper>

          <button
            type="submit"
            disabled={!email || isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-[16px] font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>Continue <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </motion.form>
      </div>
    </motion.div>
  )
}

function AnimateErrorWrapper({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (!show) return null
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
      {children}
    </motion.div>
  )
}
