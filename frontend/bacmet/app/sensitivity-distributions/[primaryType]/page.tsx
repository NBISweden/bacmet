import { Suspense } from "react";
import { SensitivitDistributionsView } from "./sensitivity-distributions-view" 

export function generateStaticParams() {
  return [
    { primaryType: "biocide" },
    { primaryType: "species" },
  ];
}

export default async function SensitivityDistributionsPage({ params }: { params: Promise<{ primaryType: string }> }) {
  const paramValues = await params;
  return (
    <div className="row justify-content-center pt-3 pb-3">
      <Suspense><SensitivitDistributionsView primaryType={paramValues.primaryType}/></Suspense>
    </div>
  );
}

