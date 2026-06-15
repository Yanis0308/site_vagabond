import React, { type ReactElement } from "react";

import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";

// Skeleton calqué sur LeaderboardUserItem : mêmes conteneurs (border-2, p-2,
// gaps), même avatar (w-8 h-8 = size "sm") et mêmes hauteurs de ligne que le
// contenu réel (text-sm → h-5, text-xs → h-4). On réserve 4 lignes, soit le
// cas le plus courant (utilisateur non classé, ou classé avec un dernier lieu
// visité), pour que la hauteur réservée corresponde à la carte affichée et
// éviter le flash (apparition brutale de la carte au chargement).
export const LeaderboardItemSkeleton = (): ReactElement => (
  <Box className="rounded-lg border-2 border-gray-100 bg-gray-50 p-2 shadow-sm">
    <HStack className="items-center gap-2">
      {/* Rank */}
      <Box className="w-14 items-center">
        <Box className="h-7 w-7 rounded-md bg-gray-200" />
      </Box>
      {/* Avatar */}
      <Box className="h-8 w-8 rounded-full bg-gray-200" />
      {/* User info */}
      <VStack className="flex-1 gap-0.5">
        <Box className="h-5 justify-center">
          <Box className="h-3 w-1/2 rounded bg-gray-200" />
        </Box>
        <Box className="h-4 justify-center">
          <Box className="h-2.5 w-1/3 rounded bg-gray-200" />
        </Box>
        <Box className="h-4 justify-center">
          <Box className="h-2.5 w-2/5 rounded bg-gray-200" />
        </Box>
        <Box className="h-4 justify-center">
          <Box className="h-2.5 w-1/4 rounded bg-gray-200" />
        </Box>
      </VStack>
    </HStack>
  </Box>
);

LeaderboardItemSkeleton.displayName = "LeaderboardItemSkeleton";
