# ALU Cafeteria Survey

A mobile-first survey app for African Leadership University students to rate cafeteria food and help improve the menu.

## What it does

Students swipe through food items (Tinder-style) across four meal categories — Breakfast, Lunch, Snack, and Dinner. After rating, they can give detailed feedback on dishes they disliked, leave open-ended comments, and then view live aggregated results from all respondents.

## Tech stack

| Layer | Library |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database / Auth | Supabase |
| State | Zustand (persisted to localStorage) |
| Animations | Framer Motion |
| Gestures | @use-gesture/react |
| Styling | Tailwind CSS v4 |
| UI primitives | Radix UI / shadcn |

## Survey flow

```
Intro → Email → Gender → Country → [Category Transition → Swipe] × 4 → Dislike Detail → Feedback Detail → Open Feedback → Results
```

- **Intro** — animated slideshow with live respondent count
- **Email** — validates `@alustudent.com`; returning students skip straight to Results
- **Gender / Country** — demographic info, saved to Supabase `students` table
- **Swipe** — drag or use ← → arrow keys; confetti fires between categories
- **Dislike Detail** — pick which disliked items to elaborate on
- **Feedback Detail** — per-item "what's wrong" + suggestion fields
- **Open Feedback** — free-text box for anything else
- **Results** — live stats: overall satisfaction, per-category bars, top 5 loved/disliked, expandable item cards, retake option

## Project structure

```
app/
  layout.tsx          # Root layout (fonts, ThemeProvider)
  page.tsx            # Renders <SurveyApp />
  globals.css         # Tailwind + CSS custom properties (light & dark theme)

components/
  survey/
    survey-app.tsx    # Screen router, data fetching, realtime sub
    onboarding.tsx    # IntroScreen, EmailScreen, GenderScreen, CountryScreen
    post-swipe.tsx    # CategoryTransition, DislikeDetailScreen, FeedbackDetailScreen, OpenFeedbackScreen
    swipe-screen.tsx  # Card swipe UI with drag gesture + keyboard support
    results-screen.tsx# Stats, charts, item detail overlay, retake dialog
  ui/
    alert-dialog.tsx  # Radix alert dialog (used by retake confirmation)
    button.tsx        # shadcn button variants

lib/
  utils.ts            # cn(), createClient(), all TypeScript types, constants (CATEGORIES, AFRICAN_COUNTRIES)
  store.ts            # Zustand store — all survey state and actions
```

## Getting started

**Prerequisites:** Node 20, pnpm, a Supabase project.

```bash
# 1. Install dependencies
pnpm install

# 2. Set environment variables
cp .env.example .env
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Run locally
pnpm dev
```

The app will be available at `http://localhost:3000`.

## Supabase schema

Four tables are required:

```sql
-- Students (one row per respondent)
create table students (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  gender     text not null,
  country    text not null,
  created_at timestamptz default now()
);

-- Food items
create table food_items (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  image_url   text not null,
  category    text not null,   -- 'breakfast' | 'lunch' | 'snack' | 'dinner'
  order_index integer not null,
  is_active   boolean default true
);

-- Swipe responses
create table responses (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid references students(id),
  food_item_id uuid references food_items(id),
  liked        boolean not null,
  what_is_wrong text,
  suggestion   text,
  unique (student_id, food_item_id)
);

-- Open-ended feedback
create table open_feedback (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid references students(id),
  content    text not null,
  created_at timestamptz default now()
);
```

Enable **Realtime** on the `students` table for the live respondent counter on the intro screen.

## Build

```bash
pnpm build   # production build
pnpm start   # serve production build
```
