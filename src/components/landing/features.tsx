import { ShoppingCart, BarChart, Settings, BrainCircuit } from "lucide-react";

export function FeaturesSection() {
  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-card">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">
              Key Features
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
              Everything You Need to Sell Online
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              From AI-powered tools to a powerful admin dashboard, we&apos;ve got
              you covered.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 sm:grid-cols-2 md:gap-12 lg:grid-cols-2">
          <div className="grid gap-2">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <h3 className="text-xl font-bold">Beautiful Showcases</h3>
            <p className="text-muted-foreground">
              Create a stunning storefront with your own branding, logo, and
              colors.
            </p>
          </div>
          <div className="grid gap-2">
            <BrainCircuit className="h-8 w-8 text-primary" />
            <h3 className="text-xl font-bold">AI-Powered Tools</h3>
            <p className="text-muted-foreground">
              Save time with AI-generated product descriptions and smart category suggestions.
            </p>
          </div>
          <div className="grid gap-2">
            <BarChart className="h-8 w-8 text-primary" />
            <h3 className="text-xl font-bold">Product Management</h3>
            <p className="text-muted-foreground">
              Easily add, edit, and organize your products with categories and
              featured sections.
            </p>
          </div>
          <div className="grid gap-2">
            <Settings className="h-8 w-8 text-primary" />
            <h3 className="text-xl font-bold">Full Admin Control</h3>
            <p className="text-muted-foreground">
              Manage orders, view analytics, and configure your store from a
              secure admin panel.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
