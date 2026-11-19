export type Role = 'ADMIN' | 'REVISOR' | 'DEPOSITANTE';
export type ItemStatus = 'BORRADOR' | 'EN_REVISION' | 'OBSERVADO' | 'PUBLICADO' | 'EMBARGADO';
export type ObservationType = 'OBSERVACION' | 'DEVOLUCION' | 'RECHAZO';
export type ObservationStatus = 'PENDIENTE' | 'RESUELTA';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

export interface MetadataValue {
  schema: string;
  element: string;
  qualifier?: string | null;
  value: string;
  lang?: string | null;
  place?: number;
}

export interface Bitstream {
  id: string;
  bundle: 'ORIGINAL' | 'THUMBNAIL' | 'LICENCIA';
  originalName: string;
  mimeType: string;
  sizeBytes: string | number;
  filePath?: string;
  isPrimary?: boolean;
  sha256Hash?: string;
  downloadCount?: number;
  description?: string | null;
  createdAt?: string;
}

export interface Community {
  id: string;
  name: string;
  slug?: string;
  shortDescription?: string | null;
  parentId?: string | null;
  isActive?: boolean;
  collections?: Collection[];
  _count?: { collections?: number; children?: number };
}

export interface Collection {
  id: string;
  name: string;
  slug?: string;
  shortDescription?: string | null;
  communityId?: string;
  community?: Community;
  licenseText?: string | null;
  workflowEnabled?: boolean;
  _count?: { items?: number };
}

export interface Item {
  id: string;
  status: ItemStatus;
  embargoDate?: string | null;
  viewCount: number;
  publishedAt?: string | null;
  submittedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  handleUri?: string | null;
  version?: number;
  title?: string;
  collection?: Collection;
  creator?: Pick<User, 'id' | 'fullName'> & Partial<Pick<User, 'email' | 'role'>>;
  assignedReviewer?: Pick<User, 'id' | 'fullName'> | null;
  metadata?: MetadataValue[];
  bitstreams?: Bitstream[];
  reviewChecks?: ReviewCheck[];
  observations?: Observation[];
  workflowLogs?: WorkflowLog[];
  _count?: { bitstreams?: number; observations?: number; reviewChecks?: number };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ReviewCheck {
  key: string;
  label: string;
  mandatory: boolean;
  passed: boolean;
  computed?: boolean;
  notes?: string | null;
  checkedAt?: string | null;
}

export interface Observation {
  id: string;
  itemId: string;
  type: ObservationType;
  description: string;
  status: ObservationStatus;
  response?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  author?: Pick<User, 'id' | 'fullName' | 'role'>;
  resolvedBy?: Pick<User, 'id' | 'fullName'> | null;
}

export interface WorkflowLog {
  id: string;
  action: string;
  fromStatus?: ItemStatus | null;
  toStatus?: ItemStatus | null;
  comment?: string | null;
  createdAt: string;
  actor?: Pick<User, 'id' | 'fullName' | 'role'>;
}

export interface HistoryEntry {
  kind: 'workflow' | 'observation';
  id: string;
  date: string;
  actor?: Pick<User, 'id' | 'fullName' | 'role'>;
  action: string;
  fromStatus?: ItemStatus | null;
  toStatus?: ItemStatus | null;
  comment?: string | null;
  description?: string;
  response?: string | null;
  status?: ObservationStatus;
}

export interface InboxResponse {
  items: Item[];
  pagination: Pagination;
  indicators: { byStatus: Partial<Record<ItemStatus, number>>; pendingObservations: number; approved: number; rejected: number };
}

export interface StatsOverview {
  byStatus: Partial<Record<ItemStatus, number>>;
  activeUsers: number;
  pendingObservations: number;
  totalDownloads: number;
}

export interface AdminStats extends StatsOverview {
  passedChecks: number;
  topViewed: Array<{ id: string; title: string; views: number }>;
  topDownloaded: Array<{ id: string; title: string; downloads: number }>;
}

export interface FacetYear {
  year: string;
  count: number;
}

export interface FacetsResponse {
  communities: Community[];
  collections: Collection[];
  years: FacetYear[];
}
