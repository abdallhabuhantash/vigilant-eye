import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  camerasService,
  eventsService,
  reportsService,
  rulesService,
  systemService,
  usersService,
} from "@/services/monitoring-service";
import type { AiRule, EventStatus, SystemSettings } from "@/types";

const LIVE_REFRESH_MS = 15_000;

export const useCameras = () =>
  useQuery({ queryKey: ["cameras"], queryFn: camerasService.list });

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

export const useAiServiceStatus = () =>
  useQuery({
    queryKey: ["system", "ai"],
    queryFn: systemService.aiStatus,
    refetchInterval: LIVE_REFRESH_MS,
  });

export const useNvrStatus = () =>
  useQuery({
    queryKey: ["system", "nvr"],
    queryFn: systemService.nvrStatus,
    refetchInterval: LIVE_REFRESH_MS,
  });

export const useSystemSettings = () =>
  useQuery({ queryKey: ["system", "settings"], queryFn: systemService.settings });

export const useReportSummary = (range: "7d" | "30d") =>
  useQuery({ queryKey: ["reports", range], queryFn: () => reportsService.summary(range) });

export function useReviewEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: EventStatus; reviewer: string }) =>
      eventsService.review(input.id, input.status, input.reviewer),
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
    mutationFn: (input: { id: string; field: "aiEnabled" | "recording"; value: boolean }) =>
      input.field === "aiEnabled"
        ? camerasService.toggleAi(input.id, input.value)
        : camerasService.toggleRecording(input.id, input.value),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cameras"] });
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<SystemSettings>) => systemService.updateSettings(patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["system", "settings"] });
    },
  });
}