"use client";

import { LanguageProvider } from "@/lib/LanguageContext";
import { Provider } from "react-redux";
import { store } from "../store/store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <LanguageProvider>{children}</LanguageProvider>
    </Provider>
  );
}
