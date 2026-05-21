# Results Page — How Every Number is Calculated

This document explains exactly where each figure on the Results page comes from and how it is computed. All calculations happen client-side in `components/survey/results-screen.tsx` after fetching raw data from Supabase.

---

## Data fetched from Supabase

Two queries run when the Results screen mounts:

| Query | Table | What it returns |
|---|---|---|
| 1 | `students` | Total row count (`count: exact`) |
| 2 | `responses` | Every row's `food_item_id` and `liked` (boolean) |

The `food_items` list is passed in as a prop from `SurveyApp` (fetched once on app load).

---

## Step 1 — Build raw tallies per food item

```
for each response row:
  raw[food_item_id].likes   += 1   if liked === true
  raw[food_item_id].dislikes += 1  if liked === false
```

This creates a dictionary keyed by `food_item_id`.

---

## Step 2 — Compute per-item stats

For each food item:

```
total            = likes + dislikes
likePercentage   = (likes / total) × 100     if total > 0
likePercentage   = 50                         if total === 0   (neutral default)
```

`likePercentage` is a float (e.g. `72.5`). It is rounded to the nearest integer only at display time.

---

## Metric definitions

### Survey Target progress bar

```
TARGET   = 200   (hard-coded goal)
progress = min( (totalStudents / 200) × 100,  100 )   %
```

Displayed as: `{totalStudents} / 200` and `{Math.round(progress)}% to goal`.

---

### Overall Satisfaction ring

Aggregates **all** responses across all food items and all categories.

```
totalVotes  = sum of every item's total
totalLikes  = sum of every item's likes
overallPct  = round( (totalLikes / totalVotes) × 100 )   if totalVotes > 0
overallPct  = 0                                            if totalVotes === 0
```

The ring is green and fills to `overallPct %`.

---

### By Category bars

For each category (`breakfast`, `lunch`, `snack`, `dinner`):

```
categoryLikes  = sum of likes  for all items in that category
categoryTotal  = sum of total  for all items in that category
categoryPct    = round( (categoryLikes / categoryTotal) × 100 )   if total > 0
categoryPct    = 0                                                   otherwise
```

Bar colour:
- ≥ 60 % → green (`#22c55e`)
- 40 – 59 % → primary orange
- < 40 % → red (`#ef4444`)

---

### Your Votes panel

Taken directly from the local Zustand store (the current user's own swipes — **not** from Supabase):

```
liked  = count of responses where liked === true
passed = count of responses where liked === false
total  = liked + passed
```

This panel only appears if the user has at least one response stored locally.

---

### Most Loved

```
candidate pool  = all items where total >= 1
Most Loved      = item with the highest likePercentage
```

Stat shown: `round(likePercentage) %`

Tie-breaking: the `reduce` comparison uses `>` so the **first** item encountered wins if percentages are equal.

---

### Most Disliked

```
candidate pool  = all items where total >= 1
Most Disliked   = item with the lowest likePercentage
```

Stat shown: `round(100 − likePercentage) %`  (i.e. the dislike percentage)

---

### Most Controversial

```
candidate pool    = all items where total >= 1
controversyScore  = |likePercentage − 50|
Most Controversial = item with the smallest controversyScore
                     (closest to a 50/50 split)
```

Stat shown: `round(likePercentage) / round(100 − likePercentage)`

---

### Top 5 Loved

```
1. Filter: items where total >= 1
2. Sort:   descending by likePercentage
3. Slice:  first 5
```

Progress bar width = `likePercentage %`, colour green.

---

### Top 5 Most Disliked

```
1. Filter: items where total >= 1
2. Sort:   ascending by likePercentage  (lowest like% = most disliked)
3. Slice:  first 5
```

Progress bar width = `(100 − likePercentage) %`, colour red.

---

### Category tab — all items

Shows every food item within the selected category, ordered by `order_index` (the order they appear in the database, which mirrors the swipe order).

The two-colour bar at the bottom of each card:
```
green segment width = max(likePercentage, 4) %   (min 4% so it's always visible)
red segment         = fills the remaining space (flex-1)
```

---

### Expanded item overlay

Shown when any item card or highlight card is tapped. Displays:
- The same `likePercentage` ring (green)
- Raw `likes` count and raw `dislikes` count
- A full-width split bar: `likePercentage %` green, remainder red

---

## Edge cases

| Situation | Behaviour |
|---|---|
| Item has never been rated (`total === 0`) | `likePercentage` defaults to `50`. Item is excluded from Highlights and Top 5 lists. |
| All responses are likes (`dislikes === 0`) | `likePercentage === 100`. Item is excluded from Most Disliked highlight. |
| Zero total students | `overallPct` and all category bars show `0 %`. |
| Multiple items tied on `likePercentage` | First item encountered in the array wins (stable `reduce`). |

---

## Where rounding happens

| Value | Where rounded |
|---|---|
| `overallPct` | Rounded with `Math.round()` before storing in state |
| `categoryPct` | Rounded with `Math.round()` before storing in state |
| All displayed percentages | Rounded with `Math.round()` at render time |
| Progress bar widths | **Not** rounded — floats are passed directly to CSS `width` for smooth animation |
