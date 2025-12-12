import { logger } from "@/utils/logger";

interface PendingMove {
  location: { latitude: number; longitude: number };
  isPoi?: boolean;
}

class MapService {
  private static instance: MapService | null = null;
  private moveToPlace:
    | ((
        location: { latitude: number; longitude: number },
        isPoi?: boolean,
      ) => void)
    | null = null;
  private pendingMove: PendingMove | null = null;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  static getInstance(): MapService {
    MapService.instance ??= new MapService();
    return MapService.instance;
  }

  registerMoveToPlace(
    fn: (
      location: { latitude: number; longitude: number },
      isPoi?: boolean,
    ) => void,
  ): void {
    this.moveToPlace = fn;
  }

  setPendingMove(
    location: { latitude: number; longitude: number },
    isPoi?: boolean,
  ): void {
    this.pendingMove = { location, isPoi };
  }

  getPendingMove(): PendingMove | null {
    return this.pendingMove;
  }

  triggerMoveToPlace(): void {
    if (this.moveToPlace === null || this.pendingMove === null) {
      logger("moveToPlace is not registered");
      return;
    }

    if (this.moveToPlace !== null) {
      this.moveToPlace(
        this.pendingMove.location,
        this.pendingMove.isPoi ?? false,
      );
      this.pendingMove = null;
    }
  }
  clearMoveToPlace(): void {
    this.moveToPlace = null;
  }
}

export const mapService = MapService.getInstance();
