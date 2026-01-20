# Kriya IDE - Enterprise Cloud Development Environment

A modern, feature-rich IDE built with Next.js, React, and TypeScript.

## Features

- 🎨 **Modern UI**: Dark theme with glass morphism design
- ⌨️ **Command Palette**: Quick access to all features (⌘K)
- 🤖 **AI Assistant**: Integrated AI for code assistance (⌘I)
- 📁 **File Explorer**: Full file tree navigation
- 📝 **Monaco Editor**: VS Code-like editing experience
- 🔥 **Hot Reload**: Instant feedback during development
- ⚡ **Performance**: Optimized with React 18 and Next.js 14

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Editor**: Monaco Editor
- **Animations**: Framer Motion
- **Icons**: Phosphor React
- **Hotkeys**: React Hotkeys Hook

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Keyboard Shortcuts

- `⌘K` - Open Command Palette
- `⌘I` - Open AI Assistant
- `⌘B` - Toggle Sidebar
- `⌘S` - Save File
- `⌘N` - New File
- `⌘O` - Open File
- `⌘,` - Settings
- `Escape` - Close Modals

## Project Structure

```
kriya/
├── app/                 # Next.js app directory
├── components/          # React components
├── stores/             # Zustand stores
├── lib/                # Utility functions
├── hooks/              # Custom React hooks
└── public/             # Static assets
```

## Development

- **Build**: `npm run build`
- **Start**: `npm start`
- **Lint**: `npm run lint`

## License

MIT License