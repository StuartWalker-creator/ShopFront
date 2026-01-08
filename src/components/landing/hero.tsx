import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export function HeroSection() {
  const heroImage = PlaceHolderImages.find((img) => img.id === "hero-image");

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 relative">
      <div className="absolute inset-0 z-[-1] opacity-20">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            data-ai-hint={heroImage.imageHint}
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
      </div>
      <div className="container px-4 md:px-6 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl font-headline">
            Your Business, Your Storefront
          </h1>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            ShopFront gives you the tools to build a beautiful, powerful online
            store. No coding required.
          </p>
          <div className="space-x-4">
            <Button size="lg" asChild>
              <Link href="/signup">Create Your Store</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
