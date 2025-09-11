'use client'
import {useCallback, useEffect, useState, FormEventHandler, Suspense} from "react";
import {useConfig} from "../../contexts/config";
import {useSearchParams} from "next/navigation";
import {SearchParams, ValidatedResult, ErrorResult, Field, MultiValueField, Link} from "./types";
import {FieldSet} from "./components/fieldset";
import {Pagination} from "./components/pagination";
import {RadioSelectField} from "./components/radio-select-field";
import {TextField} from "./components/text-field";
import {MultiSelectField} from "./components/multi-select-field/multi-select-field";
import {default as NextLink} from 'next/link'
import ValidatedEntry from "./components/validated-entry";
import {navigateInPage} from "../utils";

type SingleValueFields = {
  page: string,
  location: string,
  protein_description: string,
  peptide_sequence_length_min: string,
  peptide_sequence_length_max: string,
  free_text: string,
}

type MultiValueFields = {
  chemical_class: string[],
  compound: string[],
}

type SearchFields = SingleValueFields & MultiValueFields;

const singleValueFieldIds: (keyof SingleValueFields)[] = [
  "page",
  "location",
  "protein_description",
  "peptide_sequence_length_min",
  "peptide_sequence_length_max",
  "free_text"
]

const multiValueFieldIds: (keyof MultiValueFields)[] = [
  "chemical_class",
  "compound",
]

