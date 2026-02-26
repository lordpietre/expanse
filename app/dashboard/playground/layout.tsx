"use server"

import {ReactNode} from "react";
import UnifiedLayout from "@/components/ui/UnifiedLayout";

export default async function Layout({ children }: { children: ReactNode }) {
  return (
    <UnifiedLayout version={process.env.NEXT_PUBLIC_VERSION || "1.0.0"}>
      {children}
    </UnifiedLayout>
  );
}
