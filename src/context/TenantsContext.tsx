"use client";

import { useUser } from "@/context/UserContext";
import { usePathname, useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type TenantMembership = {
  tenant: { tenantId: string; name: string };
  role: string;
};

type TenantsContextType = {
  memberships: TenantMembership[];
  loading: boolean;
  error: boolean;
  selectedTenantId: string;
  scopeVersion: number;
  selectTenant: (tenantId: string) => void;
  refreshTenants: () => Promise<void>;
};

const TenantsContext = createContext<TenantsContextType>({
  memberships: [],
  loading: true,
  error: false,
  selectedTenantId: "",
  scopeVersion: 0,
  selectTenant: () => {},
  refreshTenants: async () => {},
});

export const useTenants = () => useContext(TenantsContext);

const SELECTED_TENANT_KEY = "kenko-keiei.selectedTenantId";
const LEGACY_SELECTED_TENANT_KEY = "kenko-keiei.selectedGroupId";

function readStoredTenantId(): string {
  if (typeof window === "undefined") return "";
  try {
    return (
      window.localStorage.getItem(SELECTED_TENANT_KEY) ??
      window.localStorage.getItem(LEGACY_SELECTED_TENANT_KEY) ??
      ""
    );
  } catch {
    return "";
  }
}

function storeTenantId(tenantId: string): void {
  try {
    window.localStorage.setItem(SELECTED_TENANT_KEY, tenantId);
  } catch {
    return;
  }
}

export function tenantIdFromPathname(pathname: string): string {
  return /^\/tenants\/([^/]+)/.exec(pathname)?.[1] ?? "";
}

export function useTenantScope(): string {
  const { memberships, selectedTenantId, scopeVersion, selectTenant } =
    useTenants();
  const searchParams = useSearchParams();
  const [mountScopeVersion] = useState(scopeVersion);

  const linkTenantId = searchParams.get("tenantId") ?? "";
  const linkScoped =
    scopeVersion === mountScopeVersion &&
    memberships.some(({ tenant }) => tenant.tenantId === linkTenantId);

  useEffect(() => {
    if (linkScoped && linkTenantId !== selectedTenantId) {
      selectTenant(linkTenantId);
    }
  }, [linkScoped, linkTenantId, selectedTenantId, selectTenant]);

  return linkScoped ? linkTenantId : selectedTenantId;
}

type LoadResult =
  | { ok: true; memberships: TenantMembership[] }
  | { ok: false; memberships?: undefined };

type GroupMembership = {
  group?: { groupId?: string; name?: string };
  role?: string;
};

function toMemberships(groups: unknown): TenantMembership[] {
  if (!Array.isArray(groups)) return [];
  return (groups as GroupMembership[]).flatMap((entry) => {
    const tenantId = entry?.group?.groupId;
    if (!tenantId) return [];
    return [
      {
        tenant: { tenantId, name: entry.group?.name ?? "" },
        role: entry.role ?? "",
      },
    ];
  });
}

async function loadMemberships(): Promise<LoadResult> {
  try {
    const res = await fetch("/api/group/me");
    if (!res.ok) return { ok: false };
    const data = await res.json();
    return { ok: true, memberships: toMemberships(data.groups) };
  } catch {
    return { ok: false };
  }
}

export const TenantsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user, loading: userLoading } = useUser();
  const [memberships, setMemberships] = useState<TenantMembership[]>([]);
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

  const refreshTenants = useCallback(async () => {
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

  const isMember = (tenantId: string) =>
    memberships.some(({ tenant }) => tenant.tenantId === tenantId);

  const [chosenTenantId, setChosenTenantId] = useState(readStoredTenantId);
  const [scopeVersion, setScopeVersion] = useState(0);

  const selectTenant = useCallback((tenantId: string) => {
    setChosenTenantId(tenantId);
    setScopeVersion((version) => version + 1);
  }, []);

  const pathTenantId = tenantIdFromPathname(usePathname());
  const memberPathTenantId = isMember(pathTenantId) ? pathTenantId : "";
  const [seenPathTenantId, setSeenPathTenantId] = useState(memberPathTenantId);

  if (seenPathTenantId !== memberPathTenantId) {
    setSeenPathTenantId(memberPathTenantId);
    if (memberPathTenantId) selectTenant(memberPathTenantId);
  }

  const selectedTenantId =
    (isMember(chosenTenantId) ? chosenTenantId : "") ||
    memberships[0]?.tenant.tenantId ||
    "";

  useEffect(() => {
    if (selectedTenantId) storeTenantId(selectedTenantId);
  }, [selectedTenantId]);

  return (
    <TenantsContext.Provider
      value={{
        memberships,
        loading,
        error,
        selectedTenantId,
        scopeVersion,
        selectTenant,
        refreshTenants,
      }}
    >
      {children}
    </TenantsContext.Provider>
  );
};
