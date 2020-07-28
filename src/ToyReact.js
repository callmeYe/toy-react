class ElementWrapper {
    constructor(type) {
        this.root = document.createElement(type)
    }

    setAttribute(name, value) {
        //[\s\S] means that all characters are matched
        if (name.match(/^on([\s\S]+)$/)) {
            let eventName = RegExp.$1.replace(/^[\s\S]/, (s) => s.toLowerCase())
            this.root.addEventListener(eventName, value)
        }
        if (name === 'className') {
            this.root.setAttribute('class', value)
        } else {
            this.root.setAttribute(name, value)
        }
    }

    appendChild(vchild) {
        let domRange = document.createRange();
        if (this.root.children && this.root.children.length) {
            domRange.setStartAfter(this.root.lastChild);
            domRange.setEndAfter(this.root.lastChild)
        } else {
            domRange.setStart(this.root, 0);
            domRange.setEnd(this.root, 0)
        }
        vchild.mountTo(domRange)
    }

    mountTo(domRange) {
        domRange.deleteContents();
        domRange.insertNode(this.root)
    }
}

//Plain text node
class TextWrapper {
    constructor(content) {
        this.root = document.createTextNode(content)
    }
    mountTo(domRange) {
        domRange.insertNode(this.root)
    }
}

export class Component {
    constructor() {
        this.children = [];
        this.props = Object.create(null); //Methods on the prototype chain are not attached
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
        let placeholder = document.createComment('placeholder');
        let placeholderRange = document.createRange();
        placeholderRange.setStart(this.domRange.endContainer, this.domRange.endOffset);
        placeholderRange.setEnd(this.domRange.endContainer, this.domRange.endOffset);
        placeholderRange.insertNode(placeholder);

        this.domRange.deleteContents();
        let vdom = this.render();
        vdom.mountTo(this.domRange);
    }

    setState(state) {
        let mergeState = (oldState, newState) => {
            for (let key in newState) {
                if (typeof newState[key] === 'object' && newState[key]) {
                    if (typeof oldState[key] !== 'object') {
                        oldState[key] = {}
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
        console.log(this.state)
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