# KidsBuddy Frontend

KidsBuddy is a high-fidelity, interactive, and child-safe chatbot interface designed for children aged 5 to 12. Built with **React**, **TypeScript**, **Vite**, and **Lucide React**.

## Key Features

1. **Child-Friendly Design & Multiple Themes**:
   - Bright, responsive design using rounded buttons, friendly typography (Google Font *Outfit*), and smooth micro-animations.
   - 3 themes available in the top bar: **Dino Green** 🦖 (Default), **Space Blue** 🌌, and **Unicorn Pink** 🦄.
2. **Animated Virtual Mascot**:
   - An SVG dinosaur mascot named **Buddy** that updates expressions depending on the chat state:
     - `Hello!` (Idle/Smiling)
     - `I'm listening! 👂` (When microphone voice recognition is active)
     - `Thinking... 💡` (When calculating replies)
     - `Talking! 💬` (Animate mouth moves when reading text aloud)
     - `Yay! Happy! 🎉` (When child is rewarded)
3. **Voice Capabilities**:
   - **Speech-to-Text (Voice Typing)**: Tap the red microphone button next to the input bar to speak and have your words transcribed instantly.
   - **Text-to-Speech (Voice Synthesis)**: Bot answers can be spoken aloud. Tap the speaker icon next to any message, or toggle **Auto Read** on in the Parent Gate to read all incoming messages.
4. **Gamification (Star Meter)**:
   - Earn stars! For every 3 messages the child sends, they earn a gold star, accompanied by a floating star animation celebration.
5. **Preset Suggestion Cards**:
   - Touch cards below the chat screen to quickly trigger stories, facts, jokes, or interactive games like *Rock-Paper-Scissors*, *Animal Guessing Game*, or *Trivia*.
6. **Passcode-Protected Parent Gate**:
   - An access gate containing random math puzzles. When solved, parents can access controls to change speech pitch/speed, clear history, or manage safety blocklists.
7. **Input Safety Filter**:
   - Gently handles mean/negative words, guiding the child back to positive and learning-focused interactions.

---

## Setup & Running Guide

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed (version 18+ recommended).

### 1. Install Dependencies

In this directory, run:
```bash
npm install
```

### 2. Start the Development Server

Launch the local server:
```bash
npm run dev
```

This runs Vite on port `3007` (or similar specified in `vite.config.ts`).
- Open your browser to the URL output in the terminal (usually `http://localhost:3007`).

### 3. Build for Production

Compile typescript and create the build bundle:
```bash
npm run build
```
The optimized bundle files will be generated in the `dist` folder.
