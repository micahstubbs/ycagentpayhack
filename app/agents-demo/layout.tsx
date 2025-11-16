import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ReactNode } from "react";

export default function AgentsDemoLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ConvexClientProvider>{children}</ConvexClientProvider>;
}
