import styles from "./multi-select-field.module.css";
import { useState, useCallback, useId, ChangeEventHandler, MouseEventHandler, useMemo } from "react";
import { MultiValueField } from "../../types";

export const MultiSelectField = ({field, onChange, filterText, maxSelections}: {field: MultiValueField<unknown>, onChange?: (value: unknown[]) => void, maxSelections?: number, filterText?: string}) => {
  const fieldId = useId();
  const filterCheckedId = useId();
  const [filterValue, setFilterValue] = useState<string | undefined>();
  const [filterChecked, setFilterChecked] = useState<boolean>(false);
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
      const limitedNextValue = maxSelections ? nextValue.slice(0, Math.max(0, maxSelections)) : nextValue
      if (onChange) {
        onChange(limitedNextValue);
      } else {
        setCurrent(limitedNextValue);
      }
    }
  }, [maxSelections, usedValue, setCurrent, onChange]);

  const handleFilter = useCallback<ChangeEventHandler<HTMLInputElement>>((event) => {
    const v = event.target.value;
    setFilterValue(v);
  }, [setFilterValue]);

  const handleFilterChecked = useCallback<ChangeEventHandler<HTMLInputElement>>((event) => {
    const v = event.target.checked;
    setFilterChecked(v);
  }, [setFilterChecked]);

  const filteredValues = useMemo(() => {
    const textFiltered = filterValue ? field.values.filter(v => v.label.toLowerCase().includes(filterValue.toLowerCase())) : field.values;
    const checkedFiltered = filterChecked ? textFiltered.filter(v => usedValue.includes(v.value)) : textFiltered;
    return checkedFiltered;
  }, [field.values, usedValue, filterValue, filterChecked]);

  const handleToggleAll = useCallback<MouseEventHandler<HTMLButtonElement>>(() => {
    const usedValueSet = new Set(usedValue);
    const filteredValuesSet = new Set(filteredValues.map(v => v.value));
    const updatedValueSet = filteredValuesSet.difference(usedValueSet);
    const allFilteredSelected = updatedValueSet.size === 0;
    const limitedValueSet = maxSelections === undefined
      ? updatedValueSet
      : new Set(Array.from(updatedValueSet).slice(0, Math.max(0, maxSelections - usedValue.length)))
    const nextValue = allFilteredSelected
      ? Array.from(usedValueSet.difference(filteredValuesSet))
      : Array.from(usedValueSet.union(limitedValueSet));
    if (onChange) {
        onChange(nextValue);
      } else {
        setCurrent(nextValue);
      }
  }, [maxSelections, filteredValues, usedValue, setCurrent, onChange]);

  return (
    <>
      <legend>{ field.label }:</legend>
      {field.values.length ? (
        <div className="input-group mb-3">
          <input type="text" className="form-control" onChange={handleFilter} placeholder={filterText} aria-label={filterText}/>
          <div className="input-group-text">
            <div className="form-check col-md-4">
              <input
                className="form-check-input"
                type="checkbox"
                onChange={handleFilterChecked}
                checked={filterChecked} 
                value="filter-checked"
                id={filterCheckedId}
                />
              <label className="form-check-label" htmlFor={filterCheckedId}>Checked only</label>
            </div>
          </div>
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
