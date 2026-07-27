"use client";

import { useUser } from "@/context/UserContext";
import { usePathname } from "next/navigation";
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
  selectedGroupId: string;
  scopeVersion: number;
  selectGroup: (groupId: string) => void;
  refreshOrgs: () => Promise<void>;
};

const OrgsContext = createContext<OrgsContextType>({
  memberships: [],
  loading: true,
  error: false,
  selectedGroupId: "",
  scopeVersion: 0,
  selectGroup: () => {},
  refreshOrgs: async () => {},
});

export const useOrgs = () => useContext(OrgsContext);

const SELECTED_GROUP_KEY = "kenko-keiei.selectedGroupId";

function readStoredGroupId(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(SELECTED_GROUP_KEY) ?? "";
  } catch {
    return "";
  }
}

function storeGroupId(groupId: string): void {
  try {
    window.localStorage.setItem(SELECTED_GROUP_KEY, groupId);
  } catch {
    return;
  }
}

export function groupIdFromPathname(pathname: string): string {
  return /^\/groups\/([^/]+)/.exec(pathname)?.[1] ?? "";
}

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

  const isMember = (groupId: string) =>
    memberships.some(({ group }) => group.groupId === groupId);

  const [chosenGroupId, setChosenGroupId] = useState(readStoredGroupId);
  const [scopeVersion, setScopeVersion] = useState(0);

  const selectGroup = useCallback((groupId: string) => {
    setChosenGroupId(groupId);
    setScopeVersion((version) => version + 1);
  }, []);

  const pathGroupId = groupIdFromPathname(usePathname());
  const memberPathGroupId = isMember(pathGroupId) ? pathGroupId : "";
  const [seenPathGroupId, setSeenPathGroupId] = useState(memberPathGroupId);

  if (seenPathGroupId !== memberPathGroupId) {
    setSeenPathGroupId(memberPathGroupId);
    if (memberPathGroupId) selectGroup(memberPathGroupId);
  }

  const selectedGroupId =
    (isMember(chosenGroupId) ? chosenGroupId : "") ||
    memberships[0]?.group.groupId ||
    "";

  useEffect(() => {
    if (selectedGroupId) storeGroupId(selectedGroupId);
  }, [selectedGroupId]);

  return (
    <OrgsContext.Provider
      value={{
        memberships,
        loading,
        error,
        selectedGroupId,
        scopeVersion,
        selectGroup,
        refreshOrgs,
      }}
    >
      {children}
    </OrgsContext.Provider>
  );
};
