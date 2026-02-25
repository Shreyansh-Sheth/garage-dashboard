// ── Garage Admin API v1 response types ──

export interface HealthResponse {
  status: string;
  knownNodes: number;
  connectedNodes: number;
  storageNodes: number;
  storageNodesOk: number;
  partitions: number;
  partitionsQuorum: number;
  partitionsAllOk: number;
}

export interface NodeInfo {
  addr: string;
  isUp: boolean;
  lastSeenSecsAgo: number | null;
  hostname: string;
  zone?: string;
  capacity?: number;
  tags?: string[];
  dataPartition?: {
    available: number;
    total: number;
  };
}

export interface StatusResponse {
  node: string;
  garageVersion: string;
  garageFeatures: string[];
  rustVersion: string;
  dbEngine: string;
  layoutVersion: number;
  nodes: Record<string, NodeInfo>;
}

export interface BucketListItem {
  id: string;
  globalAliases: string[];
  localAliases: { accessKeyId: string; alias: string }[];
}

export interface BucketKey {
  accessKeyId: string;
  name: string;
  permissions: {
    read: boolean;
    write: boolean;
    owner: boolean;
  };
}

export interface BucketDetail {
  id: string;
  globalAliases: string[];
  localAliases: { accessKeyId: string; alias: string }[];
  websiteAccess: boolean;
  websiteConfig: unknown;
  keys: BucketKey[];
  objects: number;
  bytes: number;
  unfinishedUploads: number;
  unfinishedMultipartUploads: number;
  unfinishedMultipartUploadParts: number;
  unfinishedMultipartUploadBytes: number;
  quotas: {
    maxSize: number | null;
    maxObjects: number | null;
  };
}

export interface KeyListItem {
  id: string;
  name: string;
}

export interface KeyBucket {
  id: string;
  globalAliases: string[];
  localAliases: string[];
  permissions: {
    read: boolean;
    write: boolean;
    owner: boolean;
  };
}

export interface KeyDetail {
  name: string;
  accessKeyId: string;
  secretAccessKey?: string;
  permissions: {
    createBucket: boolean;
  };
  buckets: KeyBucket[];
}

// ── Cluster Layout ──

export interface NodeRole {
  zone: string;
  capacity: number;
  tags: string[];
}

export interface LayoutResponse {
  version: number;
  roles: Record<string, NodeRole>;
  stagedRoleChanges: Record<string, NodeRole | null>;
}

// ── S3 Object Browser ──

export interface S3Object {
  key: string;
  size: number;
  lastModified: string | null;
  etag: string | null;
  storageClass: string | null;
}

export interface S3ListResponse {
  objects: S3Object[];
  prefixes: string[];
  isTruncated: boolean;
  nextContinuationToken: string | null;
}

export interface PresignResponse {
  url: string;
  expiresIn: number;
}

// ── Aggregated dashboard data ──

export interface DashboardData {
  health: HealthResponse | null;
  status: StatusResponse | null;
  buckets: BucketDetail[];
  keys: KeyDetail[];
  error?: string;
}
