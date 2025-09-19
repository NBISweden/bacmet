"use client"
import { useConfig } from "../../../contexts/config";
import { Suspense, useState, useMemo, ReactNode, useEffect, useCallback } from "react";
import { PredictedResult, ErrorResult, Link, Validated, Predicted, MultiValueField, ReplicateKeys } from "../types";
import { useSearchParams } from "next/navigation";
import ValidatedEntry from "../components/validated-entry";
import { Pagination } from "../components/pagination";
import { navigateInPage } from "../../utils";
import { MultiSelectField } from "../components/multi-select-field/multi-select-field";
import { default as NextLink } from 'next/link';

type ListedItems = keyof Omit<Predicted, "group">

const PredictedTableItems: ListedItems[] = [
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
  reference: [],
  protein_accession_ncbi: "...",
  protein_accession_uniprot: "...",
  nucleotide_accession_ena_embl: "...",
}

function EntryViewWithParams() {
  const {apiRoot} = useConfig();
  const searchParams = useSearchParams();
  const [validated, setValidated] = useState<Validated | null>(null);

  const entryId = searchParams.get("entry_id");

  const [predictedResult, setPredictedResult] = useState<PredictedResult | ErrorResult | undefined>(undefined);
  const predictedPage = searchParams.get("page") || "0";

  const validatedEntry = useMemo(
    () => {
      const loadingText = <span>{`Loading data... ${entryId}`}</span>;
      const placeholder: ReplicateKeys<Validated, ReactNode>= {
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
        protein_accession_ncbi: loadingText,
        protein_accession_uniprot: loadingText,
        nucleotide_accession_ena_embl: loadingText,
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
      if (entryId) {
        navigateInPage({entry_id: entryId, page: pageNumber});
      }
  }, [entryId])


  const allPages = (predictedResult && "_links" in predictedResult ? predictedResult._links : []);
  const pageCount = (predictedResult && "_meta" in predictedResult ? predictedResult._meta.totalPages : undefined);
  const currentPageHref = allPages.filter(l => l.rel === "self")[0]?.href;
  const pages = allPages.filter(link => !["self", "next", "prev"].includes(link.rel));
  const [selectedTableItems, setSelectedTableItems] = useState<ListedItems[]>([
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
    value: selectedTableItems,
    values: PredictedTableItems.map(item => ({
      value: item,
      label: item
    }))
  }
  const usedTableItems = PredictedTableItems.filter(ti => selectedTableItems.includes(ti))
  return (
    <>
      <div className="col-sm-12 col-md-9 col-lg-7">
        <h1>{validatedEntry.gene_name}: {validatedEntry.organism} ({validatedEntry.bacmet_id})</h1>
        <ValidatedEntry entry={validatedEntry} />
      </div>
      {predictedResult ? (
          <>
            <div className="col-sm-12 col-md-9 col-lg-7">
              <h2>Related predictions</h2>
              <hr/>
              <MultiSelectField field={tableItemsField} onChange={handleSelectedTableItemsChange}/>
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
                              <th>BLAST Hit Genome</th>
                              {usedTableItems.map(ti => (
                                <th key={ti} scope="col">{ti}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {predictedResult ? predictedResult.items.map((item, index) => (
                              <tr key={index}>
                                <td><NextLink href={`/search/predicted-entry/?entry_id=${item.blast_hit_genome}`}>{item.blast_hit_genome}</NextLink></td>
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
        <EntryViewWithParams />
      </Suspense>
    </div>
  );
}

