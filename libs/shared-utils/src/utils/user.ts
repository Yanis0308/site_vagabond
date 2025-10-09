/**
 * Get display name for a user from fullName or email
 * If fullName exists, use it. Otherwise, truncate email before @
 * @param fullName - User's full name (can be null or undefined)
 * @param email - User's email (can be null or undefined)
 * @returns Display name for the user
 */
export const getUserDisplayName = (
  fullName: string | null | undefined,
  email: string | null | undefined,
): string => {
  // If fullName exists, use it
  if (
    fullName !== null &&
    fullName !== undefined &&
    fullName.trim().length > 0
  ) {
    return fullName;
  }

  // Otherwise, truncate email before @
  if (email?.includes("@")) {
    return email.split("@")[0] ?? "Utilisateur inconnu";
  }

  return "Utilisateur inconnu";
};
