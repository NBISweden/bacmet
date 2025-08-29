"use client"
import Sidebar from "../../components/sidebar/sidebar";
import { Suspense } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { useEffect } from "react";
import dynamic from 'next/dynamic'
import { usePathLoader } from "./path-loader";

const PathLoader = dynamic(() => import('./path-loader'), { ssr: false })

function EntryView({entryId}: {entryId: string | null}) {
  return <div>{entryId}</div>
}

function EntryViewWithParams() {
  const match = usePathLoader();
  const searchParams = useSearchParams();
  
  const entryIdFromPath = match && match[1];
  const entryIdFromSearchParams = searchParams.get("entry_id");
  const entryId = entryIdFromPath || entryIdFromSearchParams;

  return <EntryView entryId={entryId} />
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
          <Suspense fallback={<EntryView entryId={null}/>}>
            <PathLoader match={/^\/search\/entry\/(.*)$/}><EntryViewWithParams /></PathLoader>
          </Suspense>
        </div>
      </div>
    </>
  );
}

