"use client"
import { useConfig } from "../../../contexts/config";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { FieldValue, MultiValueField, Field } from "../../search/types";
import { SelectField } from "../../search/components/select-field";
import { MultiSelectField } from "../../search/components/multi-select-field";
import { FieldSet } from "../../search/components/fieldset";
import { navigateInPage } from "../../utils";

type HistogramData = {
  params: {[x: string]: string};
  type: string;
  unit: string;
  buckets: {
    range: [number, number];
    count: number;
  }[]
}

function usePromiseData<T, D>(promiseGenerator: () => Promise<T>, defaultValue: D): T | D {
  const [data, setData] = useState<T | null>(null);
  const ref = useRef<() => Promise<T> | null>(null);

  useEffect(() => {
    ref.current = promiseGenerator;
    const fetchData = async () => {
      const result = await promiseGenerator();
      if (ref.current === promiseGenerator) {
        setData(result);
      }
    }
    fetchData();
    return () => {
      ref.current = null;
    };
  }, [setData, promiseGenerator]);

  return data || defaultValue;
}

async function fetchData<T>(url: string): Promise<T> {
  const response = await fetch(url);
  return await response.json() as T
}

async function fetchValue<T, K extends keyof T>(promise: Promise<T>, key: K): Promise<T[K]> {
  const data = await promise;
  return data[key];
}

type ValueContainer<T = unknown> = {
  items: FieldValue<T>[];
}

export function SensitivitDistributionsView({primaryType}: {primaryType: string}) {
  const {apiRoot} = useConfig();
  const searchParams = useSearchParams();
  const secondaryType = {
    "species": "biocide",
    "biocide": "species",
  }[primaryType + ""];
  const primaryIdentifier = searchParams.get(primaryType)
  const secondaryIdentifiers = useMemo(() => {
    return secondaryType ? searchParams.getAll(secondaryType) : []
  }, [searchParams, secondaryType]);

  const histogramFetcher = useCallback(
    () => {
      return Promise.all(secondaryIdentifiers.map((secondaryIdentifier) => (
        fetchData<HistogramData>(`${apiRoot}/sensitivity_distributions/histogram?${primaryType}=${primaryIdentifier}&${secondaryType}=${secondaryIdentifier}`)
      )))
    },
    [apiRoot, primaryType, primaryIdentifier, secondaryType, secondaryIdentifiers]
  )
  const valueListsFetcher = useCallback(
    () => Promise.all([primaryType, secondaryType].map((t) => (
      fetchValue(fetchData<ValueContainer>(`${apiRoot}/sensitivity_distributions/aggregated/${t}?${primaryType}=${primaryIdentifier}`), "items")
    ))),
    [apiRoot, primaryType, primaryIdentifier, secondaryType]
  );
  const valueLists = usePromiseData(valueListsFetcher, null);
  const histogramData = usePromiseData(histogramFetcher, null);
  const [primaryValues, secondaryValues] = valueLists ? valueLists : [[], []]

  const primaryField: Field = {
    label: primaryType + "",
    name: primaryType + "",
    value: primaryIdentifier,
    values: [
      {
        value: null,
        label: `<Select ${primaryType}>`,
      },
      ...primaryValues,
    ],
  }

  const secondaryField: MultiValueField = {
    label: secondaryType + "",
    name: secondaryType + "",
    value: secondaryIdentifiers,
    values: secondaryValues,
  }

  const handlePrimarySelect = useCallback((primaryValue: unknown) => {
    if (primaryType && primaryValue && secondaryType) {
      navigateInPage({
        [primaryType]: primaryValue + "",
        [secondaryType]: secondaryIdentifiers.map(v => v + "")
      })
    }
  }, [primaryType, secondaryType, secondaryIdentifiers])

  const handleSecondarySelect = useCallback((selectedSecondary: unknown[]) => {
    if (primaryIdentifier && secondaryType) {
      navigateInPage({
        [primaryType]: primaryIdentifier,
        [secondaryType]: selectedSecondary.map(v => v + "")
      })
    }
  }, [primaryType, secondaryType, primaryIdentifier]);

  const bucketEdges = [
    0,
    0.002,
    0.004,
    0.008,
    0.016,
    0.032,
    0.064,
    0.125,
    0.25,
    0.5,
    1,
    2,
    4,
    8,
    16,
    32,
    64,
    125,
    250,
    500,
    1000,
  ]
  const allRanges = bucketEdges.map((e, i, arr) => [e, arr[i + 1] || null]);
  const horizontalLabels = allRanges.map(range => range[1] ? `${range[0]} - ${range[1]}` : `${range[0]}+`);
  const usedSecondaryValues = secondaryValues.filter(v => secondaryIdentifiers.includes(v.value + ""));
  const verticalLabels = usedSecondaryValues.map(v => v.label);
  const xLabel = histogramData && histogramData.length > 0 ? `${histogramData[0].type} (${histogramData[0].unit})` : "Waiting for data";
  const yLabel = secondaryType || "Waiting for data";
  const title = primaryIdentifier ? `MIC Distribution for ${primaryIdentifier}` : "Waiting for data";
  const valuesMap = secondaryType && histogramData ? histogramData.reduce<{[x: string]: number}>((acc, hist) => {
    for (const bucket of hist.buckets) {
      acc[`${hist.params[secondaryType]}:${bucket.range[0]}-${bucket.range[1]}`] = bucket.count
    }
    return acc;
  }, {}) : {};
  const values = usedSecondaryValues.map(v => allRanges.map(range => {
    const key = `${v.value}:${range[0]}-${range[1]}`;
    return valuesMap[key] || 0;
  }));

  return (
    <>
      <div className="col-sm-12 col-md-9 col-lg-7">
        <FieldSet><SelectField field={primaryField} onChange={handlePrimarySelect}/></FieldSet>
        <FieldSet><MultiSelectField field={secondaryField} onChange={handleSecondarySelect} /></FieldSet>
        <hr />
      </div>
      {primaryIdentifier && secondaryIdentifiers.length > 0 ? (
        <div className="col-sm-12 text-center">
        </div>
      ) : <div className="col-sm-12 col-md-9 col-lg-7">Make a selection to view bubble plot</div>}
    </>
  )
}
