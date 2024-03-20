import { describe, expect, test } from "@jest/globals";
import { LocaleProvider, Language } from "../src/services/locale"; // Import the Language type

describe("sum module", () => {
    test("Get Locale", () => {
        var locale = new LocaleProvider(Language.en); // Use the Language.EN value instead of 'en'
        expect(locale.getLocale("appname")).toBe("Capacity Monitoring");
    });
    test("Get Locale Spanish", () => {
        var locale = new LocaleProvider(Language.es); // Use the Language.EN value instead of 'en'
        expect(locale.getLocale("appname")).toBe("Monitor de Capacidad");
    });

    test("Get Locale from string", () => {
        var locale = new LocaleProvider("en" as Language); // Use the Language.EN value instead of 'en'
        expect(locale.getLocale("appname")).toBe("Capacity Monitoring");
    });
});
