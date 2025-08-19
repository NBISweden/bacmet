'use client'
import {useCallback, useEffect, useState, FormEventHandler, Suspense} from "react";
import {useConfig} from "../../contexts/config";
import {useSearchParams, useRouter, usePathname} from "next/navigation";
import {SearchParams, ValidatedResult, PredictedResult, ErrorResult, Field, Link} from "./types";
import {FieldSet} from "./components/fieldset";
import {Pagination} from "./components/pagination";
import {RadioSelectField} from "./components/radio-select-field";
import {SelectField} from "./components/select-field";
import {TextField} from "./components/text-field";

const SearchBase = (
  {values}: {
    values: {
      [x: string]: string | null
    }
  }
) => {
  const {apiRoot} = useConfig();
  const [
    selectedPage,
    selectedDatabase,
    selectedLocation,
    selectedChemicalClass,
    selectedProteinDescription,
    selectedPeptideSequenceLengthMin,
    selectedPeptideSequenceLengthMax,
  ] = [
    "page",
    "database",
    "location",
    "chemical_class",
    "protein_description",
    "peptide_sequence_length_min",
    "peptide_sequence_length_max",
  ].map(key => values[key] === undefined ? null : values[key]);
  const [params, setParams] = useState<SearchParams>({
    chemicalClasses: [],
    compounds: [],
  });
  const [result, setResult] = useState<ValidatedResult | PredictedResult | ErrorResult | undefined>(undefined);
  const database: Field<string> = {
    label: "Select database",
    name: "database",
    value: selectedDatabase || "validated",
    values: [
      {
        label: "Validated",
        value: "validated"
      },
      {
        label: "Predicted",
        value: "predicted"
      }
    ]
  }
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
  const chemicalClassOrCompound: Field<string> = {
    label: "Select 'chemical class' / 'compound' (resistant to)",
    name: "chemical_class",
    value: selectedChemicalClass || "",
    values: [
      {
        value: "",
        label: "Any",
      },
      ...params.chemicalClasses,
      ...params.compounds
    ]
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

  const router = useRouter()
  const pathname = usePathname()

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
    if (
      selectedDatabase !== null &&
      selectedLocation !== null &&
      selectedChemicalClass !== null &&
      selectedProteinDescription !== null &&
      selectedPeptideSequenceLengthMin !== null &&
      selectedPeptideSequenceLengthMax !== null
    ) {
      const fetchResult = async () => {
        const url = new URL(`${apiRoot}/search/${selectedDatabase}`);
        url.search = (new URLSearchParams({
          page: selectedPage || "0",
          location: selectedLocation,
          chemical_class: selectedChemicalClass,
          protein_description: selectedProteinDescription,
          peptide_sequence_length_min: selectedPeptideSequenceLengthMin,
          peptide_sequence_length_max: selectedPeptideSequenceLengthMax,
        })).toString();
        try {
          const resultData = await (await fetch(url.toString())).json();
          setResult({type: selectedDatabase, ...resultData});
        } catch (e) {
          console.warn(e);
          setResult({type: "error", error: `Failed to get data from the backend: ${e}`})
        }
      }
      fetchResult()
    }
  }, [
    selectedPage,
    selectedDatabase,
    selectedLocation,
    selectedChemicalClass,
    selectedProteinDescription,
    selectedPeptideSequenceLengthMin,
    selectedPeptideSequenceLengthMax,
    setResult,
    apiRoot
  ]);

  const handlePageNavigation = useCallback((page: Link) => {
    if (selectedDatabase !== null) {
      const url = new URL(page.href);
      const params = url.searchParams;
      params.set("database", selectedDatabase);
      router.push(pathname + '?' + params.toString());
    }
  }, [selectedDatabase, setResult, pathname, router])

  const handleSubmit: FormEventHandler = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    const target = (event.target as unknown as {[id: string]: {type: string, checked: boolean, value: string | number}});
    const values = [
      "page",
      "database",
      "location",
      "chemical_class",
      "protein_description",
      "peptide_sequence_length_min",
      "peptide_sequence_length_max",
    ].reduce<{[x: string]: string}>((acc, fieldName) => {
        const selectedTarget = target[fieldName];
        const value = selectedTarget.type === "checkbox" ? !!selectedTarget.checked : selectedTarget.value;
        acc[fieldName] = `${value}`;
        return acc;
    }, {});
    const params = new URLSearchParams(values);
    router.push(pathname + '?' + params.toString());
  }, [
    router,
    pathname,
  ]);
  const allPages = (result && "_links" in result ? result._links : []);
  const currentPageHref = allPages.filter(l => l.rel === "self")[0]?.href;
  const pages = allPages.filter(link => !["self", "next", "prev"].includes(link.rel))
  return (
    <div className="row justify-content-center pt-3 pb-3">
      <div className="col-sm-12 col-md-9 col-lg-7">
        <h1>Advanced search</h1>
        <p>Lorem ipsum dolor sit amet, vince adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
          aliqua. Utenim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute
          irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="page" value="0" />
          <FieldSet><RadioSelectField field={database}/></FieldSet>
          <FieldSet><SelectField field={chemicalClassOrCompound}/></FieldSet>
          <FieldSet><TextField field={proteinDescription}/></FieldSet>
          <FieldSet>
            <RadioSelectField field={location}/>
            <div className="form-text">For experimentally confirmed database only.</div>
          </FieldSet>
          <FieldSet>
            <TextField field={peptideSequenceLengthMin}/>
            <div className="form-text">For experimentally confirmed database only.</div>
            <TextField field={peptideSequenceLengthMax}/>
            <div className="form-text">For experimentally confirmed database only.</div>
          </FieldSet>
          <div className="pt-3 pb-2">
            <input className="btn btn-primary" type="submit" value="Search" />
          </div>
        </form>

        {result ? (
          <>
            <hr/>
            <Pagination pages={pages} currentPage={currentPageHref} onNavigate={handlePageNavigation}/>
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
                              <table className="table">
                                <tbody>
                                  <tr><th scope="row">BacMet ID:</th><td>{ item.bacmet_id }</td></tr>
                                  <tr><th scope="row">Code for:</th><td>{ item.code_for }</td></tr>
                                  <tr><th scope="row">Family:</th><td>{ item.family }</td></tr>
                                  <tr><th scope="row">Sequence:</th><td>...</td></tr>
                                  <tr><th scope="row">Cross-database information:</th><td>...</td></tr>
                                  <tr><th scope="row">Organism:</th><td><em>{ item.organism }</em></td></tr>
                                  <tr><th scope="row">Location:</th><td>{ item.location }</td></tr>
                                  <tr><th scope="row">Compound:</th><td>{item.compounds.map(c => c.compound_name).join(", ")}</td></tr>
                                  <tr><th scope="row">Description:</th><td>{ item.description }</td></tr>
                                  <tr><th scope="row">Length (amino acid):</th><td>{ item.length_aa }</td></tr>
                                  <tr><th scope="row">Reference:</th><td>{ item.reference }</td></tr>
                                </tbody>
                              </table>
                            </td>
                            <td>...</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                }
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
                          <th scope="col">Compound</th>
                          <th scope="col">NCBI annotation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.items.map((item, index) => (
                          <tr key={index}>
                            <td>{ item.gene_name }</td>
                            <td><a href={`http://www.ncbi.nlm.nih.gov/protein/${item.protein_accession_uniprot}`} target="_blank">{ item.protein_accession_uniprot }</a></td>
                            <td>...</td>
                            <td><a href={`http://www.ncbi.nlm.nih.gov/protein/${item.protein_accession_uniprot}?report=fasta`} target="_blank">FASTA</a></td>
                            <td>{ item.organism }</td>
                            <td>{item.compounds.map(c => c.compound_name).join(", ")}</td>
                            <td>...</td>
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
            <Pagination pages={pages} currentPage={currentPageHref} onNavigate={handlePageNavigation}/>
          </>
        ) : <></>}
      </div>
    </div>
  );
}


const SearchWithSearchParams = () => {
  const searchParams = useSearchParams();
  const values = [
    "page",
    "database",
    "location",
    "chemical_class",
    "protein_description",
    "peptide_sequence_length_min",
    "peptide_sequence_length_max",
  ].reduce<{[x: string]: string | null}>((acc, key) => {
    acc[key] = searchParams.get(key)
    return acc;
  }, {});
  return <SearchBase values={values} />
}


export default function Search() {
  return (
    <Suspense fallback={<SearchBase values={{}}/>}>
      <SearchWithSearchParams />
    </Suspense>
  )
}
