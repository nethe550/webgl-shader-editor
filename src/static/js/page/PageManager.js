class PageManager extends EventTarget {

    constructor(root) {

        super();

        this.root = null;
        if (root instanceof HTMLElement) this.root = root;
        else if (typeof root === 'string') {
            if (root.startsWith('.')) this.root = document.querySelectorAll(root)[0];
            else this.root = document.querySelector(root);
        }
        if (!this.root) throw new TypeError(`PageManager.constructor(): Parameter 'root' must be of type 'HTMLElement' or 'string'.`);

        const subpages = this.root.querySelectorAll('.sub-page');

        this.left = null;
        this.right = null;
        if (subpages.length >= 2) {
            for (let subpage of subpages) {
                if (subpage.classList.contains('left')) this.left = subpage;
                else if (subpage.classList.contains('right')) this.right = subpage;
            }
            if (!this.left) throw new ReferenceError(`PageManager.constructor(): Unable to find left sub-page within parameter 'root'.`);
            if (!this.right) throw new ReferenceError(`PageManager.constructor(): Unable to find right sub-page within parameter 'root'.`);
        }
        else throw new ReferenceError(`PageManager.constructor(): Unable to find sub-pages within parameter 'root'.`);

        this.ewAdjuster = this.root.querySelector('.sub-page-adjuster');
        if (!this.ewAdjuster) throw new ReferenceError(`PageManager.constructor(): Unable to find sub-page adjuster within parameter 'root'.`);

        const subsubpages = this.right.querySelectorAll('.sub-sub-page');

        this.top = null;
        this.bottom = null;
        if (subsubpages.length >= 2) {
            for (let subsubpage of subsubpages) {
                if (subsubpage.classList.contains('top')) this.top = subsubpage;
                else if (subsubpage.classList.contains('bottom')) this.bottom = subsubpage;
            }
            if (!this.top) throw new ReferenceError(`PageManager.constructor(): Unable to find top sub-sub-page within parameter 'root'.`);
            if (!this.bottom) throw new ReferenceError(`PageManager.constructor(): Unable to find bottom sub-sub-page within parameter 'root'.`);
        }
        else throw new ReferenceError(`PageManager.constructor(): Unable to find sub-sub-pages within parameter 'root'.`);

        this.nsAdjuster = this.right.querySelector('.sub-sub-page-adjuster');
        if (!this.nsAdjuster) throw new ReferenceError(`PageManager.constructor(): Unable to find sub-sub-page adjuster within parameter 'root'.`);

        this.canvas = this.top.querySelector('#out');
        if (!this.canvas) throw new ReferenceError(`PageManager.constructor(): Unable to find canvas within parameter 'root'.`);

        this.mouse = {
            x: 0,
            y: 0,
            prevX: 0,
            prevY: 0,
            downX: false,
            downY: false
        };

        this.init();

    }

    init() {

        // sub-pages
        this.ewAdjuster.addEventListener('mousedown', (e => {
            this.mouse.x = e.pageX;
            this.mouse.downX = true;
        }).bind(this));

        this.root.addEventListener('mousemove', (e => {
            if (this.mouse.downX) {
                const dx = (this.mouse.x - e.pageX);
                this.mouse.x = e.pageX;
                this.mouse.prevX += dx;
                this.left.style.width = `calc(50% - var(--page-adjuster-size) / 2 - ${this.mouse.prevX}px)`;
                this.right.style.width = `calc(50% - var(--page-adjuster-size) / 2 + ${this.mouse.prevX}px)`;
                this.resizeCanvas();
            }
        }).bind(this));

        // sub-sub-pages
        this.nsAdjuster.addEventListener('mousedown', (e => {
            this.mouse.y = e.pageY;
            this.mouse.downY = true;
        }).bind(this));

        this.root.addEventListener('mousemove', (e => {
            if (this.mouse.downY) {
                const dy = (this.mouse.y - e.pageY);
                this.mouse.y = e.pageY;
                this.mouse.prevY += dy;
                this.top.style.height = `calc(75% - var(--page-adjuster-size) / 2 - ${this.mouse.prevY}px)`;
                this.bottom.style.height = `calc(25% - var(--page-adjuster-size) / 2 + ${this.mouse.prevY}px)`;
                this.resizeCanvas();
            }
        }).bind(this));

        this.root.addEventListener('mouseup', (() => {
            this.mouse.downX = false;
            this.mouse.downY = false;
        }).bind(this));

        this.resizeCanvas();
        window.addEventListener('resize', this.resizeCanvas.bind(this));

    }

    resizeCanvas() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
        this.dispatchEvent(new Event('resize'));
    }

}

export default PageManager;