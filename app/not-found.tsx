import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Oops! The page you are looking for cannot be found.
      </p>
      <Button asChild>
        <Link href="/home">Return Home</Link>
      </Button>
    </div>
  );
} 