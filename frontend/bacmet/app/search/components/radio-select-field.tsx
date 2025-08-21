import {useId} from "react";
import {Field} from "../types";

export const RadioSelectField = ({field}: {field: Field<unknown>}) => {
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
