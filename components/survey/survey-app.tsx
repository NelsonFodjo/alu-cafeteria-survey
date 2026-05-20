'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useSurveyStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { IntroScreen } from './intro-screen'
import { EmailScreen } from './email-screen'
import { GenderScreen } from './gender-screen'
import { CountryScreen } from './country-screen'
import { CategoryTransition } from './category-transition'
import { SwipeScreen } from './swipe-screen'
import { DislikeDetailScreen } from './dislike-detail-screen'
import { FeedbackDetailScreen } from './feedback-detail-screen'
import { OpenFeedbackScreen } from './open-feedback-screen'
import { ResultsScreen } from './results-screen'
import type { FoodItem } from '@/lib/types'
import { Loader2 } from 'lucide-react'

export function SurveyApp() {
  const { screen, currentCategory } = useSurveyStore()
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [liveCount, setLiveCount] = useState(0)

  useEffect(() => {
    const fetchFoodItems = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('food_items')
          .select('*')
          .eq('is_active', true)
          .order('order_index')

        if (error) throw error
        setFoodItems(data || [])
      } catch (err) {
        console.error('Error fetching food items:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFoodItems()
  }, [])

  // Live respondent counter via Supabase realtime
  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .then(({ count }) => setLiveCount(count || 0))

    const channel = supabase
      .channel('live-students')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'students' }, () => {
        setLiveCount((prev) => prev + 1)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
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
      {screen === 'intro' && <IntroScreen key="intro" liveCount={liveCount} />}
      {screen === 'email' && <EmailScreen key="email" />}
      {screen === 'gender' && <GenderScreen key="gender" />}
      {screen === 'country' && <CountryScreen key="country" />}
      {screen === 'category-transition' && (
        <CategoryTransition key={`transition-${currentCategory}`} category={currentCategory} />
      )}
      {screen === 'swipe' && <SwipeScreen key="swipe" foodItems={foodItems} />}
      {screen === 'dislike-detail' && <DislikeDetailScreen key="dislike-detail" foodItems={foodItems} />}
      {screen === 'feedback-detail' && <FeedbackDetailScreen key="feedback-detail" foodItems={foodItems} />}
      {screen === 'open-feedback' && <OpenFeedbackScreen key="open-feedback" />}
      {screen === 'results' && <ResultsScreen key="results" foodItems={foodItems} />}
    </AnimatePresence>
  )
}
