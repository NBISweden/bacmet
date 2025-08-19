'use client'
import {useEffect, useState, useId} from "react";
import {useConfig} from "../../contexts/config";

type FieldValue<T=unknown> = {
  value: T;
  label: string;
}

type Field<T=unknown> = {
  label: string;
  name: string;
  value?: T;
  values: FieldValue<T>[];
  placeholder?: string;
}

type SearchParams = {
  chemicalClasses: FieldValue<string>[];
  compounds: FieldValue<string>[];
}

const SelectField = ({field}: {field: Field<unknown>,}) => {
  const fieldId = useId();
  return (
    <>
      <label className="form-label" htmlFor={fieldId}>{ field.label }:</label>
      <select className="form-control" name={field.name} id={fieldId} defaultValue={field.value + ""}>
        {field.values.map(value => (
          <option key={value.value + ""} value={value.value + ""}>{value.label}</option>
        ))}
      </select>
    </>
  )
}

const RadioSelectField = ({field}: {field: Field<unknown>}) => {
  const fieldId = useId();
  return (
    <>
      <legend>{ field.label }:</legend>
      {field.values.map(value => {
        const valueId = `${fieldId}-${value.value}`;
        return (
          <div key={value.value + ""} className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name={field.name}
              defaultChecked={value.value==field.value} 
              value={value.value + ""}
              id={valueId}
              />
            <label
              className="form-check-label"
              htmlFor={valueId}
            >{ value.label }</label>
          </div>
        )
      })}
    </>
  )
}

const TextField = ({field}: {field: Field<unknown>}) => {
  const fieldId = useId();
  return (
    <>
      <label className="form-label" htmlFor={fieldId}>{field.label}:</label>
      <input
        className="form-control"
        type="text"
        name={field.name}
        defaultValue={field.value !== undefined ? field.value + "" : undefined}
        id={fieldId}
        placeholder={field.placeholder}
      />
    </>
  )
}

const FieldSet = ({children}: {children: React.ReactNode}) => {
  return (
    <fieldset className="form-group pt-3 pb-2">{children}</fieldset>
  )
}

export default function Search() {
  const {apiRoot} = useConfig();
  const [params, setParams] = useState<SearchParams>({
    chemicalClasses: [],
    compounds: [],
  })
  const database: Field<string> = {
    label: "Select database",
    name: "database",
    value: "validated",
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
    value: "any",
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
    value: params.chemicalClasses[0]?.value,
    values: [
      ...params.chemicalClasses,
      ...params.compounds
    ]
  }
  const proteinDescription: Field = {
    label: "Protein description contains text",
    name: "protein_description",
    placeholder: "example: resistance",
    values: []
  }
  const peptideSequenceLengthMin: Field = {
    label: "Peptide sequence length greater than",
    name: "peptide_sequence_length_min",
    placeholder: "50",
    values: [],
  }
  const peptideSequenceLengthMax: Field = {
    label: "Peptide sequence length less than",
    name: "peptide_sequence_length_max",
    placeholder: "2000",
    values: [],
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
  return (
    <div className="row justify-content-center pt-3 pb-3">
      <div className="col-sm-12 col-md-9 col-lg-7">
        <h1>Advanced search</h1>
        <p>Lorem ipsum dolor sit amet, vince adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
          aliqua. Utenim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute
          irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
        <form>
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
        </form>
      </div>
    </div>
  );
}
