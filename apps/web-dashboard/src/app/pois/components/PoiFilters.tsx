import {
  type Dispatch,
  type ReactElement,
  type SetStateAction,
  useState,
} from "react";

export interface FilterValue {
  checked: boolean;
  count: number;
  tagName: string;
  tagValue: string;
}

interface PoiFiltersProps {
  typeFilters: Map<string, FilterValue>;
  setTypeFilters: Dispatch<SetStateAction<Map<string, FilterValue>>>;
}

export function PoiFilters({
  typeFilters,
  setTypeFilters,
}: PoiFiltersProps): ReactElement {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );

  const toggleSection = (poiClass: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(poiClass)) {
        newSet.delete(poiClass);
      } else {
        newSet.add(poiClass);
      }
      return newSet;
    });
  };

  const toggleAllInSection = (
    entries: Array<{ type: string; value: FilterValue }>,
    checked: boolean,
  ) => {
    setTypeFilters((prev) => {
      const newMap = new Map(prev);
      entries.forEach(({ type, value }) => {
        newMap.set(type, {
          ...value,
          checked,
          count: value.count,
        });
      });
      return newMap;
    });
  };

  return (
    <div className="flex h-screen flex-col gap-2 overflow-y-scroll">
      <div className="flex flex-col gap-1 rounded border p-2">
        <button
          className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
          onClick={() => {
            setTypeFilters(
              (prev) =>
                new Map(
                  Array.from(prev.entries()).map(([type, value]) => [
                    type,
                    { ...value, checked: true, count: value.count },
                  ]),
                ),
            );
          }}
        >
          Check all
        </button>
        <button
          className="rounded bg-gray-500 px-4 py-2 font-bold text-white hover:bg-gray-700"
          onClick={() => {
            setTypeFilters(
              (prev) =>
                new Map(
                  Array.from(prev.entries()).map(([type, value]) => [
                    type,
                    { ...value, checked: false, count: value.count },
                  ]),
                ),
            );
          }}
        >
          Uncheck all
        </button>
      </div>

      {Array.from(
        Array.from(typeFilters.entries())
          .sort((a, b) => {
            // First sort by subclass count
            const countDiff = b[1].count - a[1].count;
            if (countDiff !== 0) return countDiff;
            // Then by class name
            return a[1].tagName.localeCompare(b[1].tagName);
          })
          .reduce((acc, [type, value]) => {
            const existing = acc.get(value.tagName) ?? [];
            acc.set(value.tagName, [...existing, { type, value }]);
            return acc;
          }, new Map<string, Array<{ type: string; value: FilterValue }>>()),
      ).map(([poiClass, entries]) => (
        <div key={poiClass} className="flex flex-col gap-1 rounded border p-2">
          <h3
            className="flex cursor-pointer items-center gap-2 font-bold"
            onClick={() => {
              toggleSection(poiClass);
            }}
          >
            <span
              className="transition-transform duration-200"
              style={{
                display: "inline-block",
                transform: expandedSections.has(poiClass)
                  ? "rotate(90deg)"
                  : "rotate(0deg)",
              }}
            >
              ▶
            </span>
            {poiClass}
            <label
              className="ml-auto flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <input
                type="checkbox"
                checked={entries.every(
                  ({ type }) => typeFilters.get(type)?.checked,
                )}
                onChange={(e) => {
                  toggleAllInSection(entries, e.target.checked);
                }}
              />
              <span className="text-sm font-normal">Tout sélectionner</span>
            </label>
          </h3>
          {expandedSections.has(poiClass) && (
            <div className="flex flex-col gap-1 pl-2">
              {entries
                .sort((a, b) => b.value.count - a.value.count)
                .map(({ type, value }) => (
                  <label htmlFor={type} key={value.tagValue}>
                    <input
                      id={type}
                      type="checkbox"
                      checked={value.checked}
                      onChange={() => {
                        setTypeFilters((prev) => {
                          const newMap = new Map(prev);
                          newMap.set(type, {
                            ...value,
                            checked: !prev.get(type)?.checked,
                            count: prev.get(type)?.count ?? 0,
                          });
                          return newMap;
                        });
                      }}
                    />
                    {value.tagValue} ({value.count})
                  </label>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
