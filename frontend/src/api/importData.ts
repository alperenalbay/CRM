import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from './client'

export interface ImportPreviewRow {
  row: number
  data: Record<string, string | null>
}

export interface ImportPreview {
  filename: string
  columns: string[]
  total_rows: number
  sample: ImportPreviewRow[]
  header_valid: boolean
  missing_required: string[]
}

export interface ImportBatch {
  id: number
  source: string
  filename: string
  status: string
  total_rows: number
  success_rows: number
  failed_rows: number
  error_report: string | null
  created_at: string
}

function formData(file: File): FormData {
  const data = new FormData()
  data.append('file', file)
  return data
}

export function useImportPreview() {
  return useMutation({
    mutationFn: async (file: File) => {
      const { data } = await apiClient.post<ImportPreview>('/imports/preview', formData(file))
      return data
    },
  })
}

export function useRunImport() {
  return useMutation({
    mutationFn: async (file: File) => {
      const { data } = await apiClient.post<ImportBatch>('/imports', formData(file))
      return data
    },
  })
}

export function useImportBatches() {
  return useQuery({
    queryKey: ['imports'],
    queryFn: async () => {
      const { data } = await apiClient.get<ImportBatch[]>('/imports')
      return data
    },
  })
}
