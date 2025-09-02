"use client"
import { useConfig } from "../../../contexts/config";
import { Suspense, useState, useMemo, ReactNode, useEffect, useCallback, useId, ChangeEventHandler } from "react";
import {PredictedResult, ErrorResult, Link, Validated, Predicted, MultiValueField} from "../types";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import dynamic from 'next/dynamic'
import ValidatedEntry from "../components/validated-entry";
import { Pagination } from "../components/pagination";

const ClientRender = dynamic(() => import('./client-render'), { ssr: false })

const MultiSelectField = ({field, value, onChange}: {field: MultiValueField<unknown>, value: unknown[], onChange: (value: unknown[]) => void}) => {
  const fieldId = useId();
  const [current, setCurrent] = useState<unknown[]>(value);
  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>((event) => {
    const singleValue: unknown  = event.target.value;
    if (singleValue !== undefined) {
      setCurrent((value) => {
        if (value.includes(singleValue)) {
          return value.filter(v => v !== singleValue)
        } else {
          return [...value, singleValue]
        }
      })
    }
  }, [setCurrent]);

  useEffect(() => {
    onChange(current);
  }, [onChange, current])

  return (
    <>
      <legend>{ field.label }:</legend>
      <div className="row mb-3 px-3">
      {field.values.map(value => {
        const valueId = `${fieldId}-${value.value}`;
        return (
          <div key={value.value + ""} className="form-check col-md-4">
            <input
              className="form-check-input"
              type="checkbox"
              name={field.name}
              onChange={handleChange}
              checked={current.includes(value.value)} 
              value={value.value + ""}
              id={valueId}
              />
            <label
              className="form-check-label"
              htmlFor={valueId}
            >{ value.label }</label>
          </div>
        )
      })}
      </div>
    </>
  )
}

const PredictedTableItems: (keyof Predicted)[] = [
  "blast_hit_genome",
  "start_alignment_query",
  "end_alignment_query",
  "fident",
  "alnlen",
  "mismatch",
  "gapopen",
  "qstart",
  "qend",
  "qlen",
  "tstart",
  "tend",
  "tlen",
  "evalue",
  "bits",
  "prob",
  "lddt",
  "alntmscore",
  "rmsd",
];

const EmptyValidatedEntry: Validated = {
  gene_name: "...",
  bacmet_id: "...",
  code_for: "...",
  family: "...",
  organism: "...",
  location: "...",
  compounds: [],
  description: "...",
  length_aa: "...",
  reference: "...",
}

function EntryViewWithParams() {
  const {apiRoot} = useConfig();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const match = pathname.match(/^\/search\/entry\/(.*?)(\/.*)?$/);
  const [validated, setValidated] = useState<Validated | null>(null);
  
  const entryIdFromPath = match && match[1];
  const entryIdFromSearchParams = searchParams.get("entry_id");
  const entryId = entryIdFromPath || entryIdFromSearchParams;

  const router = useRouter();
  const [predictedResult, setPredictedResult] = useState<PredictedResult | ErrorResult | undefined>(undefined);
  const predictedPage = searchParams.get("page") || "0";

  const validatedEntry = useMemo(
    () => {
      const loadingText = <span>{`Loading data... ${entryId}`}</span>;
      const placeholder: Record<keyof Validated, ReactNode>= {
        gene_name: loadingText,
        bacmet_id: loadingText,
        code_for: loadingText,
        family: loadingText,
        organism: loadingText,
        location: loadingText,
        compounds: loadingText,
        description: loadingText,
        length_aa: loadingText,
        reference: loadingText,
      }
      return validated ? validated : placeholder
    },
    [validated, entryId]
  );
  useEffect(() => {
    const fetchEntry = async () => {
      const response = await fetch(`${apiRoot}/validated/${entryId}`)
      const data = await response.json()
      setValidated(data)
    }
    fetchEntry()
  }, [entryId, setValidated, apiRoot])

  useEffect(() => {
    const fetchEntry = async () => {
      const predictedResponse = await fetch(`${apiRoot}/search/predicted?bacmet_id=${entryId}&page=${predictedPage}`)
      const predictedData = await predictedResponse.json()
      setPredictedResult({type: "predicted", ...predictedData})
    }
    fetchEntry()
  }, [entryId, predictedPage, setPredictedResult, apiRoot])

  const handlePageNavigation = useCallback((page: Link) => {
      const url = new URL(page.href);
      const pageNumber = url.searchParams.get("page") || "0";
      router.push(pathname + `?page=${pageNumber}`);
  }, [pathname, router])


  const allPages = (predictedResult && "_links" in predictedResult ? predictedResult._links : []);
  const pageCount = (predictedResult && "_meta" in predictedResult ? predictedResult._meta.totalPages : undefined);
  const currentPageHref = allPages.filter(l => l.rel === "self")[0]?.href;
  const pages = allPages.filter(link => !["self", "next", "prev"].includes(link.rel));
  const [selectedTableItems, setSelectedTableItems] = useState<(keyof Predicted)[]>([
    "blast_hit_genome",
    "start_alignment_query",
    "end_alignment_query",
  ]);
  const handleSelectedTableItemsChange = useCallback((value: unknown[]) => {
    const updateTableItems = PredictedTableItems.filter(ti => value.includes(ti));
    setSelectedTableItems(updateTableItems)
  }, [setSelectedTableItems])
  const tableItemsField: MultiValueField<keyof Predicted> = {
    label: "Select visible fields",
    name: "visible_fields",
    value: [],
    values: PredictedTableItems.map(item => ({
      value: item,
      label: item
    }))
  }
  const usedTableItems = PredictedTableItems.filter(ti => selectedTableItems.includes(ti))
  return (
    <>
      <div className="col-sm-12 col-md-9 col-lg-7">
        <ValidatedEntry entry={validatedEntry} />
      </div>
      {predictedResult ? (
          <>
            <div className="col-sm-12 col-md-9 col-lg-7">
              <hr/>
              <MultiSelectField field={tableItemsField} value={selectedTableItems} onChange={handleSelectedTableItemsChange}/>
              <hr/>
            </div>
            {(() => {
              switch(predictedResult.type) {
                case "predicted": {
                  return (
                    <>
                      <div className="col-sm-12 col-md-9 col-lg-7">
                        <Pagination pages={pages} currentPage={currentPageHref} pageCount={pageCount} onNavigate={handlePageNavigation}/>
                      </div>
                      <div className="col-sm-12" style={{overflow: "auto"}}>
                        <table className="table">
                          <thead>
                            <tr>
                              {usedTableItems.map(ti => (
                                <th key={ti} scope="col">{ti}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {predictedResult ? predictedResult.items.map((item, index) => (
                              <tr key={index}>
                                {usedTableItems.map(ti => (
                                  <td key={ti}>{item[ti]}</td>
                                ))}
                              </tr>
                            )) : <></>}
                          </tbody>
                        </table>
                      </div>
                      <div className="col-sm-12 col-md-9 col-lg-7">
                        <Pagination pages={pages} currentPage={currentPageHref} pageCount={pageCount} onNavigate={handlePageNavigation}/>
                      </div>
                    </>
                  );
                }
                case "error": {
                  return (
                    <div>{predictedResult.error}</div>
                  )
                }
              }
            })()}
          </>
        ) : <></>}
    </>
  )
}

export default function EntryPage() {
  return (
    <div className="row justify-content-center pt-3 pb-3">
      <Suspense fallback={<ValidatedEntry entry={EmptyValidatedEntry}/>}>
        <ClientRender><EntryViewWithParams /></ClientRender>
      </Suspense>
    </div>
  );
}

