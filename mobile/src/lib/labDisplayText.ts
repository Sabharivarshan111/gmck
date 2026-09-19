/** Expand report units for readers learning the terminology. */
const UNITS: [string, string][] = [
  ['mL/min/1.73 m²', 'millilitres per minute per 1.73 square metres'],
  ['mL/kg/hr', 'millilitres per kilogram per hour'],
  ['g/dL', 'grams per decilitre'], ['mg/dL', 'milligrams per decilitre'],
  ['µg/dL', 'micrograms per decilitre'], ['ng/dL', 'nanograms per decilitre'],
  ['g/L', 'grams per litre'], ['mg/L', 'milligrams per litre'],
  ['µmol/L', 'micromoles per litre'], ['mmol/L', 'millimoles per litre'],
  ['mEq/L', 'milliequivalents per litre'], ['mOsm/kg', 'milliosmoles per kilogram'],
  ['ng/mL', 'nanograms per millilitre'], ['pg/mL', 'picograms per millilitre'],
  ['µg/mL', 'micrograms per millilitre'], ['µg/dL', 'micrograms per decilitre'],
  ['mIU/L', 'milli-international units per litre'], ['mIU/mL', 'milli-international units per millilitre'],
  ['IU/mL', 'international units per millilitre'], ['U/L', 'units per litre'],
  ['mmHg', 'millimetres of mercury'], ['cm H₂O', 'centimetres of water'],
  ['mm/hr', 'millimetres per hour'], ['mg/day', 'milligrams per day'], ['g/day', 'grams per day'],
  ['mg/g', 'milligrams per gram'], ['fL', 'femtolitres'], ['pg', 'picograms'],
  ['/mm³', ' per cubic millimetre'], ['/min', ' per minute'],
];
export function labDisplayText(text: string): string {
  // Longest first prevents replacing g/dL inside mg/dL.
  let result = text;
  for (const [unit, full] of [...UNITS].sort((a, b) => b[0].length - a[0].length)) {
    result = result.split(unit).join(full);
  }
  return result.replace(/ · /g, '\n');
}
