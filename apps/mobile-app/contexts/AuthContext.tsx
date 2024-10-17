import {
  createContext,
  type PropsWithChildren,
  ReactElement,
  useContext,
} from "react";

import { useStorageState } from "@/hooks/useStorageState";

interface AuthContextContent {
  signIn: (apiAccessToken: string) => void;
  signOut: () => void;
  session: string | null;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextContent>({
  signIn: () => null,
  signOut: () => null,
  session: null,
  isLoading: false,
});

// This hook can be used to access the user info.
export function useSession(): AuthContextContent {
  return useContext(AuthContext);
}

type SessionProviderProps = PropsWithChildren & {
  defaultSession: string | null;
};

//eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- Context Provider so it's ok
export function SessionProvider({
  defaultSession,
  children,
}: SessionProviderProps): ReactElement {
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
