'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSurveyStore } from '@/lib/store'
import { createClient } from '@/lib/utils'
import { CATEGORIES, CATEGORY_CONFIG, type Category, type FoodItem } from '@/lib/utils'
import { Trophy, HeartCrack, Flame, Loader2, RotateCcw, X } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface FoodStats {
  id: string
  name: string
  image_url: string
  category: string
  likes: number
  dislikes: number
  total: number
  likePercentage: number
}

// SVG donut ring showing a percentage
function Ring({ pct, size = 80, stroke = 9, color = 'var(--primary)' }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const filled = (pct / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-foreground/[0.08]" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circ}`}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - filled }}
        transition={{ duration: 1.1, ease: 'easeOut', delay: 0.3 }}
      />
    </svg>
  )
}

export function ResultsScreen({ foodItems }: { foodItems: FoodItem[] }) {
  const { studentId, resetForRetake, responses } = useSurveyStore()
  const [isLoading, setIsLoading] = useState(true)
  const [totalStudents, setTotalStudents] = useState(0)
  const [categoryStats, setCategoryStats] = useState<Record<string, FoodStats[]>>({})
  const [allStats, setAllStats] = useState<FoodStats[]>([])
  const [activeTab, setActiveTab] = useState<Category>('breakfast')
  const [expandedItem, setExpandedItem] = useState<FoodStats | null>(null)
  const [showRetake, setShowRetake] = useState(false)
  const [isRetaking, setIsRetaking] = useState(false)

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    try {
      const supabase = createClient()
      const { count } = await supabase.from('students').select('*', { count: 'exact', head: true })
      setTotalStudents(count || 0)

      const { data: responses } = await supabase.from('responses').select('food_item_id, liked')
      if (!responses) return

      const raw: Record<string, { likes: number; dislikes: number }> = {}
      responses.forEach((r) => {
        if (!raw[r.food_item_id]) raw[r.food_item_id] = { likes: 0, dislikes: 0 }
        r.liked ? raw[r.food_item_id].likes++ : raw[r.food_item_id].dislikes++
      })

      const catStats: Record<string, FoodStats[]> = {}
      const all: FoodStats[] = []
      CATEGORIES.forEach((cat) => {
        catStats[cat] = foodItems
          .filter((f) => f.category === cat)
          .map((item) => {
            const s = raw[item.id] || { likes: 0, dislikes: 0 }
            const total = s.likes + s.dislikes
            const stat: FoodStats = {
              id: item.id, name: item.name, image_url: item.image_url, category: cat,
              likes: s.likes, dislikes: s.dislikes, total,
              likePercentage: total > 0 ? (s.likes / total) * 100 : 0,
            }
            all.push(stat)
            return stat
          })
          .sort((a, b) => b.likePercentage - a.likePercentage)
      })
      setCategoryStats(catStats)
      setAllStats(all)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetake = async () => {
    setIsRetaking(true)
    try {
      if (studentId) {
        const supabase = createClient()
        await supabase.from('responses').delete().eq('student_id', studentId)
        await supabase.from('open_feedback').delete().eq('student_id', studentId)
      }
    } catch (e) {
      console.error(e)
    } finally {
      resetForRetake()
      setShowRetake(false)
      setIsRetaking(false)
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const TARGET = 200
  const progress = Math.min((totalStudents / TARGET) * 100, 100)

  // Aggregate numbers
  const totalVotes = allStats.reduce((s, i) => s + i.total, 0)
  const totalLikes = allStats.reduce((s, i) => s + i.likes, 0)
  const overallPct = totalVotes > 0 ? Math.round((totalLikes / totalVotes) * 100) : 0

  // Per-category aggregate
  const catAgg = CATEGORIES.map((cat) => {
    const items = categoryStats[cat] || []
    const likes = items.reduce((s, i) => s + i.likes, 0)
    const total = items.reduce((s, i) => s + i.total, 0)
    return { cat, likes, total, pct: total > 0 ? Math.round((likes / total) * 100) : 0 }
  })

  // Highlights
  const withData = allStats.filter((f) => f.total >= 1)
  const mostLoved = withData.length ? withData.reduce((a, b) => b.likePercentage > a.likePercentage ? b : a) : null
  const mostDisliked = withData.length ? withData.reduce((a, b) => b.likePercentage < a.likePercentage ? b : a) : null
  const mostControversial = withData.length ? withData.reduce((a, b) => Math.abs(b.likePercentage - 50) < Math.abs(a.likePercentage - 50) ? b : a) : null

  // Top 5 liked / disliked
  const top5Loved = [...withData].sort((a, b) => b.likePercentage - a.likePercentage).slice(0, 5)
  const top5Disliked = [...withData].sort((a, b) => a.likePercentage - b.likePercentage).slice(0, 5)

  return (
    <motion.div
      className="fixed inset-0 overflow-y-auto bg-background"
      style={{ background: 'radial-gradient(ellipse 100% 50% at 50% 0%, color-mix(in srgb, var(--primary) 10%, transparent), var(--background))' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="mx-auto max-w-lg px-5 pb-28 pt-12">

        {/* Header */}
        <motion.div className="mb-8 text-center" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">Survey</p>
          <h1 className="text-4xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Results</h1>
        </motion.div>

        {/* Target progress */}
        <motion.div className="mb-6 rounded-3xl border border-border bg-card p-5"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Survey Target</span>
            <span className="text-xl font-bold text-primary">{totalStudents} <span className="text-sm text-muted-foreground">/ {TARGET}</span></span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-foreground/[0.08]">
            <motion.div className="h-full rounded-full bg-primary"
              initial={{ width: 0 }} animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }} />
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">{Math.round(progress)}% to goal</p>
        </motion.div>

        {/* Overall satisfaction + big numbers */}
        <motion.div className="mb-6 rounded-3xl border border-border bg-card p-5"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Overall Satisfaction</p>
          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0">
              <Ring pct={overallPct} size={96} stroke={10} color="#22c55e" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-foreground">{overallPct}%</span>
                <span className="text-[10px] text-muted-foreground">liked</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Total Swipes</span>
                <span className="text-sm font-bold text-foreground">{totalVotes.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">👍 Liked</span>
                <span className="text-sm font-bold text-emerald-500">{totalLikes.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">👎 Disliked</span>
                <span className="text-sm font-bold text-red-500">{(totalVotes - totalLikes).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Your votes */}
        {responses.length > 0 && (
          <motion.div className="mb-6 rounded-3xl border border-border bg-card p-5"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Votes</p>
            <div className="grid grid-cols-3 divide-x divide-border text-center">
              <div className="pr-4">
                <p className="text-3xl font-black text-emerald-500">{responses.filter(r => r.liked).length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Liked</p>
              </div>
              <div className="px-4">
                <p className="text-3xl font-black text-red-500">{responses.filter(r => !r.liked).length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Passed</p>
              </div>
              <div className="pl-4">
                <p className="text-3xl font-black text-foreground">{responses.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Category performance */}
        <motion.div className="mb-6 rounded-3xl border border-border bg-card p-5"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">By Category</p>
          <div className="space-y-3">
            {catAgg.map(({ cat, pct, total }, i) => (
              <div key={cat}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {CATEGORY_CONFIG[cat as Category].emoji} {CATEGORY_CONFIG[cat as Category].label}
                  </span>
                  <span className="text-sm font-bold" style={{ color: pct >= 60 ? '#22c55e' : pct >= 40 ? 'var(--primary)' : '#ef4444' }}>
                    {pct}%
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-foreground/[0.08]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: pct >= 60 ? '#22c55e' : pct >= 40 ? 'var(--primary)' : '#ef4444' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
                  />
                </div>
                <p className="mt-0.5 text-right text-[10px] text-muted-foreground">{total} Likes</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Highlights row */}
        {(mostLoved || mostDisliked || mostControversial) && (
          <motion.div className="mb-6 grid grid-cols-3 gap-2.5"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            {[
              mostLoved && { icon: Trophy, label: 'Most Loved', item: mostLoved, stat: `${Math.round(mostLoved.likePercentage)}%`, color: 'text-emerald-500' },
              mostDisliked && { icon: HeartCrack, label: 'Most Disliked', item: mostDisliked, stat: `${Math.round(100 - mostDisliked.likePercentage)}%`, color: 'text-red-500' },
              mostControversial && { icon: Flame, label: 'Controversial', item: mostControversial, stat: `${Math.round(mostControversial.likePercentage)}/${Math.round(100 - mostControversial.likePercentage)}`, color: 'text-primary' },
            ].filter(Boolean).map((h) => {
              if (!h) return null
              const Icon = h.icon
              return (
                <button key={h.label} onClick={() => setExpandedItem(h.item)}
                  className="cursor-pointer rounded-2xl border border-border bg-card p-3 text-left transition-all hover:border-primary/40 active:scale-95">
                  <div className={`mb-2 flex items-center gap-1.5 ${h.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">{h.label}</span>
                  </div>
                  <img src={h.item.image_url} alt={h.item.name} className="mb-2 h-10 w-10 rounded-xl object-cover" />
                  <p className="truncate text-xs font-medium text-foreground">{h.item.name}</p>
                  <p className={`text-[10px] ${h.color}`}>{h.stat}</p>
                </button>
              )
            })}
          </motion.div>
        )}

        {/* Top 5 Loved */}
        {top5Loved.length > 0 && (
          <motion.div className="mb-6 rounded-3xl border border-border bg-card p-5"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">🏆 Top Loved</p>
            <div className="space-y-2">
              {top5Loved.map((item, i) => (
                <button key={item.id} onClick={() => setExpandedItem(item)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-2xl p-2 text-left transition-all hover:bg-foreground/[0.04] active:scale-[0.98]">
                  <span className="w-5 text-center text-sm font-black text-muted-foreground">{i + 1}</span>
                  <img src={item.image_url} alt={item.name} className="h-9 w-9 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]">
                      <motion.div className="h-full rounded-full bg-emerald-500"
                        initial={{ width: 0 }} animate={{ width: `${item.likePercentage}%` }}
                        transition={{ duration: 0.7, delay: 0.3 + i * 0.06 }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-500">{Math.round(item.likePercentage)}%</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Top 5 Disliked */}
        {top5Disliked.length > 0 && (
          <motion.div className="mb-6 rounded-3xl border border-border bg-card p-5"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">💔 Most Disliked</p>
            <div className="space-y-2">
              {top5Disliked.map((item, i) => (
                <button key={item.id} onClick={() => setExpandedItem(item)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-2xl p-2 text-left transition-all hover:bg-foreground/[0.04] active:scale-[0.98]">
                  <span className="w-5 text-center text-sm font-black text-muted-foreground">{i + 1}</span>
                  <img src={item.image_url} alt={item.name} className="h-9 w-9 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]">
                      <motion.div className="h-full rounded-full bg-red-500"
                        initial={{ width: 0 }} animate={{ width: `${100 - item.likePercentage}%` }}
                        transition={{ duration: 0.7, delay: 0.3 + i * 0.06 }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-red-500">{Math.round(100 - item.likePercentage)}%</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Category tabs — all items */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="mb-4 flex border-b border-border">
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setActiveTab(cat)}
                className={`relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 pb-3 pt-1 text-xs font-medium transition-colors ${
                  activeTab === cat ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'
                }`}>
                <span>{CATEGORY_CONFIG[cat].emoji}</span>
                <span className="hidden sm:inline">{CATEGORY_CONFIG[cat].label}</span>
                {activeTab === cat && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-primary"
                  />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeTab} className="space-y-2"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}>
              {categoryStats[activeTab]?.map((item, i) => (
                <motion.button key={item.id} onClick={() => setExpandedItem(item)}
                  className="w-full cursor-pointer overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/30 active:scale-[0.98]"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <div className="flex items-center gap-3 p-3">
                    <img src={item.image_url} alt={item.name} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate font-medium text-foreground">{item.name}</p>
                    </div>
                    <p className="font-bold text-emerald-500">{Math.round(item.likePercentage)}%</p>
                  </div>
                  <div className="flex h-1.5 overflow-hidden rounded-b-2xl">
                    <motion.div
                      className="bg-emerald-500/70"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(item.likePercentage, 4)}%` }}
                      transition={{ duration: 0.8, delay: i * 0.04 + 0.2 }}
                    />
                    <div className="flex-1 bg-red-500/40" />
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Retake */}
        {studentId && (
          <motion.button onClick={() => setShowRetake(true)}
            className="mt-8 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border py-4 text-[15px] text-muted-foreground transition-all hover:border-foreground/30 hover:text-foreground"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            whileTap={{ scale: 0.98 }}>
            <RotateCcw className="h-4 w-4" /> Retake Survey
          </motion.button>
        )}
      </div>

      {/* Expanded item overlay */}
      <AnimatePresence>
        {expandedItem && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedItem(null)}
          >
            <div className="absolute inset-0 cursor-pointer bg-black/60 backdrop-blur-sm" />
            <motion.div
              className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
              initial={{ scale: 0.85, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-52 w-full">
                <img src={expandedItem.image_url} alt={expandedItem.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                <button onClick={() => setExpandedItem(null)}
                  className="absolute right-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm">
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-3 left-4">
                  <span className="rounded-full bg-black/40 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                    {CATEGORY_CONFIG[expandedItem.category as Category]?.emoji} {CATEGORY_CONFIG[expandedItem.category as Category]?.label}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <h2 className="mb-4 text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  {expandedItem.name}
                </h2>

                <div className="mb-5 flex items-center gap-6">
                  {/* Like ring */}
                  <div className="relative flex-shrink-0">
                    <Ring pct={expandedItem.likePercentage} size={88} stroke={9} color="#22c55e" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-black text-foreground">{Math.round(expandedItem.likePercentage)}%</span>
                      <span className="text-[9px] text-muted-foreground">liked</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2.5">
                    <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-2">
                      <span className="text-sm text-emerald-600 dark:text-emerald-400">👍 Liked</span>
                      <span className="text-base font-black text-emerald-500">{expandedItem.likes}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-red-500/10 px-3 py-2">
                      <span className="text-sm text-red-600 dark:text-red-400">👎 Disliked</span>
                      <span className="text-base font-black text-red-500">{expandedItem.dislikes}</span>
                    </div>
                  </div>
                </div>

                {/* Full bar */}
                <div className="flex h-3 overflow-hidden rounded-full">
                  <div className="bg-emerald-500 transition-all" style={{ width: `${expandedItem.likePercentage}%` }} />
                  <div className="flex-1 bg-red-500/60" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={showRetake} onOpenChange={setShowRetake}>
        <AlertDialogContent className="border border-border bg-card text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Retake the survey?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">This replaces all your previous answers.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border bg-transparent text-muted-foreground hover:bg-secondary">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRetake} disabled={isRetaking} className="bg-primary text-primary-foreground hover:opacity-90">
              {isRetaking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes, retake'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
