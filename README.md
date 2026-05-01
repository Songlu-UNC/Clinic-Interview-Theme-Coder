# Clinical Interview Theme Coder

A lightweight qualitative coding tool for organizing clinical interview transcripts, tagging quotes by theme, visualizing theme frequency, and exporting coded excerpts for analysis.

## Project Purpose

This project supports clinical UX research and health informatics studies by helping researchers organize interview data from clinicians, patients, or healthcare staff.

## Features

- Paste or upload `.txt` interview transcripts
- Highlight and code selected quotes
- Use default themes related to EHR usability and clinical workflow
- Add custom themes
- Add analytic memos
- View theme frequency
- Search coded excerpts
- Export coded data as CSV

## Example Use Case

A researcher studying EHR usability can upload interview transcripts from physicians or nurses, tag quotes related to cognitive load, documentation burden, workflow interruption, and information fragmentation, then export the coded excerpts for further analysis.

## Tech Stack

- React
- Vite
- JavaScript
- Tailwind CSS
- Framer Motion

## Step 1: Create a React app
</> Bash
```
npm create vite@latest clinical-interview-theme-coder -- --template react
cd clinical-interview-theme-coder
npm install
```


## Step 2: install the needed packages 
</> Bash
```
npm install framer-motion
```

The current code also uses these imports:

```
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
```

Those are from shadcn/ui. The easiest fix is to install shadcn:
```
npx shadcn@latest init
npx shadcn@latest add button card
```
When prompted, choose the defaults.

## Step 3: Replace src/App.jsx
Open:
```
src/App.jsx
```
Delete everything inside it, then paste the app code from the canvas.

## Step 4: Make sure Tailwind works
If shadcn setup asks to configure Tailwind, let it do that. Then check that your src/index.css includes:

</> CSS
```
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Step 5: Run the APP
</> Bash
```
npm run dev
```

Then open the local URL Vite shows, usually: http://localhost:5173






