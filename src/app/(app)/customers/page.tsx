"use client";

import Badge from "@/components/Badge";
import Checkbox from "@/components/Checkbox";
import DataTable, { type Column, type SortOrder } from "@/components/DataTable";
import LoginButton from "@/components/LoginButton";
import Missing from "@/components/Missing";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import PageSkeleton from "@/components/PageSkeleton";
import PrimaryLink from "@/components/PrimaryLink";
import SecondaryButton from "@/components/SecondaryButton";
import Select from "@/components/Select";
import StateCard from "@/components/StateCard";
import TextField from "@/components/TextField";
import { useTenantScope, useTenants } from "@/context/TenantsContext";
import { Customer, genderLabel } from "@/lib/customer";
import {
  CUSTOMER_STATUS_FILTERS,
  NO_ORGANIZATION,
  canSortByOrganization,
  customerListHref,
  customerStatusLabel,
  filterCustomers,
  hasCustomerConditions,
  organizationFilterValue,
  readCustomerFilters,
  sortCustomers,
  toCustomerSortKey,
  toCustomerStatusFilter,
  type CustomerFilters,
} from "@/lib/customerList";
import { currentFiscalYear, dateInputLabel, dateLabel } from "@/lib/date";
import { organizationName, type OrganizationOptions } from "@/lib/organization";
import { customerStatus } from "@/lib/tenantSummary";
import { useOrganizations } from "@/lib/useOrganizations";
import {
  useTenantSummary,
  type TenantSummaryState,
} from "@/lib/useTenantSummary";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type LoadResult =
  | { status: "ok"; customers: Customer[] }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "error" };

type LoadedList = { key: string; result: LoadResult };

async function loadCustomers(
  tenantId: string,
  includeInactive: boolean,
): Promise<LoadResult> {
  const query = new URLSearchParams({ tenantId });
  if (includeInactive) query.set("includeInactive", "true");
  const res = await fetch(`/api/fitness/customers?${query}`);
  if (!res.ok) {
    if (res.status === 401) return { status: "unauthenticated" };
    if (res.status === 403) return { status: "forbidden" };
    return { status: "error" };
  }
  const data = await res.json();
  const customers: Customer[] = (data.customers ?? []).filter(
    (customer: Customer) => customer.customerId,
  );
  return { status: "ok", customers };
}

function CellPlaceholder({ width }: { width: string }) {
  return (
    <span
      className={`bg-placeholder inline-block h-4 ${width} animate-pulse rounded align-middle`}
    />
  );
}

function organizationCell(
  organizations: OrganizationOptions,
  organizationId: string | undefined,
) {
  if (!organizationId) return "—";
  if (organizations.status === "loading") {
    return <CellPlaceholder width="w-24" />;
  }
  if (organizations.status === "error") {
    return <span className="text-subtle">取得できませんでした</span>;
  }
  return organizationName(organizations, organizationId) || "—";
}

function measuredCell(summary: TenantSummaryState, customer: Customer) {
  if (summary.status === "loading") {
    return <CellPlaceholder width="w-20" />;
  }
  if (summary.status !== "ok") {
    return <span className="text-subtle">取得できませんでした</span>;
  }
  const status = customerStatus(summary.summary.statuses, customer.customerId);
  if (!status.covered) return <span className="text-subtle">不明</span>;
  return dateInputLabel(status.lastMeasuredOn) || <Missing />;
}

function customerColumns(
  organizations: OrganizationOptions,
  summary: TenantSummaryState,
): Column<Customer>[] {
  return [
    {
      header: "氏名",
      sortKey: "name",
      cell: (customer) => (
        <span className="flex items-center gap-2">
          {customer.name}
          {customer.isActive === false && (
            <Badge size="sm" tone="subtle">
              無効
            </Badge>
          )}
        </span>
      ),
    },
    {
      header: "カナ",
      sortKey: "nameKana",
      cell: (customer) => customer.nameKana,
    },
    {
      header: "組織",
      sortKey: canSortByOrganization(organizations)
        ? "organization"
        : undefined,
      cell: (customer) =>
        organizationCell(organizations, customer.organizationId),
    },
    { header: "性別", cell: (customer) => genderLabel(customer.gender) || "—" },
    {
      header: "生年月日",
      sortKey: "birthDate",
      cell: (customer) => dateLabel(customer.birthDate) || "—",
      align: "end",
    },
    {
      header: "最終測定日",
      cell: (customer) => measuredCell(summary, customer),
      align: "end",
    },
  ];
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<PageSkeleton shape="list" />}>
      <Customers />
    </Suspense>
  );
}

