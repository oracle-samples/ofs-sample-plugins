import { Language, LocaleProvider } from "../services/locale";
import { useContext } from "preact/hooks";
import { pluginContext } from "./app";
import { getQuota, exportData } from "./ofs";

type Props = {
    tag: string;
    language: string;
};

export function ButtonBar(props: Props) {
    const ofsPlugin = useContext(pluginContext);
    let dictionary = LocaleProvider.getDictionary(props.language as Language);
    return (
        <div>
            <oj-button
                id="refresh_button"
                label={dictionary["Refresh Quota"]}
                onojAction={() => getQuota(ofsPlugin)}
            ></oj-button>
            <oj-button
                id="export_button"
                label={dictionary["Export Data"].toString()}
                onojAction={() => exportData()}
            ></oj-button>
        </div>
    );
}
