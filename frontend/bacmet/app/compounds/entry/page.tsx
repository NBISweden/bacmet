"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useConfig } from "../../../contexts/config";
import { Compound } from "../../search/types";

export default function CompoundEntryPage() {
  const { apiRoot } = useConfig();
  const searchParams = useSearchParams();
  const compoundName = searchParams.get("compound_name");
  const [compound, setCompound] = useState<Compound | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!compoundName) return;
    setError(null);

    fetch(`${apiRoot}/compound/${encodeURIComponent(compoundName)}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data) => setCompound(data))
      .catch((e) => setError(e.message))
  }, [apiRoot, compoundName]);

  return (
    <div className="row justify-content-center pt-3 pb-3">
      <div className="col-sm-12 col-md-9 col-lg-7">
        {error && <p className="text-danger text-center">{compoundName} {error}</p>}
        {compound && (
          <>
            <h1 className="text-center">Compound information</h1>
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
          </>
        )}
      </div>
    </div>
  );
}