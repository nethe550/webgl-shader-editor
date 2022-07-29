import PageManager from './page/PageManager.js';
import ConsoleManager from './console/ConsoleManager.js';
import WebGLRenderer from './webgl/WebGLRenderer.js';

const pm = new PageManager(document.querySelector('#page'));
const cm = new ConsoleManager(document.querySelector('#console'));
const glr = new WebGLRenderer(cm, document.querySelector('#out'), document.querySelector('.editor-text'), document.querySelector('#run'), document.querySelector('#save'));

const resize = () => {
    glr.gl.viewport(0, 0, glr.canvas.width, glr.canvas.height);
    glr.render();
};

pm.addEventListener('resize', resize);