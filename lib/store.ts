'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Screen, Gender, Response, Category } from './types'

interface SurveyStore {
  // Navigation
  screen: Screen
  setScreen: (screen: Screen) => void

  // User info
  email: string
  setEmail: (email: string) => void
  gender: Gender | null
  setGender: (gender: Gender) => void
  country: string
  setCountry: (country: string) => void
  studentId: string | null
  setStudentId: (id: string) => void

  // Survey progress
  currentCategory: Category
  setCurrentCategory: (category: Category) => void
  currentCardIndex: number
  setCurrentCardIndex: (index: number) => void

  // Responses
  responses: Response[]
  addResponse: (response: Response) => void
  updateResponse: (foodItemId: string, update: Partial<Response>) => void
  getDislikedResponses: () => Response[]

  // Feedback selection
  selectedDislikedIds: string[]
  toggleDislikedSelection: (id: string) => void
  clearDislikedSelection: () => void
  currentFeedbackIndex: number
  setCurrentFeedbackIndex: (index: number) => void

  // Open feedback
  openFeedback: string
  setOpenFeedback: (feedback: string) => void

  // Streak tracking
  streak: number
  lastSwipeDirection: 'left' | 'right' | null
  updateStreak: (direction: 'left' | 'right') => void
  resetStreak: () => void

  // Survey completion
  isDone: boolean
  setIsDone: (done: boolean) => void

  // Reset
  resetSurvey: () => void
  resetForRetake: () => void
}

const initialState = {
  screen: 'intro' as Screen,
  email: '',
  gender: null as Gender | null,
  country: '',
  studentId: null as string | null,
  currentCategory: 'breakfast' as Category,
  currentCardIndex: 0,
  responses: [] as Response[],
  selectedDislikedIds: [] as string[],
  currentFeedbackIndex: 0,
  openFeedback: '',
  streak: 0,
  lastSwipeDirection: null as 'left' | 'right' | null,
  isDone: false,
}

export const useSurveyStore = create<SurveyStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setScreen: (screen) => set({ screen }),
      setEmail: (email) => set({ email }),
      setGender: (gender) => set({ gender }),
      setCountry: (country) => set({ country }),
      setStudentId: (id) => set({ studentId: id }),
      setCurrentCategory: (category) => set({ currentCategory: category }),
      setCurrentCardIndex: (index) => set({ currentCardIndex: index }),
      
      addResponse: (response) => set((state) => ({
        responses: [...state.responses.filter(r => r.food_item_id !== response.food_item_id), response]
      })),
      
      updateResponse: (foodItemId, update) => set((state) => ({
        responses: state.responses.map(r => 
          r.food_item_id === foodItemId ? { ...r, ...update } : r
        )
      })),
      
      getDislikedResponses: () => get().responses.filter(r => !r.liked),
      
      toggleDislikedSelection: (id) => set((state) => ({
        selectedDislikedIds: state.selectedDislikedIds.includes(id)
          ? state.selectedDislikedIds.filter(i => i !== id)
          : [...state.selectedDislikedIds, id]
      })),
      
      clearDislikedSelection: () => set({ selectedDislikedIds: [] }),
      setCurrentFeedbackIndex: (index) => set({ currentFeedbackIndex: index }),
      setOpenFeedback: (feedback) => set({ openFeedback: feedback }),
      
      updateStreak: (direction) => set((state) => {
        if (state.lastSwipeDirection === direction) {
          return { streak: state.streak + 1, lastSwipeDirection: direction }
        }
        return { streak: 1, lastSwipeDirection: direction }
      }),

      resetStreak: () => set({ streak: 0, lastSwipeDirection: null }),

      setIsDone: (done) => set({ isDone: done }),
      
      resetSurvey: () => set(initialState),
      
      resetForRetake: () => set({
        ...initialState,
        email: get().email,
        gender: get().gender,
        country: get().country,
        studentId: get().studentId,
        screen: 'swipe',
      }),
    }),
    {
      name: 'alu-cafeteria-survey',
    }
  )
)
