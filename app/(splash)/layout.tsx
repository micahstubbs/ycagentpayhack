"use client";

import { Button } from "@/components/ui/button";
import { SimpleThemeToggle } from "@/components/SimpleThemeToggle";
import Link from "next/link";
import { ReactNode } from "react";

export default function SplashPageLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="absolute top-0 z-50 w-full">
        <nav className="container flex h-20 items-center justify-between px-6 sm:px-8">
          <Link href="/" className="text-lg font-semibold text-neutral-900 dark:text-white">
            Durin
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="https://github.com"
              className="hidden text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white sm:block"
              target="_blank"
            >
              GitHub
            </Link>
            <Link
              href="https://docs.paywithlocus.com"
              className="hidden text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white sm:block"
              target="_blank"
            >
              Docs
            </Link>
            <SimpleThemeToggle />
            <Link href="/product">
              <Button 
                size="sm" 
                className="h-9 rounded-full bg-neutral-900 px-6 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
              >
                Launch App
              </Button>
            </Link>
          </div>
        </nav>
      </header>
      <main className="flex grow flex-col">{children}</main>
    </div>
  );
}
