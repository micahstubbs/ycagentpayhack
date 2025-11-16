import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function Message({
  authorName,
  authorId,
  viewerId,
  children,
}: {
  authorName: string;
  authorId: Id<"users">;
  viewerId: Id<"users"> | null;
  children: ReactNode;
}) {
  const isOwnMessage = viewerId && authorId === viewerId;
  
  return (
    <li
      className={cn(
        "flex flex-col text-sm",
        isOwnMessage ? "items-end self-end" : "items-start self-start",
      )}
    >
      <div className="mb-1 text-sm font-medium">{authorName}</div>
      <p
        className={cn(
          "rounded-xl bg-muted px-3 py-2",
          isOwnMessage ? "rounded-tr-none" : "rounded-tl-none",
        )}
      >
        {children}
      </p>
    </li>
  );
}
