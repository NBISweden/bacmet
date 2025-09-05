"use client"
import { useState, useCallback, useId, ChangeEventHandler, useMemo } from "react";
import { MultiValueField } from "../../search/types";

export const MultiSelectField = ({field, onChange}: {field: MultiValueField<unknown>, onChange?: (value: unknown[]) => void}) => {
  const fieldId = useId();
  const [current, setCurrent] = useState<unknown[]>(field.value);
  const usedValue = useMemo(() => onChange ? field.value : current, [onChange, field.value, current])
  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>((event) => {
    const singleValue: unknown  = event.target.value;
    if (singleValue !== undefined) {
      const nextValue = (
        usedValue.includes(singleValue)
        ? usedValue.filter(v => v !== singleValue)
        : [...usedValue, singleValue]
      );
      if (onChange) {
        onChange(nextValue);
      } else {
        setCurrent(nextValue);
      }
    }
  }, [usedValue, setCurrent, onChange]);

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
              checked={usedValue.includes(value.value)} 
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
