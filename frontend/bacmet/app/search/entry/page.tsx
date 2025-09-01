"use client"
import { useConfig } from "../../../contexts/config";
import { Suspense, useState, useMemo, ReactNode, useEffect, useCallback } from "react";
import {PredictedResult, ErrorResult, Link, Validated} from "../types";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import dynamic from 'next/dynamic'
import ValidatedEntry from "../components/validated-entry";
import { Pagination } from "../components/pagination";


const ClientRender = dynamic(() => import('./client-render'), { ssr: false })


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
  }, [entryId, setValidated])

  useEffect(() => {
    const fetchEntry = async () => {
      const predictedResponse = await fetch(`${apiRoot}/search/predicted?bacmet_id=${entryId}&page=${predictedPage}`)
      const predictedData = await predictedResponse.json()
      setPredictedResult({type: "predicted", ...predictedData})
    }
    fetchEntry()
  }, [entryId, predictedPage, setPredictedResult])

  const handlePageNavigation = useCallback((page: Link) => {
      const url = new URL(page.href);
      const pageNumber = url.searchParams.get("page") || "0";
      router.push(pathname + `?page=${pageNumber}`);
  }, [pathname, router])


  const allPages = (predictedResult && "_links" in predictedResult ? predictedResult._links : []);
  const pageCount = (predictedResult && "_meta" in predictedResult ? predictedResult._meta.totalPages : undefined);
  const currentPageHref = allPages.filter(l => l.rel === "self")[0]?.href;
  const pages = allPages.filter(link => !["self", "next", "prev"].includes(link.rel));
  return (
    <>
      <div className="col-sm-12 col-md-9 col-lg-7">
        <ValidatedEntry entry={validatedEntry} />
      </div>
      {predictedResult ? (
          <>
            <hr/>
            <Pagination pages={pages} currentPage={currentPageHref} pageCount={pageCount} onNavigate={handlePageNavigation}/>
            {(() => {
              switch(predictedResult.type) {
                case "predicted": {
                  return (
                    <table className="table">
                      <thead>
                        <tr>
                          <th scope="col">blast_hit_genome</th>
                          <th scope="col">start_alignment_query</th>
                          <th scope="col">end_alignment_query</th>
                          <th scope="col">fident</th>
                          <th scope="col">alnlen</th>
                          <th scope="col">mismatch</th>
                          <th scope="col">gapopen</th>
                          <th scope="col">qstart</th>
                          <th scope="col">qend</th>
                          <th scope="col">qlen</th>
                          <th scope="col">tstart</th>
                          <th scope="col">tend</th>
                          <th scope="col">tlen</th>
                          <th scope="col">evalue</th>
                          <th scope="col">bits</th>
                          <th scope="col">prob</th>
                          <th scope="col">lddt</th>
                          <th scope="col">alntmscore</th>
                          <th scope="col">rmsd</th>
                        </tr>
                      </thead>
                      <tbody>
                        {predictedResult ? predictedResult.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.blast_hit_genome}</td>
                            <td>{item.start_alignment_query}</td>
                            <td>{item.end_alignment_query}</td>
                            <td>{item.fident}</td>
                            <td>{item.alnlen}</td>
                            <td>{item.mismatch}</td>
                            <td>{item.gapopen}</td>
                            <td>{item.qstart}</td>
                            <td>{item.qend}</td>
                            <td>{item.qlen}</td>
                            <td>{item.tstart}</td>
                            <td>{item.tend}</td>
                            <td>{item.tlen}</td>
                            <td>{item.evalue}</td>
                            <td>{item.bits}</td>
                            <td>{item.prob}</td>
                            <td>{item.lddt}</td>
                            <td>{item.alntmscore}</td>
                            <td>{item.rmsd}</td>
                          </tr>
                        )) : <></>}
                      </tbody>
                    </table>
                  );
                }
                case "error": {
                  return (
                    <div>{predictedResult.error}</div>
                  )
                }
              }
            })()}
            <Pagination pages={pages} currentPage={currentPageHref} pageCount={pageCount} onNavigate={handlePageNavigation}/>
          </>
        ) : <></>}
    </>
  )
}

export default function EntryPage() {
  return (
    <div className="row justify-content-center pt-3 pb-3">
      <Suspense fallback={<ValidatedEntry entry={{} as any}/>}>
        <ClientRender><EntryViewWithParams /></ClientRender>
      </Suspense>
    </div>
  );
}

