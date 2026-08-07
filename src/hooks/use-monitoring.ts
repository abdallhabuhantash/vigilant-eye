import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  camerasService,
  eventsService,
  reportsService,
  rulesService,
  systemService,
  usersService,
} from "@/services/monitoring-service";
import type { AiRule, EventStatus, OperationMode, SystemSettings } from "@/types";

const LIVE_REFRESH_MS = 15_000;
const HEARTBEAT_REFRESH_MS = 10_000;

/** Explicit demo/live switch, stored in system settings. */
export const useOperationMode = () =>
  useQuery<OperationMode>({
    queryKey: ["system", "mode"],
    queryFn: systemService.operationMode,
    refetchInterval: LIVE_REFRESH_MS,
  });

export const useCameras = () =>
  useQuery({
    queryKey: ["cameras"],
    queryFn: camerasService.list,
    refetchInterval: HEARTBEAT_REFRESH_MS,
  });

export const useCameraSummary = () =>
  useQuery({
    queryKey: ["cameras", "summary"],
    queryFn: camerasService.summary,
    refetchInterval: LIVE_REFRESH_MS,
  });

export const useEvents = () =>
  useQuery({ queryKey: ["events"], queryFn: eventsService.list, refetchInterval: LIVE_REFRESH_MS });

export const useRecentEvents = (limit = 5) =>
  useQuery({
    queryKey: ["events", "recent", limit],
    queryFn: () => eventsService.recent(limit),
    refetchInterval: LIVE_REFRESH_MS,
  });

export const useEventsSummary = () =>
  useQuery({
    queryKey: ["events", "summary"],
    queryFn: eventsService.summary,
    refetchInterval: LIVE_REFRESH_MS,
  });

export const useAiRules = () => useQuery({ queryKey: ["ai-rules"], queryFn: rulesService.list });

export const useUsers = () => useQuery({ queryKey: ["users"], queryFn: usersService.list });

export const useAiServiceStatus = () => {
  const mode = useOperationMode();
  return useQuery({
    queryKey: ["system", "ai", mode.data ?? "demo"],
    queryFn: () => systemService.aiStatus(mode.data ?? "demo"),
    enabled: mode.data !== undefined,
    refetchInterval: HEARTBEAT_REFRESH_MS,
  });
};

export const useNvrStatus = () => {
  const mode = useOperationMode();
  return useQuery({
    queryKey: ["system", "nvr", mode.data ?? "demo"],
    queryFn: () => systemService.nvrStatus(mode.data ?? "demo"),
    enabled: mode.data !== undefined,
    refetchInterval: HEARTBEAT_REFRESH_MS,
  });
};

export const useSystemSettings = () =>
  useQuery({ queryKey: ["system", "settings"], queryFn: systemService.settings });

export const useReportSummary = (range: "7d" | "30d") =>
  useQuery({ queryKey: ["reports", range], queryFn: () => reportsService.summary(range) });

export function useReviewEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: EventStatus; note?: string }) =>
      eventsService.review(input.id, input.status, input.note),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useUpdateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; patch: Partial<AiRule> }) =>
      rulesService.update(input.id, input.patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ai-rules"] });
    },
  });
}

export function useToggleCameraFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    // Recording state is reported by the NVR / AI service, never set from the browser.
    mutationFn: (input: { id: string; field: "aiEnabled"; value: boolean }) =>
      camerasService.toggleAi(input.id, input.value),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cameras"] });
    },
  });
}

/** Assigns which cameras a detection rule applies to. */
export function useSetRuleCameras() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { ruleId: string; cameraIds: string[] }) =>
      rulesService.setCameras(input.ruleId, input.cameraIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ai-rules"] });
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<SystemSettings>) => systemService.updateSettings(patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["system", "settings"] });
      void queryClient.invalidateQueries({ queryKey: ["system"] });
    },
  });
}