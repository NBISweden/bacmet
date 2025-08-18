'use client'
import {useEffect, useState} from "react";
import {useConfig} from "../../contexts/config";

type FieldValue<T=unknown> = {
  value: T;
  label: string;
}

type Field<T=unknown> = {
  label: string;
  name: string;
  value: T;
  values: FieldValue<T>[];
}

type SearchParams = {
  chemicalClasses: FieldValue<string>[];
  compounds: FieldValue<string>[];
}

const SelectField = ({field}: {field: Field<unknown>}) => {
  return (
    <fieldset className="form-group pt-3 pb-2">
      <label className="form-label" htmlFor={field.name}>{ field.label }:</label>
      <select className="form-control" name={field.name} id={field.name} defaultValue={field.value + ""}>
        {field.values.map(value => (
          <option key={value.value + ""} value={value.value + ""}>{value.label}</option>
        ))}
      </select>
    </fieldset>
  )
}

export default function Search() {
  const {apiRoot} = useConfig();
  const [params, setParams] = useState<SearchParams>({
    chemicalClasses: [],
    compounds: [],
  })
  const database: Field<string> = {
    label: "Database",
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
  const chemicalClass: Field<string> = {
    label: "Chemical Class",
    name: "chemical_class",
    value: params.chemicalClasses[0]?.value,
    values: params.chemicalClasses
  }
  const compound: Field<string> = {
    label: "Compound",
    name: "compound",
    value: params.compounds[0]?.value,
    values: params.compounds
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
          <fieldset className="form-group pt-3 pb-2">
            <legend>{ database.label }:</legend>
            {database.values.map(value => (
              <div key={value.value} className="form-check form-check-inline">
                <input className="form-check-input" type="radio" name={database.name} defaultChecked={value.value==database.value} 
                  value={value.value} id={`${database.name}.${value.value}`} />
                <label className="form-check-label" htmlFor={`${database.name}.${value.value}`}>{ value.label }</label>
              </div>
            ))}
          </fieldset>
          <SelectField field={chemicalClass}/>
          <SelectField field={compound}/>
        </form>
      </div>
    </div>
  );
}
