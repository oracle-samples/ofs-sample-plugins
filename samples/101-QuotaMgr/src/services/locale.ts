// Define a type that is a dictionary of strings
type Locale = {
    [key: string]: string;
};

export enum Language {
    en = "en",
    es = "es",
}

// Define a map of locales
type Dictionary = {
    [key in Language]: Locale;
};

// Define an enumerated type of fixed strings "en" and "es"

const dictionaries: Dictionary = {
    en: {
        appname: "Capacity Monitoring",
        "Quota Information": "Quota Information",
        "Area Name": "Area Name",
        Date: "Date",
        Timeslot: "Timeslot",
        Category: "Category",
        Ocupation: "Ocupation",
        Duration: "Duration",
        Open: "Open",
        Close: "Close",
        "Refresh Quota": "Refresh Quota",
        "Export Data": "Export Data",
        "Warning and Critical Thresholds": "Warning and Critical Thresholds",
        "Filter Closed": "Filter Closed",
        "Date Range": "Date Range",
        "Visible Range": "Visible Range",
        "Warning Range": "Warning Range",
        Yes: "Yes",
        No: "No",
    },
    es: {
        appname: "Monitor de Capacidad",
        "Quota Information": "Información de Cuota",
        "Area Name": "Área",
        Date: "Fecha",
        Timeslot: "Franja Horaria",
        Category: "Categoría",
        Ocupation: "Ocupación",
        Duration: "Duración",
        Open: "Abierto",
        Close: "Cerrar",
        "Refresh Quota": "Actualizar Cuota",
        "Export Data": "Exportar Datos",
        "Warning and Critical Thresholds": "Umbral de Aviso y Crítico",
        "Filter Closed": "Filtrar Cerrados",
        "Date Range": "Rango de Fechas",
        "Visible Range": "Rango Visible",
        "Warning Range": "Rango de Aviso",
        Yes: "Sí",
        No: "No",
    },
};

// Define a function that returns the locale translation of a given key
export const getDictionaryEntry = (
    locale: keyof typeof dictionaries,
    key: string
): string => {
    return dictionaries[locale][key];
};

export class LocaleProvider {
    private _language: keyof typeof dictionaries;

    constructor(language: keyof typeof dictionaries) {
        this._language = language;
    }

    get language(): keyof typeof dictionaries {
        return this._language;
    }

    public getLocale(
        key: string | number,
        language: Language = this._language
    ): string {
        let response = getDictionaryEntry(language, key.toString());
        if (response === undefined) {
            response = key.toString().toLocaleUpperCase();
        }
        return response;
    }

    static getDictionary(language: Language): Locale {
        return dictionaries[language];
    }
}
