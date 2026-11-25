"use client";

import { Check, PenLine, RotateCw, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Spinner } from "@/components/ui/spinner";
import { buttonStyles, inputStyles } from "@/components/ui/styles";
import { formatAmount } from "@/lib/format";
import { inCategoryGroup, matchesPresetQuery, PRESET_CATEGORY_GROUPS, type PresetCategoryGroupId } from "@/lib/presets/search";
import type { GetPresetsResult, PresetSummaryItem } from "@/lib/presets/types";
import { CYCLE_SUFFIX } from "@/lib/subscriptions/labels";

const INITIAL_VISIBLE = 8;

type Props = {
  result: GetPresetsResult;
  selectedId: string | null;
  /** preset이 null이면 직접 입력. serviceName은 빈 검색 결과에서 검색어를 서비스명으로 넘길 때 사용 */
  onSelect: (preset: PresetSummaryItem | null, serviceName?: string) => void;
  disabled?: boolean;
};

export function PresetCatalogGrid({ result, selectedId, onSelect, disabled }: Props) {
  const router = useRouter();
  const [retrying, startRetry] = useTransition();
  const [group, setGroup] = useState<PresetCategoryGroupId>("all");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const presets = result.success ? result.data : [];
  const filtered = presets.filter((preset) => inCategoryGroup(preset.category, group) && matchesPresetQuery(preset.serviceName, query));
  const collapsed = group === "all" && !query.trim() && !showAll && filtered.length > INITIAL_VISIBLE;
  const visible = collapsed ? filtered.slice(0, INITIAL_VISIBLE) : filtered;

  return (
    <section aria-labelledby="preset-heading" className="flex flex-col gap-3">
      <h2 id="preset-heading" className="text-section text-foreground">
        인기 구독 서비스 빠른 선택
      </h2>

      {!result.success ? (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-border bg-surface p-4">
          <p className="text-body text-foreground">프리셋을 불러오지 못했습니다. 아래에서 직접 입력할 수 있어요.</p>
          <button type="button" disabled={retrying} onClick={() => startRetry(() => router.refresh())} className={buttonStyles.secondary}>
            {retrying ? <Spinner /> : <RotateCw aria-hidden="true" className="size-4" />}
            다시 시도
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <label htmlFor="preset-search" className="sr-only">
              서비스 검색
            </label>
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              id="preset-search"
              type="search"
              placeholder="서비스 검색 (예: 넷플, chat)"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled={disabled}
              className={`${inputStyles} pl-10`}
            />
          </div>

          <div role="group" aria-label="카테고리" className="flex flex-wrap gap-2">
            {PRESET_CATEGORY_GROUPS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={group === item.id}
                onClick={() => setGroup(item.id)}
                disabled={disabled}
                className={`min-h-11 min-w-11 rounded-xl border px-3 text-body outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  group === item.id ? "border-primary bg-primary-subtle font-semibold text-primary" : "border-border bg-surface text-muted-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <p className="sr-only" aria-live="polite">
            {filtered.length}개 서비스
          </p>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-xl border border-border bg-surface p-4">
              <p className="text-body text-foreground">일치하는 서비스가 없습니다.</p>
              <button type="button" disabled={disabled} onClick={() => onSelect(null, query.trim())} className={buttonStyles.secondary}>
                <PenLine aria-hidden="true" className="size-4" />
                직접 입력하기
              </button>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-2">
              <li>
                <button
                  type="button"
                  aria-pressed={selectedId === null}
                  onClick={() => onSelect(null)}
                  disabled={disabled}
                  className={`flex min-h-16 w-full items-center gap-2 rounded-xl border p-3 text-left text-body font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    selectedId === null ? "border-primary bg-primary-subtle text-primary" : "border-border bg-surface text-foreground"
                  }`}
                >
                  <PenLine aria-hidden="true" className="size-4 shrink-0" />
                  직접 입력
                </button>
              </li>
              {visible.map((preset) => {
                const selected = selectedId === preset.id;
                return (
                  <li key={preset.id}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onSelect(preset)}
                      disabled={disabled}
                      className={`relative flex min-h-16 w-full flex-col items-start rounded-xl border p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        selected ? "border-primary bg-primary-subtle" : "border-border bg-surface"
                      }`}
                    >
                      <span className="pr-5 text-body font-semibold text-foreground">{preset.serviceName}</span>
                      <span className="text-caption text-muted-foreground">
                        {formatAmount(preset.defaultAmount, preset.defaultCurrency)}
                        {CYCLE_SUFFIX[preset.defaultBillingCycle]} · {preset.category}
                      </span>
                      {selected ? <Check aria-label="선택됨" className="absolute top-3 right-3 size-4 text-primary" /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {collapsed ? (
            <button type="button" onClick={() => setShowAll(true)} disabled={disabled} className={`${buttonStyles.ghost} w-full`}>
              전체 {filtered.length}개 서비스 보기
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}
