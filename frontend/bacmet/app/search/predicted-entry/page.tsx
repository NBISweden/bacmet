"use client"
import { useConfig } from "../../../contexts/config";
import { Suspense, useCallback } from "react";
import { Predicted, } from "../types";
import { useSearchParams } from "next/navigation";
import { usePromiseData, fetchData } from "../../utils";
import { default as NextLink } from 'next/link';

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

const EmptyPredictedEntry: Record<keyof Omit<Predicted, "group">, string> = {
  bacmet_id: "...",
  blast_hit_genome: "...",
  start_alignment_query: "...",
  end_alignment_query: "...",
  fident: "...",
  alnlen: "...",
  mismatch: "...",
  gapopen: "...",
  qstart: "...",
  qend: "...",
  qlen: "...",
  tstart: "...",
  tend: "...",
  tlen: "...",
  evalue: "...",
  bits: "...",
  prob: "...",
  lddt: "...",
  alntmscore: "...",
  rmsd: "...",
}

function PredictedEntryViewWithParams() {
  const {apiRoot} = useConfig();
  const searchParams = useSearchParams();
  const entryId = searchParams.get("entry_id");

  const entryFetcher = useCallback(() => fetchData<Predicted>(`${apiRoot}/predicted/${entryId}`), [apiRoot, entryId]);
  const predictedEntry = usePromiseData(entryFetcher, EmptyPredictedEntry);

  return (
    <PredictedEntryView entry={predictedEntry} />
  )
}


function PredictedEntryView({entry}: {entry: Predicted | Record<keyof Omit<Predicted, "group">, React.ReactNode>}) {
  return (
    <div className="col-sm-12 col-md-9 col-lg-7">
      <h1 className="text-center">{entry.bacmet_id}: {entry.blast_hit_genome}</h1>
      <table className="table">
        <tbody>
          <tr><th scope="row">BacMet ID:</th><td><NextLink href={`/search/entry/?entry_id=${entry.bacmet_id}`}>{ entry.bacmet_id }</NextLink></td></tr>
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

