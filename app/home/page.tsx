"use client";

import { Button } from "@/components/ui/button";
import BannerCarousel from "@/components/home/BannerCarousel";
import { ClientFeaturedProducts } from "@/components/home/ClientFeaturedProducts";
import { MapPin, Award, Pencil, Gift, Quote } from "lucide-react";

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
      
      {/* Banner Carousel */}
      <section className="mb-16">
        <BannerCarousel />
      </section>

      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold">Why Choose Us</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Feature Cards */}
          <div className="flex flex-col items-center text-center rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-4 rounded-full bg-primary/10 p-3">
              <MapPin className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="mb-2 text-xl font-bold">Customizable Designs</h3>
            <p className="text-muted-foreground">
              Choose any location, size, and engraving details.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-4 rounded-full bg-primary/10 p-3">
              <Award className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="mb-2 text-xl font-bold">Premium Craftsmanship</h3>
            <p className="text-muted-foreground">
              Precision laser-cut and engraved on high-quality wood.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-4 rounded-full bg-primary/10 p-3">
              <Pencil className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="mb-2 text-xl font-bold">Personalized Touch</h3>
            <p className="text-muted-foreground">
              Add meaningful messages, names, or coordinates.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-4 rounded-full bg-primary/10 p-3">
              <Gift className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="mb-2 text-xl font-bold">Perfect Gift</h3>
            <p className="text-muted-foreground">
              Ideal for anniversaries, weddings, and milestone moments.
            </p>
          </div>
        </div>
      </section>
      
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold">Featured Products</h2>
        <ClientFeaturedProducts />
      </section>
      
      {/* Customer Testimonials */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-center">What Our Customers Say</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Testimonial 1 */}
          <div className="flex flex-col justify-between rounded-lg border bg-card p-6 shadow-sm">
            <p className="mb-4 italic text-muted-foreground">
              "Absolutely stunning! The perfect anniversary gift."
            </p>
            <p className="font-medium">Sarah T.</p>
          </div>
          
          {/* Testimonial 2 */}
          <div className="flex flex-col justify-between rounded-lg border bg-card p-6 shadow-sm">
            <p className="mb-4 italic text-muted-foreground">
              "The craftsmanship is incredible. It's a keepsake we'll cherish forever."
            </p>
            <p className="font-medium">James W.</p>
          </div>
          
          {/* Testimonial 3 */}
          <div className="flex flex-col justify-between rounded-lg border bg-card p-6 shadow-sm">
            <p className="mb-4 italic text-muted-foreground">
              "I gifted one to my parents, and they were blown away!"
            </p>
            <p className="font-medium">Emily L.</p>
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