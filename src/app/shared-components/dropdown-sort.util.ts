/** Sorts a dropdown's options A→Z, by `optionLabel` field when given (object options),
 *  or by the raw value itself (plain string/number array). Never mutates the input array. */
export function sortOptions(options: any[], optionLabel?: string): any[] {
  if (!options || options.length <= 1) {
    return options || [];
  }
  const getLabel = (option: any): string => {
    const label = optionLabel ? option?.[optionLabel] : option;
    return label === null || label === undefined ? '' : String(label);
  };
  return [...options].sort((a, b) =>
    getLabel(a).localeCompare(getLabel(b), undefined, { sensitivity: 'base', numeric: true }),
  );
}
