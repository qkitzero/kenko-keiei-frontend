"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type BirthDate = {
  year: number;
  month: number;
  day: number;
};

type User = {
  userId: string;
  displayName: string;
  birthDate: BirthDate;
} | null;

export type UserStatus =
  "loading" | "ready" | "signedOut" | "noProfile" | "error";

type UserContextType = {
  user: User;
  status: UserStatus;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType>({
  user: null,
  status: "loading",
  loading: true,
  refreshUser: async () => {},
});

export const useUser = () => useContext(UserContext);

type LoadResult = { status: Exclude<UserStatus, "loading">; user: User };

const loadUser = async (): Promise<LoadResult> => {
  try {
    const res = await fetch("/api/user/get");
    if (res.ok) return { status: "ready", user: (await res.json()) as User };
    if (res.status === 401) return { status: "signedOut", user: null };
    if (res.status === 404) return { status: "noProfile", user: null };
    return { status: "error", user: null };
  } catch {
    return { status: "error", user: null };
  }
};

export const UserProvider = ({
  initialStatus = "loading",
  children,
}: {
  initialStatus?: Extract<UserStatus, "loading" | "signedOut">;
  children: React.ReactNode;
}) => {
  const [state, setState] = useState<{ status: UserStatus; user: User }>({
    status: initialStatus,
    user: null,
  });

  const refreshUser = useCallback(async () => {
    setState(await loadUser());
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await loadUser();
      if (active) setState(result);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <UserContext.Provider
      value={{
        user: state.user,
        status: state.status,
        loading: state.status === "loading",
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
