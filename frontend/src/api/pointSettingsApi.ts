import { httpClient } from "./httpClient";
import type { PointSettings } from "../types/pointSettings";

const endpoint = "/admin/point-settings";

export const getPointSettings = async (): Promise<PointSettings> => {
  const response = await httpClient.get<PointSettings>(endpoint);
  return response.data;
};

export const updatePointSettings = async (settings: PointSettings): Promise<PointSettings> => {
  const response = await httpClient.put<PointSettings>(endpoint, settings);
  return response.data;
};
