"use client"
import { useConfig } from "../../../contexts/config";
import { Suspense, useCallback, useMemo } from "react";
import { Predicted, } from "../types";
import { useSearchParams } from "next/navigation";
import { usePromiseData, fetchData, requiredOrNotFound } from "../../utils";
import { LineLoading } from "../../components/loading/loading";
import { default as NextLink } from 'next/link';
import ErrorView from "../../components/error-view"

const PredictedTableItems: (keyof Omit<Predicted, "group">)[] = [
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

const LoadingPlaceholder = <LineLoading>Loading</LineLoading>;

const EmptyPredictedEntry: Record<keyof Omit<Predicted, "group">, React.ReactNode> = {
  bacmet_id: LoadingPlaceholder,
  blast_hit_genome: LoadingPlaceholder,
  start_alignment_query: LoadingPlaceholder,
  end_alignment_query: LoadingPlaceholder,
  fident: LoadingPlaceholder,
  alnlen: LoadingPlaceholder,
  mismatch: LoadingPlaceholder,
  gapopen: LoadingPlaceholder,
  qstart: LoadingPlaceholder,
  qend: LoadingPlaceholder,
  qlen: LoadingPlaceholder,
  tstart: LoadingPlaceholder,
  tend: LoadingPlaceholder,
  tlen: LoadingPlaceholder,
  evalue: LoadingPlaceholder,
  bits: LoadingPlaceholder,
  prob: LoadingPlaceholder,
  lddt: LoadingPlaceholder,
  alntmscore: LoadingPlaceholder,
  rmsd: LoadingPlaceholder,
}

function PredictedEntryViewWithParams() {
  const {apiRoot} = useConfig();
  const searchParams = useSearchParams();
  const entryId = searchParams.get("entry_id");

  const entryFetcher = useCallback(() => fetchData<Predicted>(`${apiRoot}/predicted/${entryId}`), [apiRoot, entryId]);
  const defaultEntry = useMemo(() => ({...EmptyPredictedEntry, blast_hit_genome: entryId}), [entryId]);
  const [predictedEntry, predictedEntryError] = usePromiseData(entryFetcher, defaultEntry);
  requiredOrNotFound(predictedEntryError);

  return (
    <PredictedEntryView entry={predictedEntry}>
      {predictedEntryError ? <ErrorView>{predictedEntryError.error}</ErrorView> : <></>}
    </PredictedEntryView>
  )
}


function PredictedEntryView({entry, children}: {entry: Predicted | Record<keyof Omit<Predicted, "group">, React.ReactNode>, children?: React.ReactNode}) {
  return (
    <div className="col-sm-12 col-md-9 col-lg-7">
      <h1 className="text-center">{entry.blast_hit_genome} ({entry.bacmet_id})</h1>
      {children}
      <table className="table">
        <tbody>
          <tr><th scope="row">BacMet ID:</th><td>
          {typeof entry.bacmet_id === "string" ? (
              <NextLink href={`/search/entry/?entry_id=${entry.bacmet_id}`}>{ entry.bacmet_id }</NextLink>
            ) : entry.bacmet_id}
          </td></tr>
          {PredictedTableItems.map((item) => (
            <tr key={item}><th scope="row">{item}:</th><td>{ entry[item] }</td></tr>
          ))}
          {"group" in entry && entry.group ? <>
            <tr><th scope="row">Sequence:</th><td className="text-break">{ entry.group.sequence }</td></tr>
            <tr><th scope="row">Matching IDs:</th><td><ul>{entry.group.matching_ids.map(matching_id => (<li key={matching_id}>{matching_id}</li>))}</ul></td></tr>
          </> : <></>}
        </tbody>
      </table>
    </div>
  )
}


export default function EntryPage() {
  return (
    <div className="row justify-content-center pt-3 pb-3">
      <Suspense fallback={<PredictedEntryView entry={EmptyPredictedEntry}/>}>
        <PredictedEntryViewWithParams />
      </Suspense>
    </div>
  );
}

