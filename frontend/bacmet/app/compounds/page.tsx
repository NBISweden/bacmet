"use client"
import { useConfig } from "../../contexts/config";
import { Suspense, useCallback, useState, useEffect, FormEventHandler, useMemo } from "react";
import { Compound, Result, Field } from "../search/types";
import { usePromiseData, fetchData } from "../utils";
import { TextField } from "../search/components/text-field";
import Link from 'next/link'
import ErrorView from "../components/error-view";
import { LineLoading } from "../components/loading/loading";

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
  const [filteredEntries, setFilteredEntries] = useState(entries);

  const searchField: Field<string> = useMemo(() => ({
    label: "Filter by compound name, chemical class, or CAS number",
    name: "compound_filtering",
    value: "",
    values: [],
    placeholder: "compound name, chemical class, or CAS number"
  }), []);

  useEffect(() => {
    setFilteredEntries(entries);
  }, [entries]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    const text = event.currentTarget["compound_filtering"]?.value?.trim().toLowerCase() || "";
    setFilteredEntries(entries.filter(c =>
      !text ||
      c.compound_name.toLowerCase().includes(text) ||
      c.chemical_class.toLowerCase().includes(text) ||
      (c.cas_number && c.cas_number.toLowerCase().includes(text))
    )
    );
  }, [entries]);

  return (
    <div className="col-sm-12 col-md-9 col-lg-7">
      <h1 className="text-center">Compounds</h1>
      {children}
      {entries.length > 0 ? (
        <>
          <form onSubmit={handleSubmit}>
            <TextField field={searchField} />
            <div className="pt-3 pb-2">
              <input className="btn btn-primary" type="submit" value="Filter" />
            </div>
          </form>
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
