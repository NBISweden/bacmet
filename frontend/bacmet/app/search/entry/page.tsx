"use client"
import Sidebar from "../../components/sidebar/sidebar";
import { Suspense, useState, useMemo, ReactNode, useEffect, useCallback } from "react";
import {SearchParams, PredictedResult, ErrorResult, Field, Link} from "../types";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import dynamic from 'next/dynamic'
import ValidatedEntry from "../components/validated-entry";
import { Validated } from "../types";
import { Pagination } from "../components/pagination";

const ClientRender = dynamic(() => import('./client-render'), { ssr: false })


function EntryViewWithParams() {
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
      const response = await fetch(`/api/validated/${entryId}`)
      const data = await response.json()
      setValidated(data)
    }
    fetchEntry()
  }, [entryId, setValidated])

  useEffect(() => {
    const fetchEntry = async () => {
      const predictedResponse = await fetch(`/api/search/predicted?bacmet_id=${entryId}&page=${predictedPage}`)
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
  const pages = allPages.filter(link => !["self", "next", "prev"].includes(link.rel))
  return (
    <>
      <ValidatedEntry entry={validatedEntry} />
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
                          <th scope="col">Gene Name</th>
                          <th scope="col">GI number</th>
                          <th scope="col">GenBank ID</th>
                          <th scope="col">Sequence</th>
                          <th scope="col">Organism</th>
                          <th scope="col">NCBI annotation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {predictedResult ? predictedResult.items.map((item, index) => (
                          <tr key={index}>
                            <td>{ item.gene_name }</td>
                            <td><a href={`http://www.ncbi.nlm.nih.gov/protein/${item.protein_accession_uniprot}`} target="_blank">{ item.protein_accession_uniprot }</a></td>
                            <td>...</td>
                            <td><a href={`http://www.ncbi.nlm.nih.gov/protein/${item.protein_accession_uniprot}?report=fasta`} target="_blank">FASTA</a></td>
                            <td>{ item.organism }</td>
                            <td>...</td>
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
      <div className="col-sm-12 col-md-9 col-lg-7">
          <Suspense fallback={<ValidatedEntry entry={{} as any}/>}>
            <ClientRender><EntryViewWithParams /></ClientRender>
          </Suspense>
      </div>
    </div>
  );
}

