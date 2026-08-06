import { ThemeChrome } from "@/components/theme";
import AppRoutes from "@/router/app-routes";
import StoreProvider from "./services/features/StoreProvider";
import QueryClientContextProvider from "./services/QueryClientContextProvider";

export default function App() {
  return (
    <>
      <StoreProvider>
        <QueryClientContextProvider>
          <ThemeChrome />
          <AppRoutes />
        </QueryClientContextProvider>
      </StoreProvider>
    </>
  );
}
