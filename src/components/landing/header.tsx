import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { ThemeToggle } from "../theme-toggle";

export function LandingHeader() {
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-sm sticky top-0 z-50 border-b">
      <div className="container mx-auto flex items-center w-full">
        <Link href="/" className="flex items-center justify-center gap-2">
          <Icons.logo className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">ShopFront</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4 sm:gap-6">
          <Link
            href="/login"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Login
          </Link>
          <Button asChild>
            <Link href="/#pricing">Get Started</Link>
          </Button>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
