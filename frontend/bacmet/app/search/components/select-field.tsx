import {useId} from "react";
import {Field} from "../types";

export const SelectField = ({field}: {field: Field<unknown>,}) => {
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
