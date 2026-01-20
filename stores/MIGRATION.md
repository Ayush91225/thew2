# Store Migration Guide

## Problem
The old `ide-store.ts` was 2147 lines with everything in one file - unmaintainable and slow.

## Solution
Modular slice-based architecture:

```
stores/
├── store.ts              # Main store (combines slices)
├── slices/
│   ├── editor-slice.ts   # Editor state (tabs, files)
│   ├── ui-slice.ts       # UI state (modals, panels)
│   ├── terminal-slice.ts # Terminal state
│   ├── git-slice.ts      # Git state
│   └── settings-slice.ts # Settings state
```

## Usage

### Old way:
```tsx
import { useIDEStore } from '@/stores/ide-store'

const tabs = useIDEStore(state => state.tabs)
const addTab = useIDEStore(state => state.addTab)
```

### New way:
```tsx
import { useStore } from '@/stores/store'

const tabs = useStore(state => state.tabs)
const addTab = useStore(state => state.addTab)
```

## Benefits
- ✅ Each slice is < 100 lines
- ✅ Easy to test individual slices
- ✅ Better performance (selective re-renders)
- ✅ Type-safe
- ✅ Easy to add new features

## Next Steps
1. Create remaining slices as needed
2. Update components to use new store
3. Delete old ide-store.ts
