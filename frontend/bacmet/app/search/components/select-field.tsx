import {useId, useState, useCallback, ChangeEventHandler} from "react";
import {Field} from "../types";

export const SelectField = ({field, onChange}: {field: Field<unknown>, onChange?: (v: unknown) => void}) => {
  const [current, setCurrent] = useState<unknown>(field.value);
  const fieldId = useId();
  const handleChange = useCallback<ChangeEventHandler<HTMLSelectElement>>((event) => {
    const value = event.target.value;
    setCurrent(value)
    if (onChange) {
      onChange(value);
    }
  }, [setCurrent, onChange])
  return (
    <>
      <label className="form-label" htmlFor={fieldId}>{ field.label }:</label>
      <select className="form-control" name={field.name} id={fieldId} value={current + ""} onChange={handleChange}>
        {field.values.map(value => (
          <option key={value.value + ""} value={value.value + ""}>{value.label}</option>
        ))}
      </select>
    </>
  )
}
