import { httpClient } from "./httpClient";
import type { DisputeResponse } from "./disputeApi";

export type AccountAppeal = {
  decisionId: number;
  decisionStatus: "SUSPENDED" | "BANNED";
  decisionReason: string;
  decisionAt: string;
  appeal: DisputeResponse | null;
};

export const getCurrentAccountAppeal = async () => {
  const response = await httpClient.get<AccountAppeal>("/me/account-appeal");
  return response.data;
};

export const submitAccountAppeal = async (description: string, evidenceUrls: string[]) => {
  const response = await httpClient.post<AccountAppeal>("/me/account-appeal", { description, evidenceUrls });
  return response.data;
};
