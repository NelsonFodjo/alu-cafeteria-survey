'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useSurveyStore } from '@/lib/store'
import { createClient, type FoodItem } from '@/lib/utils'
import { IntroScreen, EmailScreen, GenderScreen, CountryScreen } from './onboarding'
import { CategoryTransition, DislikeDetailScreen, FeedbackDetailScreen, OpenFeedbackScreen } from './post-swipe'
import { SwipeScreen } from './swipe-screen'
import { ResultsScreen } from './results-screen'
import { Loader2 } from 'lucide-react'

export function SurveyApp() {
  const { screen, currentCategory } = useSurveyStore()
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [liveCount, setLiveCount] = useState(0)

  // Fetch all active food items once on mount
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('food_items')
      .select('*')
      .eq('is_active', true)
      .order('order_index')
      .then(({ data, error }) => {
        if (!error) setFoodItems(data || [])
        setIsLoading(false)
      })
  }, [])

  // Subscribe to realtime student inserts for the live counter
  useEffect(() => {
    const supabase = createClient()
    supabase.from('students').select('*', { count: 'exact', head: true }).then(({ count }) => setLiveCount(count || 0))
    const channel = supabase
      .channel('live-students')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'students' }, () => setLiveCount((p) => p + 1))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {screen === 'intro'               && <IntroScreen key="intro" liveCount={liveCount} />}
      {screen === 'email'               && <EmailScreen key="email" />}
      {screen === 'gender'              && <GenderScreen key="gender" />}
      {screen === 'country'             && <CountryScreen key="country" />}
      {screen === 'category-transition' && <CategoryTransition key={`transition-${currentCategory}`} category={currentCategory} />}
      {screen === 'swipe'               && <SwipeScreen key="swipe" foodItems={foodItems} />}
      {screen === 'dislike-detail'      && <DislikeDetailScreen key="dislike-detail" foodItems={foodItems} />}
      {screen === 'feedback-detail'     && <FeedbackDetailScreen key="feedback-detail" foodItems={foodItems} />}
      {screen === 'open-feedback'       && <OpenFeedbackScreen key="open-feedback" />}
      {screen === 'results'             && <ResultsScreen key="results" foodItems={foodItems} />}
    </AnimatePresence>
  )
}