const SearchBase = (
  {values}: {
    values: Partial<SearchFields>
  }
) => {
  const {apiRoot} = useConfig();
  const {
    page: selectedPage,
    location: selectedLocation,
    protein_description: selectedProteinDescription,
    peptide_sequence_length_min: selectedPeptideSequenceLengthMin,
    peptide_sequence_length_max: selectedPeptideSequenceLengthMax,
    free_text: selectedFreeText,
    chemical_class: selectedChemicalClasses,
    compound: selectedCompounds,
 } = values;
  const [params, setParams] = useState<SearchParams>({
    chemicalClasses: [],
    compounds: [],
  });
  const [result, setResult] = useState<ValidatedResult | ErrorResult | undefined>(undefined);
  const location: Field<string> = {
    label: "Select location",
    name: "location",
    value: selectedLocation || "any",
    values: [
      {
        value: "any",
        label: "Any"
      },
      {
        value: "chromosome",
        label: "Chromosome"
      },
      {
        value: "plasmid",
        label: "Plasmid"
      }
    ]
  }
  const chemicalClass: MultiValueField<string> = {
    label: "Select chemical class (resistant to) (max. 10 selections)",
    name: "chemical_class",
    value: selectedChemicalClasses || [],
    values: params.chemicalClasses,
  }
  const compound: MultiValueField<string> = {
    label: "Select compound (resistant to) (max. 10 selections)",
    name: "compound",
    value: selectedCompounds || [],
    values: params.compounds
  }
  const proteinDescription: Field = {
    label: "Protein description contains text",
    name: "protein_description",
    value: selectedProteinDescription || undefined,
    placeholder: "example: resistance",
    values: []
  }
  const peptideSequenceLengthMin: Field = {
    label: "Peptide sequence length greater than",
    name: "peptide_sequence_length_min",
    value: selectedPeptideSequenceLengthMin || undefined,
    placeholder: "50",
    values: [],
  }
  const peptideSequenceLengthMax: Field = {
    label: "Peptide sequence length less than",
    name: "peptide_sequence_length_max",
    value: selectedPeptideSequenceLengthMax || undefined,
    placeholder: "2000",
    values: [],
  }
  const freeText: Field = {
    label: "Free text search",
    name: "free_text",
    value: selectedFreeText || undefined,
    placeholder: "gene name, compound name, chemical class",
    values: []
  }

  useEffect(() => {
    const fetchData = async () => {
      const [
        chemicalClassData,
        compoundData,
      ] = await Promise.all([
        (await fetch(`${apiRoot}/aggregated/chemical_class`)).json(),
        (await fetch(`${apiRoot}/aggregated/compound`)).json()
      ]);
      setParams((p) => {
        return {
          ...p,
          chemicalClasses: chemicalClassData.items,
          compounds: compoundData.items,
        }
      })
    }
    fetchData();
  }, [apiRoot, setParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedPage) params.append("page", selectedPage || "0");
    if (selectedLocation) params.append("location", selectedLocation);
    if (selectedChemicalClasses) selectedChemicalClasses.forEach(cc => params.append("chemical_class", cc));
    if (selectedCompounds) selectedCompounds.forEach(c => params.append("compound", c));
    if (selectedProteinDescription) params.append("protein_description", selectedProteinDescription);
    if (selectedPeptideSequenceLengthMin) params.append("peptide_sequence_length_min", selectedPeptideSequenceLengthMin);
    if (selectedPeptideSequenceLengthMax) params.append("peptide_sequence_length_max", selectedPeptideSequenceLengthMax);
    if (selectedFreeText) params.append("free_text", selectedFreeText);

    if (params.size > 0) {
      const fetchResult = async () => {
        try {
          const response = await fetch(`${apiRoot}/search/validated?${params.toString()}`);
          const resultData = await response.json();
          setResult({ type: "validated", ...resultData });
        } catch (e) {
          console.warn(e);
          setResult({ type: "error", error: `Failed to get data from the backend: ${e}` });
        }
      };
      fetchResult();
    }
  }, [
    selectedPage,
    selectedLocation,
    selectedChemicalClasses,
    selectedCompounds,
    selectedProteinDescription,
    selectedPeptideSequenceLengthMin,
    selectedPeptideSequenceLengthMax,
    selectedFreeText,
    setResult,
    apiRoot,
  ]);

  const handlePageNavigation = useCallback((page: Link) => {
      const url = new URL(page.href);
      const params = url.searchParams;
      navigateInPage(params);
  }, [])

  const handleSubmit: FormEventHandler = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    const target = (event.target as unknown as Record<keyof SingleValueFields, {type: string, checked: boolean, value: string | number}>);
    const singleValues = singleValueFieldIds.reduce<Partial<SearchFields>>((acc, fieldName) => {
        const selectedTarget = target[fieldName];
        const value = selectedTarget.type === "checkbox" ? !!selectedTarget.checked : selectedTarget.value;
        acc[fieldName] = `${value}`;
        return acc;
    }, {});
    const multiTarget = (event.target as unknown as Record<keyof MultiValueFields, Record<number, {checked: boolean, value: string}>>);
    const multiValues = multiValueFieldIds.reduce<Partial<SearchFields>>((acc, fieldName) => {
        const selectedTarget = multiTarget[fieldName];
        acc[fieldName] = Object.values(selectedTarget).filter(t => t.checked).map(t => t.value)
        return acc;
    }, {})
    navigateInPage({...singleValues, ...multiValues});
  }, []);
  const allPages = (result && "_links" in result ? result._links : []);
  const pageCount = (result && "_meta" in result ? result._meta.totalPages : undefined);
  const currentPageHref = allPages.filter(l => l.rel === "self")[0]?.href;
  const pages = allPages.filter(link => !["self", "next", "prev"].includes(link.rel))
  return (
    <div className="row justify-content-center pt-3 pb-3">
      <div className="col-sm-12 col-md-9 col-lg-7">
        <h1 className="text-center">Search</h1>
        <p>Lorem ipsum dolor sit amet, vince adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
          aliqua. Utenim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute
          irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="page" value="0" />
          <FieldSet><TextField field={freeText}/></FieldSet>
          <FieldSet>
            <MultiSelectField field={chemicalClass} maxSelections={10} filterText="Filter chemical class options"/>
            <MultiSelectField field={compound} maxSelections={10} filterText="Filter compound options"/>
          </FieldSet>
          <FieldSet><TextField field={proteinDescription}/></FieldSet>
          <FieldSet>
            <RadioSelectField field={location}/>
          </FieldSet>
          <FieldSet>
            <TextField field={peptideSequenceLengthMin}/>
            <TextField field={peptideSequenceLengthMax}/>
          </FieldSet>
          <div className="pt-3 pb-2">
            <input className="btn btn-primary" type="submit" value="Search" />
          </div>
        </form>

        {result ? (
          <>
            <hr/>
            <Pagination pages={pages} currentPage={currentPageHref} pageCount={pageCount} onNavigate={handlePageNavigation}/>
            <hr/>
            {result.type === "validated" ? `Viewing ${result._meta.count} of ${result._meta.totalRecords}` : <></>}
            {(() => {
              switch(result.type) {
                case "validated": {
                  return (
                    <table className="table">
                      <thead>
                        <tr>
                          <th scope="col">Gene Name</th>
                          <th scope="col">Experimentally Verified Resistance Gene Information</th>
                          <th scope="col">Predicted Resistance Gene Information</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.items.map((item, index) => (
                          <tr key={index}>
                            <td>{ item.gene_name }</td>
                            <td>
                              <ValidatedEntry entry={item}/>
                            </td>
                            <td><NextLink href={`/search/entry/?entry_id=${item.bacmet_id}`}>View entries</NextLink></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                }
                case "error": {
                  return (
                    <div>{result.error}</div>
                  )
                }
              }
            })()}
            <Pagination pages={pages} currentPage={currentPageHref} pageCount={pageCount} onNavigate={handlePageNavigation}/>
          </>
        ) : <></>}
      </div>
    </div>
  );
}


const SearchWithSearchParams = () => {
  const searchParams = useSearchParams();
  const singleValues = singleValueFieldIds.reduce<Partial<SearchFields>>((acc, key) => {
    const value = searchParams.get(key);
    if (value) {
      acc[key] = value;
    }
    return acc;
  }, {});
  const multiValues = multiValueFieldIds.reduce<Partial<SearchFields>>((acc, key) => {
    const value = searchParams.getAll(key);
    if (value.length > 0) {
      acc[key] = value;
    }
    return acc;
  }, {});
  return <SearchBase values={{...singleValues, ...multiValues}} />
}


export default function Search() {
  return (
    <Suspense fallback={<SearchBase values={{}}/>}>
      <SearchWithSearchParams />
    </Suspense>
  )
}
