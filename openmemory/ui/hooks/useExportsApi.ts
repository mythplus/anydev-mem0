import { useState, useCallback } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

export interface ExportRecord {
  id: string;
  state: 'pending' | 'processing' | 'completed' | 'failed';
  entity_count: number;
  file_size: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  metadata_: Record<string, any>;
}

interface ExportListResponse {
  items: ExportRecord[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export const useExportsApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user_id = useSelector((state: RootState) => state.profile.userId);
  const URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8765";

  /**
   * 获取导出记录列表
   */
  const fetchExports = useCallback(async (
    search?: string,
    page: number = 1,
    size: number = 20
  ): Promise<ExportListResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = { user_id, page, size };
      if (search) params.search = search;

      const response = await axios.get<ExportListResponse>(
        `${URL}/api/v1/backup/exports`,
        { params }
      );
      setIsLoading(false);
      return response.data;
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err.message || 'Failed to fetch exports';
      setError(msg);
      setIsLoading(false);
      throw new Error(msg);
    }
  }, [user_id, URL]);

  /**
   * 创建导出任务
   */
  const createExport = useCallback(async (options?: {
    app_id?: string;
    from_date?: number;
    to_date?: number;
  }): Promise<ExportRecord> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post<ExportRecord>(
        `${URL}/api/v1/backup/exports`,
        {
          user_id,
          app_id: options?.app_id || undefined,
          from_date: options?.from_date || undefined,
          to_date: options?.to_date || undefined,
        }
      );
      setIsLoading(false);
      return response.data;
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err.message || 'Failed to create export';
      setError(msg);
      setIsLoading(false);
      throw new Error(msg);
    }
  }, [user_id, URL]);

  /**
   * 下载导出文件
   */
  const downloadExport = useCallback(async (exportId: string) => {
    try {
      const response = await axios.get(
        `${URL}/api/v1/backup/exports/${exportId}/download`,
        {
          params: { user_id },
          responseType: 'blob',
        }
      );

      // 从 Content-Disposition 头提取文件名
      const contentDisposition = response.headers['content-disposition'];
      let filename = `memories_export_${exportId.slice(0, 8)}.zip`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }

      // 触发浏览器下载
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err.message || 'Failed to download export';
      setError(msg);
      throw new Error(msg);
    }
  }, [user_id, URL]);

  /**
   * 删除导出记录
   */
  const deleteExport = useCallback(async (exportId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await axios.delete(`${URL}/api/v1/backup/exports/${exportId}`, {
        params: { user_id },
      });
      setIsLoading(false);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err.message || 'Failed to delete export';
      setError(msg);
      setIsLoading(false);
      throw new Error(msg);
    }
  }, [user_id, URL]);

  return {
    fetchExports,
    createExport,
    downloadExport,
    deleteExport,
    isLoading,
    error,
  };
};
