"use client";

import { useUser } from "@/context/UserContext";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type OrgMembership = {
  group: { groupId: string; name: string };
  role: string;
};

type OrgsContextType = {
  memberships: OrgMembership[];
  loading: boolean;
  refreshOrgs: () => Promise<void>;
};

const OrgsContext = createContext<OrgsContextType>({
  memberships: [],
  loading: true,
  refreshOrgs: async () => {},
});

export const useOrgs = () => useContext(OrgsContext);

async function loadMemberships(): Promise<OrgMembership[]> {
  const res = await fetch("/api/group/me");
  if (!res.ok) return [];
  return (await res.json()).groups ?? [];
}

export const OrgsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: userLoading } = useUser();
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshOrgs = useCallback(async () => {
    setMemberships(await loadMemberships().catch(() => []));
  }, []);

  useEffect(() => {
    if (userLoading) return;
    let active = true;
    (async () => {
      const data = await (user
        ? loadMemberships().catch(() => [])
        : Promise.resolve([]));
      if (!active) return;
      setMemberships(data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user, userLoading]);

  return (
    <OrgsContext.Provider value={{ memberships, loading, refreshOrgs }}>
      {children}
    </OrgsContext.Provider>
  );
};
