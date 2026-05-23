import { Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <main>
        <Outlet />
      </main>
    </div>
  );
}
