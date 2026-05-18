import { useMemo } from "react"
import { usePagination } from "./usePagination"

interface UseTablePaginationOptions {
  defaultPage?: number
  defaultPageSize?: number
  defaultSearch?: string
  totalItems?: number
}

interface UseTablePaginationReturn {
  // Pagination state
  page: number
  pageSize: number
  searchTerm: string
  
  // Pagination info
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  startIndex: number
  endIndex: number
  
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
 * Enhanced hook for table pagination with additional calculations and helpers
 * Extends usePagination with table-specific functionality
 */
export function useTablePagination(options: UseTablePaginationOptions = {}): UseTablePaginationReturn {
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
    handlePageSizeChange
  } = usePagination(options)

  // Calculated values - these will be updated by the component using this hook
  const totalPages = 1 // Will be overridden by component
  const hasNextPage = false // Will be overridden by component
  const hasPrevPage = false // Will be overridden by component
  const startIndex = (page - 1) * pageSize + 1
  const endIndex = page * pageSize

  // Navigation functions
  const goToNextPage = () => {
    if (hasNextPage) {
      setPage(page + 1)
    }
  }

  const goToPrevPage = () => {
    if (hasPrevPage) {
      setPage(page - 1)
    }
  }

  const goToFirstPage = () => {
    setPage(1)
  }

  const goToLastPage = () => {
    setPage(totalPages)
  }

  // Table props for easy passing to table components
  const tableProps = useMemo(() => ({
    page,
    pageSize,
    searchTerm,
    total: 0, // Will be overridden by component
    onPageChange: setPage,
    onPageSizeChange: handlePageSizeChange,
    onSearchChange: handleSearchChange
  }), [page, pageSize, searchTerm, setPage, handlePageSizeChange, handleSearchChange])

  return {
    // Pagination state
    page,
    pageSize,
    searchTerm,
    
    // Pagination info
    totalPages,
    hasNextPage,
    hasPrevPage,
    startIndex,
    endIndex,
    
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
