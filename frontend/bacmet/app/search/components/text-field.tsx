import {useId} from "react";
import {Field} from "../types";

export const TextField = ({field, onChange}: {field: Field<unknown>, onChange?: React.ChangeEventHandler<HTMLInputElement>}) => {
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
        onChange={onChange}
      />
    </>
  )
}
