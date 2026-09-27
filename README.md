# AQA GCSE Science Course

A unified GCSE Science learning app based on the layout and study flow of the `alevel-course` project.

## Coverage

- AQA GCSE Biology (8461): B1–B7
- AQA GCSE Chemistry (8462): C1–C10
- AQA GCSE Physics (8463): P1–P8
- AQA GCSE Combined Science: Trilogy (8464)
- Combined / Separate Science filtering so subject-only material is clearly distinguished
- Paper 1 / Paper 2 mapping and topic search

## Learning features

Each topic includes:

- structured lesson sequence with completion tracking
- expandable taught lessons with objectives, explanation, vocabulary, worked examples and checks
- textbook-style topic sections and visual models
- required practical guidance
- application and revision activities
- topic-specific interactive simulations / calculators
- equation and maths bank where relevant
- original GCSE-style exam practice with practice auto-marking
- retrieval questions
- science notebook
- topic and whole-course progress tracking
- Progress Coach using saved lesson completion and exam-practice attempts to suggest what to revisit

Automatic exam marking is a simplified keyword/concept feedback tool and is not presented as an official AQA examiner mark.

## Files

- `course-data.js` — AQA topic, lesson, practical and retrieval structure
- `rich-content.js` — textbook content, terms, worked examples, activities, simulations and exam practice
- `app.js` — core navigation and learning interface
- `course-enhancements.js` — lesson-depth prompts, equation bank and Progress Coach
- `styles.css`, `rich-learning.css`, `course-enhancements.css` — responsive presentation

## Validation

Run:

```bash
node --check course-data.js
node --check rich-content.js
node --check app.js
node --check course-enhancements.js
node tests/integrity.mjs
```

The GitHub Actions workflow `.github/workflows/course-integrity.yml` runs the same checks on pushes and pull requests to `main`.

## Run

This is a static web app. Open `index.html` locally or deploy the repository to Vercel, Netlify or GitHub Pages.
