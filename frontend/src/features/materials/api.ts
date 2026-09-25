import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { get, postForm, remove } from '@/services/apiClient'
import type { MaterialDetail, MaterialListItem, MaterialType, MaterialUpload } from '@/types/materials'

export interface MaterialListQuery {
  search?: string
  classId?: string
  subjectId?: string
  type?: MaterialType | ''
}

export const materialKeys = {
  all: ['materials'] as const,
  list: (query: MaterialListQuery) => [...materialKeys.all, 'list', query] as const,
  detail: (id: string) => [...materialKeys.all, 'detail', id] as const,
}

/**
 * `GET /materials` is scoped to the caller's role server-side: staff see the school, a student their
 * own class, a parent their children's. The library renders one list either way.
 */
export function useMaterials(query: MaterialListQuery = {}) {
  return useQuery({
    queryKey: materialKeys.list(query),
    queryFn: async (): Promise<MaterialListItem[]> =>
      (
        await get<MaterialListItem[]>('/materials', {
          search: query.search || undefined,
          classId: query.classId || undefined,
          subjectId: query.subjectId || undefined,
          type: query.type || undefined,
        })
      ).data,
    // Keeps the library on screen while a new search lands, instead of flashing a skeleton.
    placeholderData: keepPreviousData,
  })
}

/** Every write invalidates the library, so it reflects the change in one place. */
function useMaterialMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: materialKeys.all }),
  })
}

/** The upload is multipart — the metadata travels as form fields beside the file itself. */
export function useUploadMaterial() {
  return useMaterialMutation(async (upload: MaterialUpload) => {
    const form = new FormData()
    form.set('classId', upload.classId)
    form.set('subjectId', upload.subjectId)
    form.set('title', upload.title)
    form.set('description', upload.description ?? '')
    form.set('type', upload.type)
    form.set('file', upload.file)

    return (await postForm<MaterialListItem>('/materials', form)).data
  })
}

export function useDeleteMaterial() {
  return useMaterialMutation(async (id: string) => (await remove<{ deleted: boolean }>(`/materials/${id}`)).data)
}

/**
 * `GET /materials/:id` hands back the short-lived URL the file is fetched from — the same URL serves
 * the preview and the download, so the two actions share one read.
 */
export async function fetchMaterialDetail(id: string): Promise<MaterialDetail> {
  return (await get<MaterialDetail>(`/materials/${id}`)).data
}

/** The detail behind the preview modal, fetched only while it is open. */
export function useMaterialDetail(id: string | null) {
  return useQuery({
    queryKey: materialKeys.detail(id ?? ''),
    queryFn: async (): Promise<MaterialDetail> => fetchMaterialDetail(id as string),
    enabled: id !== null,
  })
}
