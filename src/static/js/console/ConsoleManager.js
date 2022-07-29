class ConsoleManager {

    constructor(root) {

        this.root = null;
        if (root instanceof HTMLElement) this.root = root;
        else if (typeof root === 'string') {
            if (root.startsWith('.')) this.root = document.querySelectorAll(root)[0];
            else this.root = document.querySelector(root);
        }
        if (!this.root) throw new TypeError(`ConsoleManager.constructor(): Parameter 'root' must be of type 'HTMLElement' or 'string'.`);

        this.consoleText = this.root.querySelector('.console-text');
        if (!this.consoleText) throw new ReferenceError(`ConsoleManager.constructor(): Unable to find console text within parameter 'root'.`);

    }

    entry(text, style={}) {
        const e = document.createElement('li');
        e.classList.add('console-entry');
        e.innerText = text;
        for (let key in style) {
            e.style[key] = style[key];
        }
        this.consoleText.appendChild(e);
        return e;
    }

    log(info, style={}) {
        const e = this.entry(info.toString(), style);
        e.classList.add('log');
    }

    warn(warning, style={}) {
        const e = this.entry(warning.toString(), style);
        e.classList.add('warn');
    }

    error(error, style={}) {
        const e = this.entry(error.toString(), style);
        e.classList.add('error');
    }

    clear() {
        this.consoleText.innerHTML = '';
        this.log('===== WebGL Shader Editor =====', { textAlign: 'center' });
    }

}

export default ConsoleManager;