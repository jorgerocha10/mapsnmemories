"use client";

import { Button } from "@/components/ui/button";
import BannerCarousel from "@/components/home/BannerCarousel";

// Add explicit exports to help with route recognition
export const dynamic = 'force-static';

// Client components can't export revalidate
// export const revalidate = false;

// Ensure this is exported from the layout, not here
// export const metadata: Metadata = {
//   title: "Maps & Memories | Home",
//   description: "Shop for high-quality clothing and accessories",
// };

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Maps & Memories</h1>
        <p className="mt-6 text-lg text-muted-foreground">Your one-stop shop for high-quality clothing and accessories.</p>
        <div className="mt-10 flex items-center gap-x-6">
          <Button size="lg">Shop Now</Button>
          <Button variant="outline" size="lg">Learn More</Button>
        </div>
      </div>
      
      {/* Banner Carousel */}
      <section className="mb-16">
        <BannerCarousel />
      </section>
      
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold">Featured Products</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Featured products will go here */}
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="aspect-square w-full bg-muted" />
            <div className="mt-4">
              <h3 className="font-medium">Product Name</h3>
              <p className="text-sm text-muted-foreground">$99.99</p>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="aspect-square w-full bg-muted" />
            <div className="mt-4">
              <h3 className="font-medium">Product Name</h3>
              <p className="text-sm text-muted-foreground">$99.99</p>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="aspect-square w-full bg-muted" />
            <div className="mt-4">
              <h3 className="font-medium">Product Name</h3>
              <p className="text-sm text-muted-foreground">$99.99</p>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="aspect-square w-full bg-muted" />
            <div className="mt-4">
              <h3 className="font-medium">Product Name</h3>
              <p className="text-sm text-muted-foreground">$99.99</p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold">Categories</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {/* Categories will go here */}
          <div className="relative aspect-video overflow-hidden rounded-lg border">
            <div className="absolute inset-0 bg-muted" />
            <div className="absolute inset-0 flex items-center justify-center">
              <h3 className="text-xl font-bold text-white">T-shirts</h3>
            </div>
          </div>
          <div className="relative aspect-video overflow-hidden rounded-lg border">
            <div className="absolute inset-0 bg-muted" />
            <div className="absolute inset-0 flex items-center justify-center">
              <h3 className="text-xl font-bold text-white">Jeans</h3>
            </div>
          </div>
          <div className="relative aspect-video overflow-hidden rounded-lg border">
            <div className="absolute inset-0 bg-muted" />
            <div className="absolute inset-0 flex items-center justify-center">
              <h3 className="text-xl font-bold text-white">Shoes</h3>
            </div>
          </div>
        </div>
      </section>
      
      <section className="mb-10">
        <div className="rounded-lg border bg-card p-8 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold">Subscribe to our newsletter</h2>
          <p className="mb-6 text-muted-foreground">Get the latest updates and promotions delivered to your inbox.</p>
          <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button>Subscribe</Button>
          </div>
        </div>
      </section>
    </div>
  );
} 