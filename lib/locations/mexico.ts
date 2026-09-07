export type LocationSuggestion = {
  label: string;
  locality: string | null;
  city: string;
  municipality: string | null;
  state: string;
  stateCode: string;
  countryCode: "MX";
};

export interface LocationAutocompleteProvider {
  search(query: string, limit: number): Promise<LocationSuggestion[]>;
}

export function normalizeMexicoLocation(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const locations: Array<Omit<LocationSuggestion, "locality" | "municipality" | "countryCode">> = [
  { label: "Aguascalientes, Aguascalientes", city: "Aguascalientes", state: "Aguascalientes", stateCode: "AGU" },
  { label: "Mexicali, Baja California", city: "Mexicali", state: "Baja California", stateCode: "BCN" },
  { label: "Tijuana, Baja California", city: "Tijuana", state: "Baja California", stateCode: "BCN" },
  { label: "La Paz, Baja California Sur", city: "La Paz", state: "Baja California Sur", stateCode: "BCS" },
  { label: "Campeche, Campeche", city: "Campeche", state: "Campeche", stateCode: "CAM" },
  { label: "Tuxtla Gutiérrez, Chiapas", city: "Tuxtla Gutiérrez", state: "Chiapas", stateCode: "CHP" },
  { label: "Chihuahua, Chihuahua", city: "Chihuahua", state: "Chihuahua", stateCode: "CHH" },
  { label: "Ciudad de México", city: "Ciudad de México", state: "Ciudad de México", stateCode: "CMX" },
  { label: "Saltillo, Coahuila", city: "Saltillo", state: "Coahuila de Zaragoza", stateCode: "COA" },
  { label: "Colima, Colima", city: "Colima", state: "Colima", stateCode: "COL" },
  { label: "Durango, Durango", city: "Durango", state: "Durango", stateCode: "DUR" },
  { label: "Toluca, Estado de México", city: "Toluca", state: "México", stateCode: "MEX" },
  { label: "León, Guanajuato", city: "León", state: "Guanajuato", stateCode: "GUA" },
  { label: "Acapulco, Guerrero", city: "Acapulco", state: "Guerrero", stateCode: "GRO" },
  { label: "Pachuca, Hidalgo", city: "Pachuca", state: "Hidalgo", stateCode: "HID" },
  { label: "Guadalajara, Jalisco", city: "Guadalajara", state: "Jalisco", stateCode: "JAL" },
  { label: "Puerto Vallarta, Jalisco", city: "Puerto Vallarta", state: "Jalisco", stateCode: "JAL" },
  { label: "Zapopan, Jalisco", city: "Zapopan", state: "Jalisco", stateCode: "JAL" },
  { label: "Morelia, Michoacán", city: "Morelia", state: "Michoacán de Ocampo", stateCode: "MIC" },
  { label: "Cuernavaca, Morelos", city: "Cuernavaca", state: "Morelos", stateCode: "MOR" },
  { label: "Tepic, Nayarit", city: "Tepic", state: "Nayarit", stateCode: "NAY" },
  { label: "Monterrey, Nuevo León", city: "Monterrey", state: "Nuevo León", stateCode: "NLE" },
  { label: "Oaxaca, Oaxaca", city: "Oaxaca de Juárez", state: "Oaxaca", stateCode: "OAX" },
  { label: "Puebla, Puebla", city: "Puebla", state: "Puebla", stateCode: "PUE" },
  { label: "Querétaro, Querétaro", city: "Querétaro", state: "Querétaro", stateCode: "QUE" },
  { label: "Cancún, Quintana Roo", city: "Cancún", state: "Quintana Roo", stateCode: "ROO" },
  { label: "Playa del Carmen, Quintana Roo", city: "Playa del Carmen", state: "Quintana Roo", stateCode: "ROO" },
  { label: "San Luis Potosí, San Luis Potosí", city: "San Luis Potosí", state: "San Luis Potosí", stateCode: "SLP" },
  { label: "Culiacán, Sinaloa", city: "Culiacán", state: "Sinaloa", stateCode: "SIN" },
  { label: "Hermosillo, Sonora", city: "Hermosillo", state: "Sonora", stateCode: "SON" },
  { label: "Villahermosa, Tabasco", city: "Villahermosa", state: "Tabasco", stateCode: "TAB" },
  { label: "Tampico, Tamaulipas", city: "Tampico", state: "Tamaulipas", stateCode: "TAM" },
  { label: "Tlaxcala, Tlaxcala", city: "Tlaxcala", state: "Tlaxcala", stateCode: "TLA" },
  { label: "Veracruz, Veracruz", city: "Veracruz", state: "Veracruz de Ignacio de la Llave", stateCode: "VER" },
  { label: "Mérida, Yucatán", city: "Mérida", state: "Yucatán", stateCode: "YUC" },
  { label: "Zacatecas, Zacatecas", city: "Zacatecas", state: "Zacatecas", stateCode: "ZAC" },
];

export const mexicoLocationDataset: LocationSuggestion[] = locations.map((location) => ({
  ...location,
  locality: null,
  municipality: null,
  countryCode: "MX",
}));
