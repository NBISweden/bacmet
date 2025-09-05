"use client"
import { useState, useCallback, useId, ChangeEventHandler } from "react";
import { MultiValueField } from "../../search/types";

export const MultiSelectField = ({field, onChange}: {field: MultiValueField<unknown>, onChange?: (value: unknown[]) => void}) => {
  const fieldId = useId();
  const [current, setCurrent] = useState<unknown[]>(field.value);
  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>((event) => {
    const singleValue: unknown  = event.target.value;
    if (singleValue !== undefined) {
      const nextCurrent = (
        current.includes(singleValue)
        ? current.filter(v => v !== singleValue)
        : [...current, singleValue]
      );
      setCurrent(nextCurrent);
      if (onChange) {
        onChange(nextCurrent);
      }
    }
  }, [current, setCurrent, onChange]);

  return (
    <>
      <legend>{ field.label }:</legend>
      <div className="row mb-3 px-3">
      {field.values.map(value => {
        const valueId = `${fieldId}-${value.value}`;
        return (
          <div key={value.value + ""} className="form-check col-md-4">
            <input
              className="form-check-input"
              type="checkbox"
              name={field.name}
              onChange={handleChange}
              checked={current.includes(value.value)} 
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
      </div>
    </>
  )
}
