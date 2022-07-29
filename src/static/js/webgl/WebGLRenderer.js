import ConsoleManager from '../console/ConsoleManager.js';

class WebGLRenderer {

    static DefaultShader = {

        vertex: '' +
        'attribute vec3 v_position;\n' +
        '\n' +
        'void main(void) {\n' +
        '    gl_Position = vec4(v_position, 1.0);\n' +
        '}\n',

        fragment: '' +
`#version 100

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif
precision mediump int;

// =============== //

uniform vec2 f_resolution;

const float circle1Mat = 1.0;
const float circle2Mat = 2.0;
const float box1Mat = 3.0;
const float box2Mat = 4.0;
const float box3Mat = 5.0;
const float line1Mat = 6.0;
const float line2Mat = 7.0;

const vec4 defaultColor = vec4(0.0);
const vec4 circle1Color = vec4(1.0, 0.0, 0.0, 1.0);
const vec4 circle2Color = vec4(1.0, 0.5, 0.0, 1.0);
const vec4 box1Color = vec4(1.0, 1.0, 0.0, 1.0);
const vec4 box2Color = vec4(0.5, 1.0, 0.0, 1.0);
const vec4 box3Color = vec4(0.0, 1.0, 0.0, 1.0);
const vec4 line1Color = vec4(0.0, 1.0, 0.5, 1.0);
const vec4 line2Color = vec4(0.0, 1.0, 1.0, 1.0);

vec2 circleSDF(vec2 sample, float mat, vec2 position, float radius) {
    return vec2(length(sample - position) - radius, mat);
}

vec2 boxSDF(vec2 sample, float mat, vec2 pos, vec2 size, float radius) {
    vec2 s = size * 0.5;
    vec2 q = abs(sample + pos) - s;
    vec2 dm = max(q, vec2(0.0));
    float d = length(dm) + min(max(q.x,q.y), 0.0);
    return vec2(d - radius, mat);
}

vec2 lineSDF(vec2 sample, float mat, vec2 a, vec2 b, float thickness) {
    vec2 pMinusA = sample - a;
    vec2 bMinusA = b - a;
    float h = min(1.0, 
        max(0.0, dot(pMinusA, bMinusA) / dot(bMinusA, bMinusA))
    );
    return vec2(length(pMinusA - bMinusA * h) - thickness * 0.5, mat);
}

vec2 distance(vec2 pos) {
    vec2 circle1 = circleSDF(pos, circle1Mat, vec2(0.5), 0.0625); 
    vec2 circle2 = circleSDF(pos, circle2Mat, vec2(-0.5), 0.125);
    vec2 box1 = boxSDF(pos, box1Mat, vec2(0.0), vec2(0.66), 0.0);
    vec2 box2 = boxSDF(pos, box2Mat, vec2(0.75, -0.25), vec2(0.33, 0.66), 0.1);
    vec2 box3 = boxSDF(pos, box3Mat, vec2(-0.75, 0.09), vec2(0.33, 0.66), 0.133);
    vec2 line1 = lineSDF(pos, line1Mat, vec2(-0.33, 0.66), vec2(0.33, 0.66), 0.125);
    vec2 line2 = lineSDF(pos, line2Mat, vec2(-0.25, -0.66), vec2(0.75, -0.66), 0.0625);
    float d = min(circle1.x, min(circle2.x, min(box1.x, min(box2.x, min(box3.x, min(line1.x, line2.x))))));
    if (d == circle1.x) return circle1;
    if (d == circle2.x) return circle2;
    if (d == box1.x) return box1;
    if (d == box2.x) return box2;
    if (d == box3.x) return box3;
    if (d == line1.x) return line1;
    if (d == line2.x) return line2;
}

void main() {
    vec2 uv = (2.0 * gl_FragCoord.xy - f_resolution) / f_resolution.y;
    vec2 d = distance(uv);
    d.x = smoothstep(0.025, 0.0, d.x);
    if (d.x > 0.0) {
        if(d.y == circle1Mat) {
            gl_FragColor = circle1Color;
        }
        else if (d.y == circle2Mat) {
            gl_FragColor = circle2Color;
        }
        else if (d.y == box1Mat) {
            gl_FragColor = box1Color;
        }
        else if (d.y == box2Mat) {
            gl_FragColor = box2Color;
        }
        else if (d.y == box3Mat) {
            gl_FragColor = box3Color;
        }
        else if (d.y == line1Mat) {
            gl_FragColor = line1Color;
        }
        else if (d.y == line2Mat) {
            gl_FragColor = line2Color;
        }
        else {
            gl_FragColor = defaultColor;
        }
        gl_FragColor *= d.x;
    }
}
`

    };

