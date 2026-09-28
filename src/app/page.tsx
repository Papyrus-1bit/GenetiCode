"use client";

import { GenealogyApp } from "@/components/GenealogyApp";
import { StoreProvider } from "@/lib/store";

export default function Page() {
  return (
    <StoreProvider>
      <GenealogyApp />
    </StoreProvider>
  );
}
