'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSurveyStore } from '@/lib/store'
import type { Gender } from '@/lib/types'

const OPTIONS: { value: Gender; label: string; emoji: string; desc: string }[] = [
  { value: 'male', label: 'Male', emoji: '♂️', desc: 'He / Him' },
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
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--primary) 10%, transparent), var(--background))' }}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="w-full max-w-sm">
        <motion.p
          className="mb-3 text-center text-sm font-medium uppercase tracking-widest text-primary"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          About you
        </motion.p>
        <motion.h1
          className="mb-10 text-center text-4xl font-bold text-foreground"
          style={{ fontFamily: 'var(--font-heading)' }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          How do you identify?
        </motion.h1>

        <div className="flex gap-4">
          {OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`flex flex-1 cursor-pointer flex-col items-center gap-3 rounded-3xl border py-8 transition-all ${
                selected === opt.value
                  ? 'border-primary/60 bg-primary/10 shadow-lg shadow-primary/10'
                  : 'border-border bg-card hover:border-border hover:bg-secondary'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 280, damping: 22 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="text-5xl">{opt.emoji}</span>
              <div>
                <p
                  className={`text-lg font-semibold ${selected === opt.value ? 'text-primary' : 'text-foreground'}`}
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
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
