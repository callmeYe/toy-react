let childrenSymbol = Symbol("children");
class ElementWrapper {
    constructor(type) {
        this.type = type;
        this.props = Object.create(null);
        this[childrenSymbol] = [];
        this.children = [];
    }

    get vdom() {
        return this;
    }

    setAttribute(name, value) {
        this.props[name] = value;
    }

    appendChild(vchild) {
        this.children.push(vchild.vdom);
        this[childrenSymbol].push(vchild);
    }

    mountTo(domRange) {
        const placeholder = document.createComment("");
        let placeholderRange = document.createRange();
        placeholderRange.setStart(domRange.endContainer,domRange.endOffset);
        placeholderRange.setEnd(domRange.endContainer,domRange.endOffset);
        placeholderRange.insertNode(placeholder);

        domRange.deleteContents();

        let element = document.createElement(this.type);

        for (let name in this.props) {
            const value = this.props[name];
            //[\s\S] means that all characters are matched
            if (name.match(/^on([\s\S]+)$/)) {
                let eventName = RegExp.$1.replace(/^[\s\S]/, (s) => s.toLowerCase())
                element.addEventListener(eventName, value)
            }
            if (name === 'className') {
                element.setAttribute('class', value)
            } else {
                element.setAttribute(name, value)
            }
        }

        for (let child of this.children) {
            let domRange = document.createRange();
            if (element.children && element.children.length) {
                domRange.setStartAfter(element.lastChild);
                domRange.setEndAfter(element.lastChild)
            } else {
                domRange.setStart(element, 0);
                domRange.setEnd(element, 0)
            }
            child.mountTo(domRange)
        }

        domRange.insertNode(element)
        this.domRange = domRange;
    }
}

//Plain text node
class TextWrapper {
    constructor(content) {
        this.root = document.createTextNode(content);
        this.type = "#text";
        this.props = Object.create(null);
        this.children = [];
    }

    get vdom() {
        return this;
    }

    mountTo(domRange) {
        domRange.deleteContents();
        domRange.insertNode(this.root);
        this.domRange = domRange;
    }
}

export class Component {
    constructor() {
        this.children = [];
        this.props = Object.create(null); //Methods on the prototype chain are not attached
    }

    get type() {
        return this.constructor.name;
    }

    get vdom() {
        return this.render()
    }

    setAttribute(name, value) {
        this[name] = value;
        this.props[name] = value;
    }

    mountTo(domRange) {
        this.domRange = domRange;
        this.update();
    }

    appendChild(child) {
        this.children.push(child)
    }

    update() {
        console.log(this.vdom);
        let vdom = this.vdom;
        if (this.oldVdom) {
            const isSameNode = (node1, node2) => {
                if (node1.type !== node2.type) {
                    return false
                }
                if (Object.keys(node1.props).length !== Object.keys(node2.props).length) {
                    return false;
                }
                for (let name in node1.props) {
                    if (node1.props[name] !== node2.props[name]) {
                        return false
                    }
                }

                return true;
            }

            const isSameTree = (root1, root2) => {
                if (!isSameNode(root1, root2)) return false;
                if (root1.children.length !== root2.children.length) return false;

                for (let i = 0; i < root1.children.length; i++) {
                    if (!isSameTree(root1.children[i], root2.children[i])) {
                        return false;
                    }
                }

                return true;
            }

            const replceTree = (oldTree, newTree) => {
                if (isSameTree(oldTree, newTree)) return;

                if (!isSameNode(oldTree, newTree)) {
                    newTree.mountTo(oldTree.domRange)
                } else {
                    for (let i = 0; i < newTree.children.length; i++) {
                        replceTree(oldTree.children[i], newTree.children[i])
                    }
                }
            }

            replceTree(this.oldVdom, vdom)
        } else {
            vdom.mountTo(this.domRange)
        }
        this.oldVdom = vdom;
    }

    setState(state) {
        let mergeState = (oldState, newState) => {
            for (let key in newState) {
                if (typeof newState[key] === 'object' && newState[key]) {
                    if (typeof oldState[key] !== 'object') {
                        oldState[key] = Array.isArray(newState[key]) ? [] : {}
                    }
                    mergeState(oldState[key], newState[key])
                } else {
                    oldState[key] = newState[key]
                }
            }
        }
        if (!this.state && state) {
            this.state = {}
        }
        mergeState(this.state, state);

        //rerender
        this.update();
    }
}

export let ToyReact = {
    //babel will transform jsx to ToyReact.createElement
    createElement(type, attributes, ...children) {
        let element;
        if (typeof type === "string") {
            element = new ElementWrapper(type)
        } else {
            element = new type;
        }
        for (let name in attributes) {
            element.setAttribute(name, attributes[name]);
        }

        let insertChildren = (children) => {
            for (let child of children) {
                if (typeof child === "object" && child instanceof Array) {
                    insertChildren(child)
                } else {
                    if (child === null || child === void 0) {
                        child = "";
                    }
                    if (!(child instanceof Component)
                        && !(child instanceof ElementWrapper)
                        && !(child instanceof TextWrapper)) {
                        child = String(child)
                    }
                    if (typeof child === "string") {
                        child = new TextWrapper(child);
                    }
                    element.appendChild(child);
                }
            }
        }

        insertChildren(children)

        return element

    },

    render(vdom, element) {
        //Range enables it to return DocumentFragment.
        let domRange = document.createRange();
        if (element.children && element.children.length) {
            domRange.setStartAfter(element.lastChild);
            domRange.setEndAfter(element.lastChild)
        } else {
            domRange.setStart(element, 0);
            domRange.setEnd(element, 0)
        }
        vdom.mountTo(domRange)
    }
}