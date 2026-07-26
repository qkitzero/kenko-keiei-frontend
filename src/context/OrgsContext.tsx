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
  error: boolean;
  refreshOrgs: () => Promise<void>;
};

const OrgsContext = createContext<OrgsContextType>({
  memberships: [],
  loading: true,
  error: false,
  refreshOrgs: async () => {},
});

export const useOrgs = () => useContext(OrgsContext);

type LoadResult =
  | { ok: true; memberships: OrgMembership[] }
  | { ok: false; memberships?: undefined };

async function loadMemberships(): Promise<LoadResult> {
  try {
    const res = await fetch("/api/group/me");
    if (!res.ok) return { ok: false };
    return { ok: true, memberships: (await res.json()).groups ?? [] };
  } catch {
    return { ok: false };
  }
}

export const OrgsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: userLoading } = useUser();
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [error, setError] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null | undefined>(
    undefined,
  );

  const applyResult = useCallback((result: LoadResult) => {
    if (result.ok) {
      setMemberships(result.memberships);
      setError(false);
    } else {
      setMemberships([]);
      setError(true);
    }
  }, []);

  const refreshOrgs = useCallback(async () => {
    applyResult(await loadMemberships());
  }, [applyResult]);

  useEffect(() => {
    if (userLoading) return;
    let active = true;
    (async () => {
      if (!user) {
        if (!active) return;
        setMemberships([]);
        setError(false);
        setLoadedFor(null);
        return;
      }
      const result = await loadMemberships();
      if (!active) return;
      applyResult(result);
      setLoadedFor(user.userId);
    })();
    return () => {
      active = false;
    };
  }, [user, userLoading, applyResult]);

  const loading = userLoading || loadedFor !== (user ? user.userId : null);

  return (
    <OrgsContext.Provider value={{ memberships, loading, error, refreshOrgs }}>
      {children}
    </OrgsContext.Provider>
  );
};
