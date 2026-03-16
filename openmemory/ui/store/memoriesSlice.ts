import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Memory } from '@/components/types';
import { SimpleMemory } from '@/hooks/useMemoriesApi';

interface AccessLogEntry {
  id: string;
  app_name: string;
  accessed_at: string;
}

// Define the shape of the memories state
interface MemoriesState {
  memories: Memory[];
  selectedMemory: SimpleMemory | null;
  accessLogs: AccessLogEntry[];
  relatedMemories: Memory[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  selectedMemoryIds: string[];
  // 刷新触发器：每次创建/删除/更新记忆后递增，通知列表组件重新加载
  refreshTrigger: number;
}

const initialState: MemoriesState = {
  memories: [],
  selectedMemory: null,
  accessLogs: [],
  relatedMemories: [],
  status: 'idle',
  error: null,
  selectedMemoryIds: [],
  refreshTrigger: 0,
};

const memoriesSlice = createSlice({
  name: 'memories',
  initialState,
  reducers: {
    setSelectedMemory: (state, action: PayloadAction<SimpleMemory | null>) => {
      state.selectedMemory = action.payload;
    },
    setAccessLogs: (state, action: PayloadAction<AccessLogEntry[]>) => {
      state.accessLogs = action.payload;
    },
    setMemoriesLoading: (state) => {
      state.status = 'loading';
      state.error = null;
      state.memories = []; // Optionally clear old memories on new load
    },
    setMemoriesSuccess: (state, action: PayloadAction<Memory[]>) => {
      state.status = 'succeeded';
      state.memories = action.payload;
      state.error = null;
    },
    setMemoriesError: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    resetMemoriesState: (state) => {
      state.status = 'idle';
      state.error = null;
      state.memories = [];
      state.selectedMemoryIds = [];
      state.selectedMemory = null;
      state.accessLogs = [];
      state.relatedMemories = [];
    },
    selectMemory: (state, action: PayloadAction<string>) => {
      if (!state.selectedMemoryIds.includes(action.payload)) {
        state.selectedMemoryIds.push(action.payload);
      }
    },
    deselectMemory: (state, action: PayloadAction<string>) => {
      state.selectedMemoryIds = state.selectedMemoryIds.filter(id => id !== action.payload);
    },
    selectAllMemories: (state) => {
      state.selectedMemoryIds = state.memories.map(memory => memory.id);
    },
    clearSelection: (state) => {
      state.selectedMemoryIds = [];
    },
    setRelatedMemories: (state, action: PayloadAction<Memory[]>) => {
      state.relatedMemories = action.payload;
    },
    // 触发列表刷新（跨组件通信）
    triggerRefresh: (state) => {
      state.refreshTrigger += 1;
    },
  },
  // extraReducers section is removed as API calls are handled by the hook
});

export const { 
  setMemoriesLoading, 
  setMemoriesSuccess, 
  setMemoriesError,
  resetMemoriesState,
  selectMemory,
  deselectMemory,
  selectAllMemories,
  clearSelection,
  setSelectedMemory,
  setAccessLogs,
  setRelatedMemories,
  triggerRefresh
} = memoriesSlice.actions;

export default memoriesSlice.reducer; 