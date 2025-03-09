'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

interface BannerItem {
  image: string;
  alt: string;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}

const bannerItems: BannerItem[] = [
  {
    image: '/images/banner1.jpg',
    alt: 'Summer Collection',
    title: 'Summer Collection 2024',
    description: 'Discover our new summer styles and refresh your wardrobe',
    buttonText: 'Shop Collection',
    buttonLink: '/products?category=t-shirts',
  },
  {
    image: '/images/banner2.jpg',
    alt: 'New Arrivals',
    title: 'New Season Arrivals',
    description: 'Be the first to shop our latest exclusive designs',
    buttonText: 'Shop New In',
    buttonLink: '/products?sort=newest',
  },
  {
    image: '/images/banner3.jpg',
    alt: 'Limited Edition',
    title: 'Limited Edition Collection',
    description: 'Shop our limited edition pieces before they\'re gone',
    buttonText: 'Shop Limited Edition',
    buttonLink: '/products',
  },
];

export default function BannerCarousel() {
  // Create autoplay plugin with 5 second delay
  const autoplayOptions = {
    delay: 5000,
    rootNode: (emblaRoot: HTMLElement) => emblaRoot.parentElement,
  };
  
  const autoplayPlugin = Autoplay(autoplayOptions);
  
  return (
    <div className="relative">
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        plugins={[autoplayPlugin]}
        className="w-full"
      >
        <CarouselContent>
          {bannerItems.map((item, index) => (
            <CarouselItem key={index} className="relative">
              <div className="relative aspect-[16/7] overflow-hidden rounded-lg">
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-12 lg:p-16">
                  <h2 className="max-w-xs md:max-w-md text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
                    {item.title}
                  </h2>
                  <p className="max-w-md text-white text-sm md:text-base lg:text-lg mb-6">
                    {item.description}
                  </p>
                  <div>
                    <Link href={item.buttonLink}>
                      <Button size="lg" className="font-medium">
                        {item.buttonText}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Repositioned navigation buttons */}
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 border-2 shadow-md" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 border-2 shadow-md" />
      </Carousel>
    </div>
  );
} 