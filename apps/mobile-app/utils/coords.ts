export const clampLatitude = (latitude: number): number => {
  return Math.max(-90, Math.min(90, latitude));
};

export const clampLongitude = (longitude: number): number => {
  return Math.max(-180, Math.min(180, longitude));
};
