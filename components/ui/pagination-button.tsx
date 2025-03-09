'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationButtonProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export function PaginationButton({
  currentPage,
  totalPages,
  baseUrl,
}: PaginationButtonProps) {
  // Calculate page numbers to display
  const generatePageRange = () => {
    // Always show first and last page
    const range = [1];
    
    // Always show 2 pages before and after current page
    const beforeCurrent = Math.max(2, currentPage - 1);
    const afterCurrent = Math.min(totalPages - 1, currentPage + 1);
    
    // Add ellipsis indicators
    if (beforeCurrent > 2) {
      range.push(-1); // Indicator for ellipsis
    }
    
    // Add pages around current
    for (let i = beforeCurrent; i <= afterCurrent; i++) {
      range.push(i);
    }
    
    // Add ellipsis and last page if needed
    if (afterCurrent < totalPages - 1) {
      range.push(-2); // Indicator for ellipsis
    }
    
    if (totalPages > 1) {
      range.push(totalPages);
    }
    
    return range;
  };
  
  const pageNumbers = generatePageRange();
  
  // Function to generate URL for specific page
  const getPageUrl = (page: number) => {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}page=${page}`;
  };
  
  // Don't render if only one page
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center space-x-2">
      {/* Previous button */}
      {currentPage > 1 ? (
        <Link href={getPageUrl(currentPage - 1)} passHref>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="icon" className="h-9 w-9" disabled>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </Button>
      )}
      
      {/* Page numbers */}
      {pageNumbers.map((pageNumber, i) => {
        // Render ellipsis
        if (pageNumber < 0) {
          return (
            <Button 
              key={`ellipsis-${i}`} 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9" 
              disabled
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More pages</span>
            </Button>
          );
        }
        
        // Render page number
        return (
          <Link 
            key={pageNumber} 
            href={getPageUrl(pageNumber)} 
            passHref
          >
            <Button
              variant={currentPage === pageNumber ? 'default' : 'outline'}
              size="icon"
              className="h-9 w-9"
            >
              {pageNumber}
              <span className="sr-only">Page {pageNumber}</span>
            </Button>
          </Link>
        );
      })}
      
      {/* Next button */}
      {currentPage < totalPages ? (
        <Link href={getPageUrl(currentPage + 1)} passHref>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </Link>
      ) : (
        <Button variant="outline" size="icon" className="h-9 w-9" disabled>
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </Button>
      )}
    </div>
  );
} 