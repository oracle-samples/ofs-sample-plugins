import "../../css/jsonviewer.scss";

function element(name: string): HTMLElement {
    return document.createElement(name);
}

function listen(node: Element, event: any, handler: any): CallableFunction {
    node.addEventListener(event, handler);
    return () => node.removeEventListener(event, handler);
}

//export function detach(node: HTMLElement) {
//    node.parentNode.removeChild(node);
//}

const classes = {
    HIDDEN: "hidden",
    CARET_ICON: "caret-icon",
    CARET_RIGHT: "fa-caret-right",
    CARET_DOWN: "fa-caret-down",
    ICON: "fas",
};

function getDataType(val: any) {
    if (Array.isArray(val)) return "array";
    if (val === null) return "null";
    return typeof val;
}

function expandedTemplate({ key, size }: any): string {
    return `
    <div class="line">
      <div class="caret-icon"><i class="fas fa-caret-right"></i></div>
      <div class="json-key">${key}</div>
      <div class="json-size">${size}</div>
    </div>
  `;
}

function notExpandedTemplate({ key, value, type }: any) {
    return `
    <div class="line">
      <div class="empty-icon"></div>
      <div class="json-key">${key}</div>
      <div class="json-separator">:</div>
      <div class="json-value json-${type}">${value}</div>
    </div>
  `;
}

function createContainerElement() {
    const el = element("div");
    el.className = "json-container";
    return el;
}

function hideNodeChildren(node: Node) {
    node.children.forEach((child) => {
        child.el.classList.add(classes.HIDDEN);
        if (child.isExpanded) {
            hideNodeChildren(child);
        }
    });
}

function showNodeChildren(node: Node) {
    node.children.forEach((child) => {
        child.el.classList.remove(classes.HIDDEN);
        if (child.isExpanded) {
            showNodeChildren(child);
        }
    });
}

function setCaretIconDown(node: Node) {
    if (node.children.length > 0) {
        const icon = node.el.querySelector("." + classes.ICON);
        if (icon) {
            icon.classList.replace(classes.CARET_RIGHT, classes.CARET_DOWN);
        }
    }
}

function setCaretIconRight(node: Node) {
    if (node.children.length > 0) {
        const icon = node.el.querySelector("." + classes.ICON);
        if (icon) {
            icon.classList.replace(classes.CARET_DOWN, classes.CARET_RIGHT);
        }
    }
}

function toggleNode(node: Node) {
    if (node.isExpanded) {
        node.isExpanded = false;
        setCaretIconRight(node);
        hideNodeChildren(node);
    } else {
        node.isExpanded = true;
        setCaretIconDown(node);
        showNodeChildren(node);
    }
}

/**
 * Create node html element
 * @param {object} node
 * @return html element
 */
function createNodeElement(node: Node) {
    let el: HTMLElement = element("div");

    const getSizeString = (node: Node) => {
        const len = node.children.length;
        if (node.type === "array") return `[${len}]`;
        if (node.type === "object") return `{${len}}`;
        return null;
    };

    if (node.children.length > 0) {
        el.innerHTML = expandedTemplate({
            key: node.key,
            size: getSizeString(node),
        });
        const caretEl = el.querySelector("." + classes.CARET_ICON);
        if (caretEl) {
            node.dispose = listen(caretEl, "click", () => toggleNode(node));
        }
    } else {
        el.innerHTML = notExpandedTemplate({
            key: node.key,
            value: node.value,
            type: typeof node.value,
        });
    }

    const lineEl = el.children.item(0) as HTMLElement;
    if (lineEl) {
        if (node.parent !== null) {
            lineEl.classList.add(classes.HIDDEN);
        }

        lineEl.setAttribute("style", "margin-left: " + node.depth * 18 + "px;");
    }
    return lineEl;
}

class Node {
    key: any;
    parent: Node;
    value: any; // Data inside
    isExpanded: boolean;
    type: any;
    children: Array<Node>;
    el: any;
    depth: number = 0;
    dispose: CallableFunction | null;

    /**
     * Create node object
     * @param {object} opt options
     */
    constructor(opt: any = {}) {
        let value = opt.hasOwnProperty("value") ? opt.value : null;
        if (
            typeof value == "object" &&
            (value == null || Object.keys(value).length == 0)
        ) {
            value = "{}";
        }
        this.key = opt.key || null;
        this.parent = opt.parent || null;
        this.value = value;
        this.isExpanded = opt.isExpanded || false;
        this.type = opt.type || null;
        this.children = opt.children || [];
        this.el = opt.el || null;
        this.depth = opt.depth || 0;
        this.dispose = null;
    }

    /**
     * Create children for node
     */
    createChildren(data: any) {
        if (typeof data === "object") {
            for (let key in data) {
                const child = new Node({
                    value: data[key],
                    key: key,
                    depth: this.depth + 1,
                    type: getDataType(data[key]),
                    parent: this,
                });
                this.children.push(child);
                child.createChildren(data[key]);
            }
        }
    }
}

/**
 * Recursively traverse Tree object
 * @param {Object} node
 * @param {CallableFunction} callback
 */
function traverse(node: Node, callback: CallableFunction) {
    callback(node);
    if (node.children.length > 0) {
        node.children.forEach((child) => {
            traverse(child, callback);
        });
    }
}

function getJsonObject(data: any): any {
    return typeof data === "string" ? JSON.parse(data) : data;
}

export class JSONTree {
    private _root: Node;

    constructor(data: string) {
        const parsedData = getJsonObject(data);
        this._root = new Node({
            value: parsedData,
            key: getDataType(parsedData),
            type: getDataType(parsedData),
        });
        this._root.createChildren(parsedData);
    }

    render(element: HTMLElement) {
        const containerEl = createContainerElement();

        traverse(this._root, function (node: Node) {
            node.el = createNodeElement(node);
            containerEl.appendChild(node.el);
        });

        element.appendChild(containerEl);
    }

    expand() {
        traverse(this._root, function (child: Node) {
            child.el.classList.remove(classes.HIDDEN);
            child.isExpanded = true;
            setCaretIconDown(child);
        });
    }

    collapse() {
        var depth = this._root.depth;
        traverse(this._root, function (child: Node) {
            child.isExpanded = false;
            if (child.depth > depth) child.el.classList.add(classes.HIDDEN);
            setCaretIconRight(child);
        });
    }
}
