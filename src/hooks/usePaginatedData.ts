import { useMemo } from "react"
import { useTablePagination } from "./useTablePagination"

interface UsePaginatedDataOptions<T> {
  data?: T[]
  totalItems?: number
  isLoading?: boolean
  defaultPage?: number
  defaultPageSize?: number
  defaultSearch?: string
  searchFunction?: (data: T[], searchTerm: string) => T[]
}

interface UsePaginatedDataReturn<T> {
  // Pagination state
  page: number
  pageSize: number
  searchTerm: string
  
  // Data
  data: T[]
  filteredData: T[]
  paginatedData: T[]
  
  // Pagination info
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  startIndex: number
  endIndex: number
  
  // Loading state
  isLoading: boolean
  
  // Setters
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setSearchTerm: (search: string) => void
  
  // Helpers
  resetPagination: () => void
  resetSearch: () => void
  resetAll: () => void
  handleSearchChange: (value: string) => void
  handlePageSizeChange: (size: number) => void
  
  // Navigation
  goToNextPage: () => void
  goToPrevPage: () => void
  goToFirstPage: () => void
  goToLastPage: () => void
  
  // Table props
  tableProps: {
    page: number
    pageSize: number
    searchTerm: string
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
    onSearchChange: (value: string) => void
  }
}

/**
 * Hook for managing paginated data with search functionality
 * Combines useTablePagination with data processing
 */
export function usePaginatedData<T>(options: UsePaginatedDataOptions<T> = {}): UsePaginatedDataReturn<T> {
  const {
    data = [],
    totalItems: externalTotalItems,
    isLoading = false,
    defaultPage = 1,
    defaultPageSize = 10,
    defaultSearch = "",
    searchFunction
  } = options

  const {
    page,
    pageSize,
    searchTerm,
    setPage,
    setPageSize,
    setSearchTerm,
    resetPagination,
    resetSearch,
    resetAll,
    handleSearchChange,
    handlePageSizeChange,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
    tableProps: baseTableProps
  } = useTablePagination({
    defaultPage,
    defaultPageSize,
    defaultSearch,
    totalItems: externalTotalItems || data.length
  })

  // Process data
  const filteredData = useMemo(() => {
    if (!searchTerm || !searchFunction) {
      return data
    }
    return searchFunction(data, searchTerm)
  }, [data, searchTerm, searchFunction])

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredData.slice(startIndex, endIndex)
  }, [filteredData, page, pageSize])

  // Use external total if provided, otherwise use filtered data length
  const totalItems = externalTotalItems ?? filteredData.length

  // Update table props with correct total
  const tableProps = useMemo(() => ({
    ...baseTableProps,
    total: totalItems
  }), [baseTableProps, totalItems])

  return {
    // Pagination state
    page,
    pageSize,
    searchTerm,
    
    // Data
    data,
    filteredData,
    paginatedData,
    
    // Pagination info
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    hasNextPage: page < Math.ceil(totalItems / pageSize),
    hasPrevPage: page > 1,
    startIndex: (page - 1) * pageSize + 1,
    endIndex: Math.min(page * pageSize, totalItems),
    
    // Loading state
    isLoading,
    
    // Setters
    setPage,
    setPageSize,
    setSearchTerm,
    
    // Helpers
    resetPagination,
    resetSearch,
    resetAll,
    handleSearchChange,
    handlePageSizeChange,
    
    // Navigation
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
    
    // Table props
    tableProps
  }
}
