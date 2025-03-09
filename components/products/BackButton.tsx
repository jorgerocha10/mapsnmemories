'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function BackButton() {
  const router = useRouter();
  
  return (
    <div className="mb-6">
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center text-muted-foreground hover:text-foreground"
        onClick={() => router.back()}
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back
      </Button>
    </div>
  );
} 