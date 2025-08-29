"use client"
import Sidebar from "../../components/sidebar/sidebar";
import { Suspense, useState, useMemo, ReactNode, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from 'next/dynamic'
import { usePathLoader } from "./path-loader";
import ValidatedEntry from "../components/validated-entry";
import { Validated } from "../types";

const PathLoader = dynamic(() => import('./path-loader'), { ssr: false })


function EntryViewWithParams() {
  const match = usePathLoader();
  const searchParams = useSearchParams();
  const [validated, setValidated] = useState<Validated | null>(null);
  
  const entryIdFromPath = match && match[1];
  const entryIdFromSearchParams = searchParams.get("entry_id");
  const entryId = entryIdFromPath || entryIdFromSearchParams;

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

  return (
    <>
      <ValidatedEntry entry={validatedEntry} />
      <hr />
    </>
  )
}

export default function EntryPage() {
  return (
    <>
      <div className="text-center py-3">
        
      </div>
      <div className="row row-gap-3">
        <div className="col-md-4 order-md-last">
          <Sidebar>
            <div className="list-group">
              This is a sidear
            </div>
          </Sidebar>
        </div>
        <div className="col-md-8 order-md-first">
          <Suspense fallback={<ValidatedEntry entry={{} as any}/>}>
            <PathLoader match={/^\/search\/entry\/(.*?)(\/.*)?$/}><EntryViewWithParams /></PathLoader>
          </Suspense>
        </div>
      </div>
    </>
  );
}

