"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo } from "react";
import { useConfig } from "../../../contexts/config";
import { Compound, ReplicateKeys } from "../../search/types";
import { usePromiseData, fetchData, requiredOrNotFound } from "../../utils";
import { LineLoading } from "@/app/components/loading/loading";
import ErrorView from "@/app/components/error-view";

function CompoundEntry({ compound, children }: { compound: ReplicateKeys<Compound, React.ReactNode>, children?: React.ReactNode}) {
  return (
    <div className="row justify-content-center pt-3 pb-3">
      <div className="col-sm-12 col-md-9 col-lg-7">
        <h1 className="text-center">Compound information: {compound.compound_name}</h1>
        {children}
        <table className="table">
          <tbody>
            <tr>
              <th scope="row">Name:</th>
              <td>{compound.compound_name}</td>
            </tr>
            <tr>
              <th scope="row">Chemical Class:</th>
              <td>{compound.chemical_class}</td>
            </tr>
            <tr>
              <th scope="row">CAS Number:</th>
              <td>{compound.cas_number}</td>
            </tr>
            {compound.description && (
              <tr>
                <th scope="row">Description:</th>
                <td>{compound.description}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const LoadingPlaceholder = <LineLoading>Loading</LineLoading>;

const DefaultCompound: ReplicateKeys<Compound, React.ReactNode> = {
  compound_name: LoadingPlaceholder,
  chemical_class: LoadingPlaceholder,
  cas_number: LoadingPlaceholder,
}

function CompoundEntryWithData() {
  const { apiRoot } = useConfig();
  const searchParams = useSearchParams();
  const compoundName = searchParams.get("compound_name");
  const defaultCompound: ReplicateKeys<Compound, React.ReactNode> = useMemo(
    () => (compoundName ? {...DefaultCompound, compound_name: compoundName} : DefaultCompound),
    [compoundName]
  )
  const compoundFetcher = useCallback(
    () => compoundName ? fetchData<Compound>(`${apiRoot}/compound/${encodeURIComponent(compoundName)}`) : Promise.resolve(defaultCompound),
    [apiRoot, compoundName]
  )
  const [compound, compoundError] = usePromiseData(compoundFetcher, defaultCompound);
  requiredOrNotFound(compoundError)

  return <CompoundEntry compound={compound}>
    {compoundError ? <ErrorView>Faild to load compound data: {compoundError.error}</ErrorView> : <></>}
  </CompoundEntry>;
}

export default function CompoundEntryPage() {
  return (
    <Suspense fallback={<CompoundEntry compound={DefaultCompound} />}>
      <CompoundEntryWithData />
    </Suspense>
  );
}
