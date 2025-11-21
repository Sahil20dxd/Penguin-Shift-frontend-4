// src/components/explore/Pagination.tsx

import React from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type PaginationProps = {
  currentPage: number
  totalPages: number
  totalResults: number
  pageSize: number // important constant: items per page
  onPageChange: (page: number) => void
}

/**
 * Pagination:
 * - Shows result range and numbered pages.
 * - Uses pageSize from parent for accurate ranges.
 */
export default function Pagination({
  currentPage,
  totalPages,
  totalResults,
  pageSize,
  onPageChange
}: PaginationProps) {
  const hasResults = totalResults > 0
  const startResult = hasResults ? (currentPage - 1) * pageSize + 1 : 0
  const endResult = hasResults
    ? Math.min(currentPage * pageSize, totalResults)
    : 0

  // Build visible page numbers window
  const pages: number[] = []
  const maxVisible = 5 // important constant: max page buttons visible
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
  let endPage = Math.min(totalPages, startPage + maxVisible - 1)

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return
    onPageChange(page)
  }

  return (
    <div className='flex flex-col sm:flex-row items-center justify-between gap-4 mt-8'>
      <div className='text-sm text-gray-600'>
        {hasResults ? (
          <>
            Showing <strong>{startResult}</strong> to <strong>{endResult}</strong> of{' '}
            <strong>{totalResults}</strong> results
          </>
        ) : (
          'No results'
        )}
      </div>

      <div className='flex items-center gap-2'>
        <Button
          variant='outline'
          size='icon'
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1 || totalPages === 0}
          aria-label='Previous page'
        >
          <ChevronLeft className='w-4 h-4' />
        </Button>

        {startPage > 1 && (
          <>
            <Button
              variant='outline'
              size='sm'
              onClick={() => goToPage(1)}
              className='hidden sm:inline-flex'
            >
              1
            </Button>
            {startPage > 2 && <span className='text-gray-400'>…</span>}
          </>
        )}

        {pages.map(page => (
          <Button
            key={page}
            variant={page === currentPage ? 'default' : 'outline'}
            size='sm'
            onClick={() => goToPage(page)}
            className={
              page === currentPage
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : ''
            }
            aria-label={'Page ' + String(page)}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </Button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className='text-gray-400'>…</span>
            )}
            <Button
              variant='outline'
              size='sm'
              onClick={() => goToPage(totalPages)}
              className='hidden sm:inline-flex'
            >
              {totalPages}
            </Button>
          </>
        )}

        <Button
          variant='outline'
          size='icon'
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          aria-label='Next page'
        >
          <ChevronRight className='w-4 h-4' />
        </Button>
      </div>
    </div>
  )
}