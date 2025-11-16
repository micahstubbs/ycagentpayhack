import { Chat } from "@/app/product/Chat/Chat";
import { ChatIntro } from "@/app/product/Chat/ChatIntro";
import { UserMenu } from "@/components/UserMenu";
import { api } from "@/convex/_generated/api";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ProductPage() {
  let viewer = null;
  let viewerId = null;
  
  try {
    const token = await convexAuthNextjsToken();
    if (token) {
      viewer = await fetchQuery(
        api.users.viewer,
        {},
        { token },
      );
      viewerId = viewer?._id || null;
    }
  } catch (error) {
    // Not authenticated - that's okay, demo mode
    console.log("Demo mode: No authentication");
  }

  return (
    <main className="flex max-h-screen grow flex-col overflow-hidden">
      <div className="flex items-start justify-between border-b p-4">
        <ChatIntro />
        {viewer ? (
          <UserMenu>{viewer.name}</UserMenu>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Demo Mode</span>
            <Link href="/signin">
              <Button size="sm" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        )}
      </div>
      <Chat viewer={viewerId} />
    </main>
  );
}