    constructor(consoleManager, canvas, editor, editorRunButton, editorSaveButton) {

        this.consoleManager = null;
        if (consoleManager instanceof ConsoleManager) this.consoleManager = consoleManager;
        if (!this.consoleManager) throw new TypeError(`WebGLRenderer.constructor(): Parameter 'consoleManager' must be of type 'ConsoleManager'.`);

        this.consoleManager.clear();

        this.canvas = null;
        if (canvas instanceof HTMLCanvasElement) this.canvas = canvas;
        else if (typeof canvas === 'string') {
            if (canvas.startsWith('.')) this.canvas = document.querySelectorAll(canvas)[0];
            else this.canvas = document.querySelector(canvas);
        }
        if (!this.canvas || !(this.canvas instanceof HTMLCanvasElement)) throw new TypeError(`WebGLRenderer.constructor(): Parameter 'canvas' must be of type 'HTMLCanvasElement' or 'string'.`);

        this.editor = null;
        if (editor instanceof HTMLTextAreaElement) this.editor = editor;
        else if (typeof editor === 'string') {
            if (editor.startsWith('.')) this.editor = document.querySelectorAll(editor)[0];
            else this.editor = document.querySelector(editor);
        }
        if (!this.editor || !(this.editor instanceof HTMLTextAreaElement)) throw new TypeError(`WebGLRenderer.constructor(): Parameter 'editor' must be of type 'HTMLTextAreaElement' or 'string'.`);

        this.editorRunButton = null;
        if (editorRunButton instanceof HTMLButtonElement) this.editorRunButton = editorRunButton;
        else if (typeof editorRunButton === 'string') this.editorRunButton = document.querySelector(editorRunButton);
        if (!this.editorRunButton || !(editorRunButton instanceof HTMLButtonElement)) throw new TypeError(`WebGLRenderer.constructor(): Parameter 'editorRunButton' must be of type 'HTMLButtonElement' or 'string'.`);

        this.editorRunButton.addEventListener('click', (() => {
            this.consoleManager.clear();
            this.compile(false);
            this.render();
        }).bind(this));

        this.editorSaveButton = null;
        if (editorSaveButton instanceof HTMLButtonElement) this.editorSaveButton = editorSaveButton;
        else if (typeof editorSaveButton === 'string') this.editorSaveButton = document.querySelector(editorSaveButton);
        if (!this.editorSaveButton || !(this.editorSaveButton instanceof HTMLButtonElement)) throw new TypeError(`WebGLRenderer.constructor(): Parameter 'editorSaveButton' must be of type 'HTMLButtonElement' or 'string'.`);

        this.editorSaveButton.addEventListener('click', (() => {
            const file = new Blob([this.editor.value], {type: 'text/plain'});
            if (window.navigator.msSaveOrOpenBlob) window.navigator.msSaveOrOpenBlob(file, 'shader.frag');
            else {
                const a = document.createElement('a');
                const url = URL.createObjectURL(file);
                a.href = url;
                a.download = 'shader.frag';
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);  
                }, 0);
            }
        }).bind(this));

        this.gl = this.canvas.getContext('webgl');
        if (!this.gl) alert('Unable to instantiate WebGL. Your browser or computer hardware may not support it.');

        this.editor.value = WebGLRenderer.DefaultShader.fragment;

        this.compile(true);

        this.render();

    }

    compile(defaultFragment=false) {

        const handleLog = l => {
            const t = l.toLowerCase();
            if (t.includes('error')) this.consoleManager.error(l);
            else if (l.includes('warning')) this.consoleManager.warn(l);
            else this.consoleManager.log(l);
            return false;
        };

        const v = this.gl.createShader(this.gl.VERTEX_SHADER);
        this.gl.shaderSource(v, WebGLRenderer.DefaultShader.vertex);

        const f = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.gl.shaderSource(f, defaultFragment ? WebGLRenderer.DefaultShader.fragment : this.editor.value);

        this.gl.compileShader(v);
        this.gl.compileShader(f);

        const vError = this.gl.getShaderInfoLog(v);
        const fError = this.gl.getShaderInfoLog(f);

        if (vError.length > 0) return handleLog(vError);
        if (fError.length > 0) return handleLog(fError);

        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, v);
        this.gl.attachShader(this.program, f);

        this.gl.linkProgram(this.program);

        const pError = this.gl.getProgramInfoLog(this.program);

        if (pError.length > 0) return handleLog(pError);

        this.gl.useProgram(this.program);

        this.consoleManager.log('Compiled successfully.');

        return true;

    }

    render() {

        const vertPosAttrib = this.gl.getAttribLocation(this.program, 'v_position');
        const fragResUniform = this.gl.getUniformLocation(this.program, 'f_resolution');
        this.quad = this.gl.createBuffer();
        const meshdata = new Float32Array([
            -1, -1, 0,
             1, -1, 0,
            -1,  1, 0,

            -1,  1, 0,
             1, -1, 0,
             1,  1, 0
        ]);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quad);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, meshdata, this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(vertPosAttrib, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vertPosAttrib);
        this.gl.uniform2f(fragResUniform, this.canvas.width, this.canvas.height);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    }

}

export default WebGLRenderer;