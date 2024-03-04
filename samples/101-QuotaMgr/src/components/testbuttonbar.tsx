import { Language, LocaleProvider } from "../services/locale";
import "oj-c/input-text";
import "ojs/ojinputtext";
import "oj-c/button";
import "ojs/ojactioncard";

type Props = {
    tag: string;
    language: string;
};

export function TestButtonBar(props: Props) {
    let myLabel = props.language;
    return (
        <div>
            <oj-button
                id="refresh_button"
                label={myLabel}
                onojAction={() => console.log(myLabel)}
            ></oj-button>
            <oj-c-button
                id="refresh_button"
                label={myLabel}
                onojAction={() => console.log(myLabel)}
            ></oj-c-button>
            <oj-input-text labelHint={myLabel}></oj-input-text>
            <oj-c-input-text labelHint={myLabel}></oj-c-input-text>
            <oj-action-card>{myLabel}</oj-action-card>
        </div>
    );
}
