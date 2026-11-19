import api from './axios';
import type {
  Collection, Community, FacetsResponse, InboxResponse, Item, Observation, Pagination, ReviewCheck,
  StatsOverview, AdminStats, User, WorkflowLog, HistoryEntry,
} from '../types';

const unwrap = <T>(res: any): T => (res?.data?.data ?? res?.data ?? res) as T;

export interface ListParams extends Record<string, string | number | boolean | undefined> {}

export const reviewApi = {
  inbox: async (params: ListParams): Promise<InboxResponse> =>
    unwrap(await api.get('/review/inbox', { params })),
  detail: async (itemId: string): Promise<Item> => unwrap(await api.get(`/review/items/${itemId}`)),
  checks: async (itemId: string): Promise<ReviewCheck[]> => unwrap(await api.get(`/review/items/${itemId}/checks`)),
  saveChecks: async (itemId: string, checks: Array<{ key: string; passed: boolean; notes?: string }>): Promise<ReviewCheck[]> =>
    unwrap(await api.post(`/review/items/${itemId}/checks`, { checks })),
  observations: async (itemId: string): Promise<Observation[]> => unwrap(await api.get(`/review/items/${itemId}/observations`)),
  createObservation: async (itemId: string, data: { type: string; description: string }): Promise<Observation> =>
    unwrap(await api.post(`/review/items/${itemId}/observations`, data)),
  resolveObservation: async (id: string, response: string): Promise<Observation> =>
    unwrap(await api.patch(`/review/observations/${id}/resolve`, { response })),
  start: async (itemId: string): Promise<Item> => unwrap(await api.post(`/review/items/${itemId}/start`)),
  returnForCorrection: async (itemId: string, comment: string): Promise<any> =>
    unwrap(await api.post(`/review/items/${itemId}/return`, { comment })),
  reject: async (itemId: string, comment: string): Promise<any> =>
    unwrap(await api.post(`/review/items/${itemId}/reject`, { comment })),
  approve: async (itemId: string, data: { comment: string; embargoDate?: string }): Promise<any> =>
    unwrap(await api.post(`/review/items/${itemId}/approve`, data)),
  history: async (itemId: string): Promise<HistoryEntry[]> => unwrap(await api.get(`/review/items/${itemId}/history`)),
};

export const itemsApi = {
  list: async (params: ListParams): Promise<{ items: Item[]; pagination: Pagination }> =>
    unwrap(await api.get('/items', { params })),
  get: async (id: string): Promise<Item> => unwrap(await api.get(`/items/${id}`)),
  create: async (data: { collectionId: string; metadata: Array<{ schema?: string; element: string; qualifier?: string | null; value: string }> }): Promise<Item> =>
    unwrap(await api.post('/items', data)),
  updateMetadata: async (id: string, metadata: Array<{ schema?: string; element: string; qualifier?: string | null; value: string }>): Promise<Item> =>
    unwrap(await api.patch(`/items/${id}/metadata`, { metadata })),
};

export const catalogApi = {
  communities: async (): Promise<Community[]> => unwrap(await api.get('/communities')),
  collections: async (communityId?: string): Promise<Collection[]> =>
    unwrap(await api.get('/collections', { params: communityId ? { communityId } : undefined })),
  createCollection: async (data: { name: string; communityId: string }): Promise<Collection> =>
    unwrap(await api.post('/collections', data)),
  facets: async (): Promise<FacetsResponse> => unwrap(await api.get('/discovery/facets')),
  stats: async (): Promise<StatsOverview> => unwrap(await api.get('/stats/overview')),
};

export const usersApi = {
  create: async (data: { email: string; fullName: string; role: string; password: string }): Promise<User> =>
    unwrap(await api.post('/users', data)),
};

export const depositApi = {
  upload: async (itemId: string, file: File, bundle = 'ORIGINAL'): Promise<any> => {
    const form = new FormData();
    form.append('file', file);
    form.append('bundle', bundle);
    return unwrap(await api.post(`/files/items/${itemId}`, form, { headers: { 'Content-Type': 'multipart/form-data' } }));
  },
  submit: async (itemId: string): Promise<any> => unwrap(await api.post(`/workflow/items/${itemId}/submit`)),
};

export const adminApi = {
  stats: async (): Promise<AdminStats> => unwrap(await api.get('/stats/admin')),
  users: async (): Promise<{ users: User[]; pagination: Pagination }> => unwrap(await api.get('/users')),
  assignReviewer: async (itemId: string, reviewerId: string): Promise<any> =>
    unwrap(await api.patch(`/items/${itemId}/assign-reviewer`, { reviewerId })),
};

export async function fetchPdfBlob(bitstreamId: string): Promise<string> {
  const response = await api.get(`/files/${bitstreamId}/preview`, { responseType: 'blob' });
  return URL.createObjectURL(response.data as Blob);
}

export type { WorkflowLog };
