import styles from "./multi-select-field.module.css";
import { useState, useCallback, useId, ChangeEventHandler, MouseEventHandler, useMemo } from "react";
import { MultiValueField } from "../../types";

export const MultiSelectField = ({field, onChange, filterText}: {field: MultiValueField<unknown>, onChange?: (value: unknown[]) => void, filterText?: string}) => {
  const fieldId = useId();
  const [filterValue, setFilterValue] = useState<string | undefined>();
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

  const handleFilter = useCallback<ChangeEventHandler<HTMLInputElement>>((event) => {
    const v = event.target.value;
    setFilterValue(v);
  }, [setFilterValue]);

  const filteredValues = useMemo(() => (
    filterValue ? field.values.filter(v => v.label.toLowerCase().includes(filterValue.toLowerCase())) : field.values
  ), [field.values, filterValue]);
  const allFilteredSelected = usedValue.length === new Set([...usedValue, ...filteredValues.map(v => v.value)]).size

  const handleToggleAll = useCallback<MouseEventHandler<HTMLButtonElement>>(() => {
    const usedValueSet = new Set(usedValue);
    const filteredValuesSet = new Set(filteredValues.map(v => v.value));
    const allFilteredSelected = usedValueSet.union(filteredValuesSet).size === usedValueSet.size;
    const nextValue = allFilteredSelected
      ? Array.from(usedValueSet.difference(filteredValuesSet))
      : Array.from(usedValueSet.union(filteredValuesSet));
    if (onChange) {
        onChange(nextValue);
      } else {
        setCurrent(nextValue);
      }
  }, [filteredValues, usedValue, setCurrent, onChange, allFilteredSelected]);

  return (
    <>
      <legend>{ field.label }:</legend>
      {field.values.length ? (
        <div className="input-group mb-3">
          <input type="text" className="form-control" onChange={handleFilter} placeholder={filterText} aria-label={filterText}/>
          <button className="btn btn-outline-secondary" type="button" onClick={handleToggleAll}>Toggle all</button>
        </div>
      ) : <></>}
      <div className={`row mb-3 px-3 ${styles.multiSelectBody}`}>
      {filteredValues.map(value => {
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
