export const isUniqueConstraintViolationError = (error: unknown): boolean => {
  return (
    error instanceof Error &&
    (("code" in error && error.code === "23505") ||
      (error.cause instanceof Error &&
        "code" in error.cause &&
        error.cause.code === "23505"))
  );
};
