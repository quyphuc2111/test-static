/**
 * Common interfaces and types for reuse across the application
 */

// Base entity with common fields
export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

// Soft deletable entity
export interface SoftDeletableEntity extends BaseEntity {
  isDeleted: boolean
  deletedAt?: string | null
}

// Entity with status
export interface StatusEntity extends BaseEntity {
  status: string
}

// Entity with name and description
export interface NamedEntity extends BaseEntity {
  name: string
  description?: string
}

// Full entity with all common fields
export interface FullEntity extends SoftDeletableEntity, StatusEntity, NamedEntity {}

// Common response wrapper
export interface ApiResponse<T = any> {
  message: string
  data?: T
  success?: boolean
  error?: string
}

// Pagination parameters
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

// Pagination response
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Common action responses
export interface ActionResponse {
  message: string
  data?: any
}

// ID parameter for API routes
export interface IdParam {
  id: string
}

// Common filter options
export interface FilterOptions {
  includeDeleted?: boolean
  onlyDeleted?: boolean
  search?: string
  status?: string
}

// Owner information
export interface OwnerInfo {
  id: string
  name?: string | null
  email: string
}

// Entity with owner
export interface OwnedEntity extends BaseEntity {
  ownerId?: string
  owner?: OwnerInfo | null
}
