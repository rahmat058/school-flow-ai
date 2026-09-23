import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { get } from '@/services/apiClient'
import type { Paginated } from '@/types/api'
import type { FeeCollectionSummary, FeeInvoiceListItem, InvoiceStatus } from '@/types/fees'

export interface InvoiceListQuery {
  page: number
  limit: number
  search?: string
  status?: InvoiceStatus | ''
}

export const feeKeys = {
  all: ['fees'] as const,
  invoices: (query: InvoiceListQuery) => [...feeKeys.all, 'invoices', query] as const,
  pending: (query: InvoiceListQuery) => [...feeKeys.all, 'pending', query] as const,
  summary: () => [...feeKeys.all, 'summary'] as const,
}

export function useInvoices(query: InvoiceListQuery) {
  return useQuery({
    queryKey: feeKeys.invoices(query),
    queryFn: async (): Promise<Paginated<FeeInvoiceListItem>> => {
      const { data, meta } = await get<FeeInvoiceListItem[]>('/fees/invoices', {
        page: query.page,
        limit: query.limit,
        search: query.search,
        status: query.status || undefined,
      })

      return { items: data, meta: meta ?? { page: query.page, limit: query.limit, total: data.length } }
    },
    placeholderData: keepPreviousData,
  })
}

export function useFeeSummary() {
  return useQuery({
    queryKey: feeKeys.summary(),
    queryFn: async () => (await get<FeeCollectionSummary>('/fees/summary')).data,
  })
}
