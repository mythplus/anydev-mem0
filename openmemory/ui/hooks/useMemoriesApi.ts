import { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { Memory, Client, Category } from '@/components/types';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { setAccessLogs, setMemoriesSuccess, setSelectedMemory, setRelatedMemories, triggerRefresh } from '@/store/memoriesSlice';
import { setTotalMemories, setTotalApps, setApps } from '@/store/profileSlice';

// Define the new simplified memory type
export interface SimpleMemory {
  id: string;
  text: string;
  created_at: string;
  state: string;
  categories: string[];
  app_name: string;
}

// Define the shape of the API response item
interface ApiMemoryItem {
  id: string;
  content: string;
  created_at: string;
  state: string;
  app_id: string;
  categories: string[];
  metadata_?: Record<string, any>;
  app_name: string;
}

// Define the shape of the API response
interface ApiResponse {
  items: ApiMemoryItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

interface AccessLogEntry {
  id: string;
  app_name: string;
  accessed_at: string;
}

interface AccessLogResponse {
  total: number;
  page: number;
  page_size: number;
  logs: AccessLogEntry[];
}

interface RelatedMemoryItem {
  id: string;
  content: string;
  created_at: number;
  state: string;
  app_id: string;
  app_name: string;
  categories: string[];
  metadata_: Record<string, any>;
}

interface RelatedMemoriesResponse {
  items: RelatedMemoryItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

interface UseMemoriesApiReturn {
  fetchMemories: (
    query?: string,
    page?: number,
    size?: number,
    filters?: {
      apps?: string[];
      categories?: string[];
      sortColumn?: string;
      sortDirection?: 'asc' | 'desc';
      showArchived?: boolean;
      fromDate?: number | null;
      toDate?: number | null;
    }
  ) => Promise<{ memories: Memory[]; total: number; pages: number }>;
  fetchMemoryById: (memoryId: string) => Promise<void>;
  fetchAccessLogs: (memoryId: string, page?: number, pageSize?: number) => Promise<void>;
  fetchRelatedMemories: (memoryId: string) => Promise<void>;
  createMemory: (text: string) => Promise<void>;
  deleteMemories: (memoryIds: string[]) => Promise<void>;
  archiveMemories: (memoryIds: string[]) => Promise<void>;
  updateMemory: (memoryId: string, content: string) => Promise<void>;
  updateMemoryState: (memoryIds: string[], state: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  hasUpdates: number;
  memories: Memory[];
  selectedMemory: SimpleMemory | null;
}

export const useMemoriesApi = (): UseMemoriesApiReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUpdates, setHasUpdates] = useState<number>(0);
  const dispatch = useDispatch<AppDispatch>();
  const user_id = useSelector((state: RootState) => state.profile.userId);
  const memories = useSelector((state: RootState) => state.memories.memories);
  const selectedMemory = useSelector((state: RootState) => state.memories.selectedMemory);

  const URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8765";

  /**
   * 刷新全局统计数据（记忆总数、应用总数等），用于记忆增删改后同步更新仪表盘和应用页面的数据
   */
  const refreshStats = useCallback(async () => {
    try {
      const response = await axios.get(`${URL}/api/v1/stats?user_id=${user_id}`);
      dispatch(setTotalMemories(response.data.total_memories));
      dispatch(setTotalApps(response.data.total_apps));
      dispatch(setApps(response.data.apps));
    } catch (err) {
      // 统计刷新失败不应阻断主流程，静默忽略
      console.warn('Failed to refresh stats:', err);
    }
  }, [user_id, dispatch]);

  /**
   * 获取记忆列表（支持分页、搜索、过滤和排序）
   * POST /api/v1/memories/filter
   */
  const fetchMemories = useCallback(async (
    query?: string,
    page: number = 1,
    size: number = 10,
    filters?: {
      apps?: string[];
      categories?: string[];
      sortColumn?: string;
      sortDirection?: 'asc' | 'desc';
      showArchived?: boolean;
      fromDate?: number | null;
      toDate?: number | null;
    }
  ): Promise<{ memories: Memory[], total: number, pages: number }> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post<ApiResponse>(
        `${URL}/api/v1/memories/filter`,
        {
          user_id: user_id,
          page: page,
          size: size,
          search_query: query,
          app_ids: filters?.apps,
          category_ids: filters?.categories,
          sort_column: filters?.sortColumn?.toLowerCase(),
          sort_direction: filters?.sortDirection,
          show_archived: filters?.showArchived,
          from_date: filters?.fromDate || undefined,
          to_date: filters?.toDate || undefined
        }
      );

      const adaptedMemories: Memory[] = response.data.items.map((item: ApiMemoryItem) => ({
        id: item.id,
        memory: item.content,
        created_at: new Date(item.created_at).getTime(),
        state: item.state as "active" | "archived" | "deleted",
        metadata: item.metadata_,
        categories: item.categories as Category[],
        client: 'api',
        app_name: item.app_name
      }));
      setIsLoading(false);
      dispatch(setMemoriesSuccess(adaptedMemories));
      return {
        memories: adaptedMemories,
        total: response.data.total,
        pages: response.data.pages
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch memories';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  }, [user_id, dispatch]);

  /**
   * 创建新记忆
   * POST /api/v1/memories/
   */
  const createMemory = useCallback(async (text: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const memoryData = {
        user_id: user_id,
        text: text,
        infer: false,
        app: "openmemory",
      }
      await axios.post<ApiMemoryItem>(`${URL}/api/v1/memories/`, memoryData);
      setIsLoading(false);
      // 触发更新信号，通知其他组件刷新
      dispatch(triggerRefresh());
      // 同步更新全局统计数据
      refreshStats();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create memory';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  }, [user_id, dispatch, refreshStats]);

  // 用 ref 持有最新的 memories 引用，防止 useCallback 中的 stale closure
  const memoriesRef = useRef(memories);
  memoriesRef.current = memories;
  const selectedMemoryRef = useRef(selectedMemory);
  selectedMemoryRef.current = selectedMemory;

  /**
   * 批量删除记忆
   * DELETE /api/v1/memories/
   */
  const deleteMemories = useCallback(async (memory_ids: string[]) => {
    try {
      await axios.delete(`${URL}/api/v1/memories/`, {
        data: { memory_ids, user_id }
      });
      dispatch(setMemoriesSuccess(memoriesRef.current.filter((memory: Memory) => !memory_ids.includes(memory.id))));
      // 同步更新全局统计数据
      refreshStats();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete memories';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  }, [user_id, dispatch, refreshStats]);

  /**
   * 根据 ID 获取单条记忆详情
   * GET /api/v1/memories/:memoryId
   */
  const fetchMemoryById = useCallback(async (memoryId: string): Promise<void> => {
    if (memoryId === "") {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get<SimpleMemory>(
        `${URL}/api/v1/memories/${memoryId}?user_id=${user_id}`
      );
      setIsLoading(false);
      dispatch(setSelectedMemory(response.data));
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch memory';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  }, [user_id, dispatch]);

  /**
   * 获取记忆的访问日志
   * GET /api/v1/memories/:memoryId/access-log
   */
  const fetchAccessLogs = useCallback(async (memoryId: string, page: number = 1, pageSize: number = 10): Promise<void> => {
    if (memoryId === "") {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get<AccessLogResponse>(
        `${URL}/api/v1/memories/${memoryId}/access-log?page=${page}&page_size=${pageSize}`
      );
      setIsLoading(false);
      dispatch(setAccessLogs(response.data.logs));
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch access logs';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  }, [dispatch]);

  /**
   * 获取与指定记忆相关的记忆列表
   * GET /api/v1/memories/:memoryId/related
   */
  const fetchRelatedMemories = useCallback(async (memoryId: string): Promise<void> => {
    if (memoryId === "") {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get<RelatedMemoriesResponse>(
        `${URL}/api/v1/memories/${memoryId}/related?user_id=${user_id}`
      );

      const adaptedMemories: Memory[] = response.data.items.map((item: RelatedMemoryItem) => ({
        id: item.id,
        memory: item.content,
        created_at: item.created_at,
        state: item.state as "active" | "archived" | "deleted",
        metadata: item.metadata_,
        categories: item.categories as Category[],
        client: 'api',
        app_name: item.app_name
      }));

      setIsLoading(false);
      dispatch(setRelatedMemories(adaptedMemories));
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch related memories';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  }, [user_id, dispatch]);

  /**
   * 更新记忆内容
   * PUT /api/v1/memories/:memoryId
   */
  const updateMemory = useCallback(async (memoryId: string, content: string): Promise<void> => {
    if (memoryId === "") {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await axios.put(`${URL}/api/v1/memories/${memoryId}`, {
        memory_id: memoryId,
        memory_content: content,
        user_id: user_id
      });
      setIsLoading(false);
      setHasUpdates(prev => prev + 1);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update memory';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  }, [user_id]);

  /**
   * 批量归档记忆
   * POST /api/v1/memories/actions/archive
   */
  const archiveMemories = useCallback(async (memoryIds: string[]): Promise<void> => {
    if (memoryIds.length === 0) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await axios.post(`${URL}/api/v1/memories/actions/archive`, {
        memory_ids: memoryIds,
        user_id: user_id
      });
      // 从本地列表中移除归档的记忆
      dispatch(setMemoriesSuccess(memoriesRef.current.filter((memory: Memory) => !memoryIds.includes(memory.id))));
      setIsLoading(false);
      setHasUpdates(prev => prev + 1);
      // 同步更新全局统计数据
      refreshStats();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to archive memories';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  }, [user_id, dispatch, refreshStats]);

  /**
   * 批量更新记忆状态（激活/归档）
   * POST /api/v1/memories/actions/state
   */
  const updateMemoryState = useCallback(async (memoryIds: string[], state: string): Promise<void> => {
    if (memoryIds.length === 0) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await axios.post(`${URL}/api/v1/memories/actions/state`, {
        memory_ids: memoryIds,
        state: state,
        user_id: user_id
      });

      const currentMemories = memoriesRef.current;
      const currentSelected = selectedMemoryRef.current;

      // If archive or unarchive, remove from current list
      if (state === "archived" || state === "active") {
        dispatch(setMemoriesSuccess(currentMemories.filter((memory: Memory) => !memoryIds.includes(memory.id))));
      } else {
        dispatch(setMemoriesSuccess(currentMemories.map((memory: Memory) => {
          if (memoryIds.includes(memory.id)) {
            return { ...memory, state: state as "active" | "archived" | "deleted" };
          }
          return memory;
        })));
      }

      // if selected memory, update it
      if (currentSelected?.id && memoryIds.includes(currentSelected.id)) {
        dispatch(setSelectedMemory({ ...currentSelected, state: state as "active" | "archived" | "deleted" }));
      }

      setIsLoading(false);
      setHasUpdates(prev => prev + 1);
      // 同步更新全局统计数据
      refreshStats();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update memory state';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  }, [user_id, dispatch, refreshStats]);

  return {
    fetchMemories,
    fetchMemoryById,
    fetchAccessLogs,
    fetchRelatedMemories,
    createMemory,
    deleteMemories,
    archiveMemories,
    updateMemory,
    updateMemoryState,
    isLoading,
    error,
    hasUpdates,
    memories,
    selectedMemory
  };
};