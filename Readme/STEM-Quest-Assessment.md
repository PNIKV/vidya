# STEM Quest Gamified Assessment System

This document explains the architecture of the new gamified assessment system (STEM Quest) and how you can add new levels (Intermediate, Advanced, etc.).

## 📁 File Structure

The new gamified assessment is fully contained within the `assessment/` directory.

- **`beginner-demo.html`**: The main page layout containing the Start screen, Question screen, Results screen, and Teacher Dashboard. Also contains the `<audio>` elements for background music and sound effects (loaded from Pixabay).
- **`beginner-styles.css`**: The CSS for the gamified UI, including animated sprites (robot, drone, rocket), custom fonts, and custom question-type layouts.
- **`beginner-game.js`**: The main game engine. It handles:
  - Shuffling questions.
  - Rendering 8 different types of interactive questions.
  - Playing sound effects (when the music button is toggled or when an answer is selected).
  - XP tracking and Scoring.
  - Saving results to `localStorage`.
  - Generating and downloading the CSV report (no backend required).
- **`beginner-questions.js`**: Contains the `BEGINNER_QUESTIONS` array. All questions, options, and logic for checking correct answers are defined here.

## 🎵 Audio Cues and Sound Effects

The audio files (background music, success sound, failure sound, and click sound) are not stored locally to save space. They are loaded dynamically using `<audio>` tags inside `beginner-demo.html`.

```html
<audio id="bgm" loop>
  <source src="https://cdn.pixabay.com/..." type="audio/mpeg">
</audio>
<audio id="sfx-ok" src="https://cdn.pixabay.com/..."></audio>
<audio id="sfx-bad" src="https://cdn.pixabay.com/..."></audio>
<audio id="sfx-click" src="https://cdn.pixabay.com/..."></audio>
```

When a user interacts with the game or toggles the 🎵 button in the top right, `beginner-game.js` plays the corresponding audio element. 

## 🚀 How to Add New Levels (e.g. Intermediate, Advanced)

Currently, the landing page shows "Beginner" as unlocked and the others as locked. Here's how you can expand the system for a new level:

1. **Duplicate the files**
   - Copy `beginner-demo.html` to `intermediate.html`.
   - Copy `beginner-questions.js` to `intermediate-questions.js`.
   - Copy `beginner-game.js` to `intermediate-game.js`.
   - (You can reuse `beginner-styles.css` by renaming it to something like `stem-quest-styles.css` and linking it in all HTML files).

2. **Update the Questions (`intermediate-questions.js`)**
   - Replace the `BEGINNER_QUESTIONS` array with `INTERMEDIATE_QUESTIONS`.
   - Add new questions. You can use the existing 8 question types (mcq, true_false, match, fill_bank, calc, picto, arduino_ide, ai_question) or invent new ones.

3. **Link it up in HTML (`intermediate.html`)**
   - Make sure to source your new JS files at the bottom:
     ```html
     <script src="intermediate-questions.js"></script>
     <script src="intermediate-game.js"></script>
     ```
   - On the landing screen (`<section id="view-landing">`), unlock the Intermediate badge by removing the `.locked` class and adding `.active-level`.

4. **Update the Main App Index**
   - You can create a master "Level Select" screen instead of jumping straight into `beginner-demo.html` if you want users to pick their level from the navbar.

## 👩‍🏫 Teacher Dashboard & CSV Download

The app saves all completed assessments into the browser's `localStorage` (key: `stemquest_v2`).
- A student can click **Download My Report** at the end of the quiz to get a CSV of just their answers.
- A teacher can click **Teacher View** on the start screen (Login: ID = `teacher`, Password = `stemteacher`) to view all past results stored on that device and export a master CSV.
