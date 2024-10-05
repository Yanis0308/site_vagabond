import { useStorageState } from "@/hooks/useStorageState";
import { createContext, useContext, type PropsWithChildren } from "react";

export const AuthContext = createContext<{
  signIn: (apiAccessToken: string) => void;
  signOut: () => void;
  session: string | null;
  isLoading: boolean;
}>({
  signIn: () => null,
  signOut: () => null,
  session: null,
  isLoading: false,
});

// This hook can be used to access the user info.
export function useSession() {
  return useContext(AuthContext);
}

type SessionProviderProps = PropsWithChildren & {
  defaultSession: string | null;
};
export function SessionProvider({
  defaultSession,
  children,
}: SessionProviderProps) {
  const [[isLoading, session], setSession] = useStorageState(
    "session",
    defaultSession,
  );

  return (
    <AuthContext.Provider
      value={{
        signIn: (apiAccessToken: string) => {
          // Perform sign-in logic here
          setSession(apiAccessToken);
        },
        signOut: () => {
          setSession(null);
        },
        session,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
