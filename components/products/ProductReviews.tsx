'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { StarIcon } from 'lucide-react';
import { Review, User } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ReviewWithUser extends Review {
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface ProductReviewsProps {
  reviews: ReviewWithUser[];
  productId: string;
}

export default function ProductReviews({ reviews, productId }: ProductReviewsProps) {
  const averageRating = reviews.length 
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
    : 0;
  
  const ratingCounts = Array.from({ length: 5 }, (_, i) => {
    const count = reviews.filter(r => r.rating === i + 1).length;
    const percentage = reviews.length ? (count / reviews.length) * 100 : 0;
    return { rating: i + 1, count, percentage };
  }).reverse();
  
  return (
    <section className="mt-16">
      <Tabs defaultValue="reviews">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Customer Reviews</h2>
          <TabsList>
            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            <TabsTrigger value="write">Write a Review</TabsTrigger>
          </TabsList>
        </div>
        
        <Separator className="my-6" />
        
        <TabsContent value="reviews" className="space-y-8">
          <div className="grid gap-8 md:grid-cols-12">
            {/* Review summary */}
            <div className="space-y-6 md:col-span-4">
              <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border p-6 text-center">
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon
                      key={i}
                      className={cn(
                        "h-6 w-6",
                        i < Math.round(averageRating)
                          ? "fill-primary text-primary"
                          : "fill-muted stroke-muted-foreground"
                      )}
                    />
                  ))}
                </div>
                <div className="text-2xl font-bold">
                  {averageRating.toFixed(1)} out of 5
                </div>
                <p className="text-sm text-muted-foreground">
                  Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="space-y-2">
                {ratingCounts.map(({ rating, count, percentage }) => (
                  <div key={rating} className="flex items-center space-x-2">
                    <div className="flex w-12 justify-end text-sm">
                      {rating} {rating === 1 ? 'star' : 'stars'}
                    </div>
                    <div className="flex-1">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-9 text-sm text-muted-foreground">{count}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Reviews list */}
            <div className="md:col-span-8">
              {reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center space-y-3 rounded-lg border border-dashed py-12 text-center">
                  <h3 className="text-lg font-medium">No reviews yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Be the first to review this product
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const writeTabButton = document.querySelector('button[value="write"]');
                      if (writeTabButton instanceof HTMLButtonElement) {
                        writeTabButton.click();
                      }
                    }}
                  >
                    Write a Review
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="write">
          <WriteReview productId={productId} />
        </TabsContent>
      </Tabs>
    </section>
  );
}

// Review card component
function ReviewCard({ review }: { review: ReviewWithUser }) {
  const date = new Date(review.createdAt);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between space-y-0">
          <div className="flex items-center space-x-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full">
              {review.user.image ? (
                <Image
                  src={review.user.image}
                  alt={review.user.name || 'User avatar'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  {review.user.name?.[0] || 'U'}
                </div>
              )}
            </div>
            <div>
              <CardTitle className="text-base">{review.user.name || 'Anonymous'}</CardTitle>
              <div className="flex items-center space-x-1 pt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < review.rating
                        ? "fill-primary text-primary"
                        : "fill-muted stroke-muted-foreground"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {date.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {review.title && <h4 className="mb-2 font-medium">{review.title}</h4>}
        <p className="text-sm text-muted-foreground">{review.content}</p>
      </CardContent>
    </Card>
  );
}

// Write review component
function WriteReview({ productId }: { productId: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmitReview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!session) {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent(window.location.href));
      return;
    }
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          rating,
          title,
          content,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit review');
      }
      
      // Refresh the page to show the new review
      router.refresh();
      
      // Reset the form
      setRating(0);
      setTitle('');
      setContent('');
      
      // Switch back to reviews tab
      const reviewsTabButton = document.querySelector('button[value="reviews"]');
      if (reviewsTabButton instanceof HTMLButtonElement) {
        reviewsTabButton.click();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (status === 'loading') {
    return <div className="text-center py-12">Loading...</div>;
  }
  
  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
        <h3 className="text-lg font-medium">Please sign in to write a review</h3>
        <Button onClick={() => router.push('/auth/signin?callbackUrl=' + encodeURIComponent(window.location.href))}>
          Sign In
        </Button>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmitReview} className="space-y-6 max-w-2xl mx-auto py-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Your Rating</label>
        <div className="flex items-center space-x-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              type="button"
              className="focus:outline-none"
              onClick={() => setRating(i + 1)}
              onMouseEnter={() => setHoveredRating(i + 1)}
              onMouseLeave={() => setHoveredRating(0)}
            >
              <StarIcon
                className={cn(
                  "h-8 w-8 transition-all",
                  (hoveredRating ? i < hoveredRating : i < rating)
                    ? "fill-primary text-primary"
                    : "fill-muted stroke-muted-foreground hover:fill-primary/20"
                )}
              />
            </button>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="review-title" className="text-sm font-medium">Review Title</label>
        <input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Summarize your review"
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="review-content" className="text-sm font-medium">Review Content</label>
        <Textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your review here..."
          className="min-h-[150px]"
        />
      </div>
      
      {error && (
        <div className="text-destructive text-sm">{error}</div>
      )}
      
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  );
} 