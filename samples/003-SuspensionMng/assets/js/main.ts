import { CustomPlugin } from "./custom";

export {};
declare global {
    interface Window {
        ofs: CustomPlugin;
    }
}

window.onload = function () {
    window.ofs = new CustomPlugin("SuspensionMng");
};
