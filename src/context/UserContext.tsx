"use client";

import { createContext, useContext, useEffect, useState } from "react";

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

type UserContextType = {
  user: User;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async (): Promise<User> => {
    try {
      const res = await fetch("/api/user/get");
      if (!res.ok) return null;
      return (await res.json()) as User;
    } catch {
      return null;
    }
  };

  const refreshUser = async () => {
    setUser(await loadUser());
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const data = await loadUser();
      if (active) {
        setUser(data);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};
