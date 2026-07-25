import { BrowserRouter } from "react-router-dom";

import { AppErrorBoundary } from "./components/errors/AppErrorBoundary";
import { AppRouter } from "./routes/AppRouter";

export default function App() {
  return (
    <BrowserRouter>
      <AppErrorBoundary>
        <AppRouter />
      </AppErrorBoundary>
    </BrowserRouter>
  );
}
