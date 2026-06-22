import { useState, useEffect } from "react";
import { adminDashboardApi, AdminDashboardResponse } from "../../../api/adminDashboardApi";

export function useAdminDashboard() {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const res = await adminDashboardApi.getDashboardData();
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load dashboard"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return {
    dashboard: data,
    isLoading,
    error,
    refetch: fetchDashboard,
  };
}
