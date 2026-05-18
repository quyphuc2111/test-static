import { useQueryState, parseAsInteger, parseAsString } from "nuqs"

interface UsePaginationOptions {
  defaultPage?: number
  defaultPageSize?: number
  defaultSearch?: string
}

interface UsePaginationReturn {
  // State
  page: number
  pageSize: number
  searchTerm: string
  
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
}

/**
 * Custom hook for pagination and search state management using nuqs
 * Provides URL-synced state for page, pageSize, and searchTerm
 */
export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const {
    defaultPage = 1,
    defaultPageSize = 10,
    defaultSearch = ""
  } = options

  // URL state management with nuqs
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(defaultPage))
  const [pageSize, setPageSize] = useQueryState("pageSize", parseAsInteger.withDefault(defaultPageSize))
  const [searchTerm, setSearchTerm] = useQueryState("search", parseAsString.withDefault(defaultSearch))

  // Helper functions
  const resetPagination = () => {
    setPage(defaultPage)
  }

  const resetSearch = () => {
    setSearchTerm(defaultSearch)
  }

  const resetAll = () => {
    setPage(defaultPage)
    setPageSize(defaultPageSize)
    setSearchTerm(defaultSearch)
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setPage(defaultPage) // Reset to first page when searching
  }

  const handlePageSizeChange = (size: number) => {
    console.log('handlePageSizeChange called with:', size)
    console.log('Current pageSize before change:', pageSize)
    setPageSize(size)
    // Reset to first page when changing page size to avoid out of bounds
    setPage(defaultPage)
    console.log('pageSize after setPageSize:', size)
  }


  return {
    // State
    page,
    pageSize,
    searchTerm,
    
    // Setters
    setPage,
    setPageSize,
    setSearchTerm,
    
    // Helpers
    resetPagination,
    resetSearch,
    resetAll,
    handleSearchChange,
    handlePageSizeChange
  }
}
