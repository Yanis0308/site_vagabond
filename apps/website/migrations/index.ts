import * as migration_20260326_140224_add_localization from "./20260326_140224_add_localization";

export const migrations = [
  {
    up: migration_20260326_140224_add_localization.up,
    down: migration_20260326_140224_add_localization.down,
    name: "20260326_140224_add_localization",
  },
];
