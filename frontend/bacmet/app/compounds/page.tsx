"use client"
import { useConfig } from "../../contexts/config";
import { Suspense, useCallback, useState, useMemo } from "react";
import { Compound, Result, MultiValueField, FieldValue } from "../search/types";
import { usePromiseData, fetchData } from "../utils";
import { MultiSelectField } from "../search/components/multi-select-field/multi-select-field";
import Link from 'next/link'
import ErrorView from "../components/error-view";
import { LineLoading } from "../components/loading/loading";

const DefaultCompounds: Result<Compound> = {
  items: [],
  _meta: {
    totalRecords: 0,
    totalPages: 0,
    page: 0,
    count: 0,
  },
  _links: [],
}

function CompoundListWithData() {
  const {apiRoot} = useConfig();

  const compoundsFetcher = useCallback(() => fetchData<Result<Compound>>(`${apiRoot}/aggregated/compound`), [apiRoot]);
  const [compoundsResult, compoundsError] = usePromiseData(compoundsFetcher, null);

  return (
    <CompoundList entries={compoundsResult ? compoundsResult.items : []}>
      {compoundsError ? <ErrorView>Failed to load compounds list: {compoundsError.error}</ErrorView> : <></>}
      {!compoundsResult ? <LineLoading>Loading compounds list</LineLoading> : <></>}
    </CompoundList>
  )
}

function CompoundList({entries, children}: {entries: Compound[], children?: React.ReactNode}) {
  const [usedChemcialClasses, setUsedChemicalClasses] = useState<Set<unknown>>(new Set());
  const chemicalClasses = useMemo(() => (
    Array.from(new Set<string>(entries.map(c => c.chemical_class)))
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map<FieldValue>(cc => ({value: cc, label: cc}))
  ), [entries]);
  const chemicalClassField: MultiValueField = useMemo(() => ({
    label: "Filter by chemical classes",
    name: "chemical_class",
    value: Array.from(usedChemcialClasses || []),
    values: chemicalClasses,
  }), [usedChemcialClasses, chemicalClasses]);
  const handleSelectedChemicalClass = useCallback((value: unknown[]) => setUsedChemicalClasses(new Set(value)), [setUsedChemicalClasses])
  const filteredEntries = entries.filter(c => usedChemcialClasses.size > 0 ? usedChemcialClasses.has(c.chemical_class) : true );
  return (
    <div className="col-sm-12 col-md-9 col-lg-7">
      <h1 className="text-center">Compounds</h1>
      {children}
      {entries.length > 0 ? (
        <>
          <MultiSelectField field={chemicalClassField} onChange={handleSelectedChemicalClass}/>
          <hr />
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Chemical Class</th>
                <th scope="col">CAS Number</th>
                <th scope="col">Search</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map(entry => {
                const searchByChemicalClassUrl = `/search/?${new URLSearchParams({chemical_class: entry.chemical_class})}`;
                const searchByCompoundUrl = `/search/?${new URLSearchParams({compound: entry.compound_name})}`;
                return (
                  <tr key={entry.compound_name}>
                    <td scope="col">
                      <Link href={`/compounds/entry?${new URLSearchParams({ compound_name: entry.compound_name })}`}>
                        {entry.compound_name}
                      </Link>
                    </td>
                    <td scope="col">{entry.chemical_class}</td>
                    <td scope="col">{entry.cas_number}</td>
                    <td scope="col">
                      <ul>
                        <li className="text-nowrap"><Link href={searchByChemicalClassUrl}>By Chemical Class</Link></li>
                        <li className="text-nowrap"><Link href={searchByCompoundUrl}>By Compound</Link></li>
                      </ul>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      ) : <></>}
    </div>
  )
}

export default function CompoundsPage() {
  return (
    <div className="row justify-content-center pt-3 pb-3">
      <Suspense fallback={<CompoundList entries={[]}/>}>
        <CompoundListWithData />
      </Suspense>
    </div>
  );
}