function Customers() {
  const searchParams = useSearchParams();
  const {
    memberships,
    loading: tenantsLoading,
    error: tenantsError,
    refreshTenants,
  } = useTenants();

  const [loaded, setLoaded] = useState<LoadedList | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [retrying, setRetrying] = useState(false);

  const tenantId = useTenantScope();
  const organizations = useOrganizations(tenantId);
  const fiscalYear = currentFiscalYear();
  const summary = useTenantSummary(tenantId, fiscalYear);
  const filters = readCustomerFilters(searchParams);
  const includeInactive = filters.includeInactive;

  const [query, setQuery] = useState(filters.q);
  const [seenQuery, setSeenQuery] = useState(filters.q);
  const [writtenQuery, setWrittenQuery] = useState(filters.q);

  if (seenQuery !== filters.q) {
    setSeenQuery(filters.q);
    if (filters.q !== writtenQuery) setQuery(filters.q);
  }

  const statusReady = summary.status === "ok";
  const statusAvailable = statusReady || summary.status === "loading";
  const applied: CustomerFilters = {
    ...filters,
    q: query,
    organizationId: organizationFilterValue(filters, organizations),
    status: statusAvailable ? filters.status : "",
  };
  const statusPending = Boolean(applied.status) && !statusReady;

  const scopeHref = customerListHref(tenantId, {
    ...filters,
    organizationId: "",
  });

  const requestKey = `${reloadKey}:${tenantId}:${includeInactive}`;
  const result = loaded?.key === requestKey ? loaded.result : null;

  useEffect(() => {
    if (!tenantId || searchParams.get("tenantId") === tenantId) return;
    window.history.replaceState(null, "", scopeHref);
  }, [tenantId, scopeHref, searchParams]);

  useEffect(() => {
    if (!tenantId) return;
    let active = true;
    (async () => {
      const loadResult = await loadCustomers(tenantId, includeInactive).catch(
        () => ({ status: "error" }) as const,
      );
      if (!active) return;
      setLoaded({ key: requestKey, result: loadResult });
    })();
    return () => {
      active = false;
    };
  }, [tenantId, includeInactive, requestKey]);

  if (tenantsLoading) {
    return <PageSkeleton shape="list" />;
  }

  if (tenantsError) {
    const handleRetryTenants = () => {
      if (retrying) return;
      setRetrying(true);
      void refreshTenants().finally(() => setRetrying(false));
    };

    return (
      <PageContainer centered>
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          テナント情報を取得できませんでした
        </h1>
        <p className="text-subtle text-sm">
          対象のテナントを読み込めないため、顧客を表示できません。
        </p>
        <SecondaryButton onClick={handleRetryTenants} disabled={retrying}>
          {retrying ? "再試行中..." : "再試行"}
        </SecondaryButton>
      </PageContainer>
    );
  }

  if (memberships.length === 0) {
    return (
      <PageContainer centered>
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          対象のテナントがありません
        </h1>
        <p className="text-subtle text-sm">
          顧客を扱うにはテナントに所属する必要があります。
        </p>
        <Link href="/tenants" className="text-muted text-sm underline">
          テナントを管理
        </Link>
      </PageContainer>
    );
  }

  const tenantName =
    memberships.find(({ tenant }) => tenant.tenantId === tenantId)?.tenant
      .name ?? "";

  const writeFilters = (next: CustomerFilters) => {
    setWrittenQuery(next.q);
    window.history.replaceState(null, "", customerListHref(tenantId, next));
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    writeFilters({ ...filters, q: value });
  };

  const handleSort = (key: string) => {
    const sort = toCustomerSortKey(key);
    if (!sort) return;
    const order: SortOrder =
      filters.sort === sort && filters.order === "asc" ? "desc" : "asc";
    writeFilters({ ...filters, q: query, sort, order });
  };

  const clearConditions = () => {
    setQuery("");
    writeFilters({ ...filters, q: "", organizationId: "", status: "" });
  };

  const customers = result?.status === "ok" ? result.customers : null;
  const rows = customers
    ? sortCustomers(
        filterCustomers(
          customers,
          applied,
          organizations,
          statusReady ? summary.summary.statuses : {},
        ),
        applied,
        organizations,
      )
    : [];
  const narrowed = hasCustomerConditions(applied);

  return (
    <PageContainer>
      <PageHeader
        title="顧客"
        description={`${tenantName}に登録されている顧客の一覧です。`}
        actions={
          <PrimaryLink href="/customers/register">顧客を登録</PrimaryLink>
        }
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <TextField
              type="search"
              value={query}
              onChange={handleSearch}
              placeholder="氏名・カナで検索"
              aria-label="顧客を検索"
              className="w-56"
            />
            <Select
              value={applied.organizationId}
              onChange={(value) =>
                writeFilters({ ...filters, q: query, organizationId: value })
              }
              aria-label="組織で絞り込む"
              disabled={organizations.status !== "ok"}
              className="w-44"
            >
              <option value="">すべての組織</option>
              <option value={NO_ORGANIZATION}>組織未所属</option>
              {organizations.status === "ok" &&
                organizations.organizations.map((organization) => (
                  <option
                    key={organization.organizationId}
                    value={organization.organizationId}
                  >
                    {organization.name}
                  </option>
                ))}
            </Select>
            <Select
              value={applied.status}
              onChange={(value) =>
                writeFilters({
                  ...filters,
                  q: query,
                  status: toCustomerStatusFilter(value),
                })
              }
              aria-label="測定状況で絞り込む"
              disabled={!statusAvailable}
              className="w-48"
            >
              <option value="">すべての測定状況</option>
              {CUSTOMER_STATUS_FILTERS.map((status) => (
                <option key={status} value={status}>
                  {customerStatusLabel(status, fiscalYear)}
                </option>
              ))}
            </Select>
            <Checkbox
              label="無効な顧客も表示する"
              checked={includeInactive}
              onChange={(checked) =>
                writeFilters({ ...filters, q: query, includeInactive: checked })
              }
            />
          </div>
          <p role="status" className="text-subtle text-sm tabular-nums">
            {customers &&
              !statusPending &&
              (narrowed
                ? `${customers.length}件中 ${rows.length}件`
                : `${customers.length}件`)}
          </p>
        </div>

        {organizations.status === "error" && (
          <p className="text-subtle flex items-center gap-2 text-sm">
            組織名を取得できませんでした。組織での絞り込みと並べ替えは使えません。
            <SecondaryButton size="sm" onClick={organizations.retry}>
              再取得
            </SecondaryButton>
          </p>
        )}

        {summary.status === "error" && (
          <p className="text-subtle flex items-center gap-2 text-sm">
            測定状況を取得できませんでした。測定状況での絞り込みは使えません。
            <SecondaryButton size="sm" onClick={summary.retry}>
              再取得
            </SecondaryButton>
          </p>
        )}

        {summary.status === "forbidden" && (
          <p className="text-subtle text-sm">
            このテナントの測定状況を表示する権限がないため、測定状況での絞り込みは使えません。
          </p>
        )}

        {!result || statusPending ? (
          <div className="bg-placeholder h-64 w-full animate-pulse rounded-lg" />
        ) : result.status === "unauthenticated" ? (
          <StateCard
            message="サインインの有効期限が切れました。再度サインインしてください。"
            action={<LoginButton />}
          />
        ) : result.status === "forbidden" ? (
          <StateCard message="このテナントの顧客を表示する権限がありません。" />
        ) : result.status === "error" ? (
          <StateCard
            message="顧客一覧を読み込めませんでした。時間をおいて再度お試しください。"
            action={
              <SecondaryButton onClick={() => setReloadKey((key) => key + 1)}>
                再試行
              </SecondaryButton>
            }
          />
        ) : (
          <DataTable
            caption="顧客一覧"
            columns={customerColumns(organizations, summary)}
            rows={rows}
            rowKey={(customer) => customer.customerId ?? ""}
            rowHref={(customer) => `/customers/${customer.customerId}`}
            sort={
              filters.sort
                ? { key: filters.sort, order: filters.order }
                : undefined
            }
            onSort={handleSort}
            empty={
              result.customers.length > 0 && narrowed ? (
                <StateCard
                  message="条件に一致する顧客がいません。"
                  action={
                    <SecondaryButton onClick={clearConditions}>
                      条件をクリア
                    </SecondaryButton>
                  }
                />
              ) : (
                <StateCard
                  message={
                    includeInactive
                      ? "このテナントにはまだ顧客が登録されていません。"
                      : "このテナントに有効な顧客はいません。無効な顧客は上のチェックボックスで表示できます。"
                  }
                  action={
                    <PrimaryLink href="/customers/register">
                      顧客を登録
                    </PrimaryLink>
                  }
                />
              )
            }
          />
        )}
      </div>
    </PageContainer>
  );
}
