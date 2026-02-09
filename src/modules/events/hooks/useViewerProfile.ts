import { useViewerProfileContext } from "@/src/modules/events/providers/ViewerProfileProvider";

export function useViewerProfile() {
  return useViewerProfileContext();
}
