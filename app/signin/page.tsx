"use client"

import { Card, CardContent } from "@/components/ui/card";
import EmbedSignin from "@/components/display/embedSignin";

export default function Index() {


  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-full max-w-[480px]">
        <CardContent className="p-5">
          <EmbedSignin />
        </CardContent>
      </Card>
    </div>
  );
}