"use client"
import { useConfig } from "../../../contexts/config";
import { Suspense, useState, ReactNode, useMemo, useCallback } from "react";
import { Result, Link, Validated, Predicted, MultiValueField, ReplicateKeys } from "../types";
import { useSearchParams } from "next/navigation";
import ValidatedEntry from "../components/validated-entry";
import { Pagination } from "../components/pagination";
import ErrorView from "../../components/error-view";
import { navigateInPage } from "../../utils";
import { MultiSelectField } from "../components/multi-select-field/multi-select-field";
import { default as NextLink } from 'next/link';
import { LineLoading } from "../../components/loading/loading";
import { usePromiseData, fetchData } from "../../utils";

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

const LoadingPlaceholder = <LineLoading>Loading</LineLoading>;

const EmptyValidatedEntry: ReplicateKeys<Validated, ReactNode> = {
  gene_name: LoadingPlaceholder,
  bacmet_id: LoadingPlaceholder,
  code_for: LoadingPlaceholder,
  family: LoadingPlaceholder,
  organism: LoadingPlaceholder,
  location: LoadingPlaceholder,
  compounds: [],
  description: LoadingPlaceholder,
  length_aa: LoadingPlaceholder,
  reference: [],
  protein_accession_ncbi: LoadingPlaceholder,
  protein_accession_uniprot: LoadingPlaceholder,
  nucleotide_accession_ena_embl: LoadingPlaceholder,
}

function EntryViewWithParams() {
  const {apiRoot} = useConfig();
  const searchParams = useSearchParams();

  const entryId = searchParams.get("entry_id");
  const predictedPage = searchParams.get("page") || "0";

  const validatedFetcher = useCallback(
    () => fetchData<Validated>(`${apiRoot}/validated/${entryId}`),
    [apiRoot, entryId]
  );
  const defaultEntry = useMemo(() => ({...EmptyValidatedEntry, bacmet_id: entryId}), [entryId])
  const [validatedEntry, validatedEntryError] = usePromiseData(validatedFetcher, defaultEntry);

  const predictedFetcher = useCallback(
    () => fetchData<Result<Predicted>>(`${apiRoot}/search/predicted?bacmet_id=${entryId}&page=${predictedPage}`),
    [apiRoot, entryId, predictedPage]
  )
  const [predictedResult, predictedResultError] = usePromiseData(predictedFetcher, null);

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
        <h1>{validatedEntry.bacmet_id}: {validatedEntry.organism} ({validatedEntry.gene_name})</h1>
        {validatedEntryError ? <ErrorView>Failed to load data: {validatedEntryError.error}</ErrorView>: <></>}
        <ValidatedEntry entry={validatedEntry} />
        {predictedResultError ? <ErrorView>Failed to load predicted result: {predictedResultError.error}</ErrorView>: <></>}
      </div>
      {predictedResult && !predictedResultError ? (
          <>
            <div className="col-sm-12 col-md-9 col-lg-7">
              <h2>Related predictions</h2>
              <hr/>
              <MultiSelectField field={tableItemsField} onChange={handleSelectedTableItemsChange}/>
              <hr/>
            </div>
            {predictedResult ? <>
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
              </> : <></>}
          </>
        ) : <div className="col-sm-12 col-md-9 col-lg-7"><LineLoading>Loading predicted data</LineLoading></div>}
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

