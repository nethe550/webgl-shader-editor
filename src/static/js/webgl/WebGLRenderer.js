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

// Path-tracing settings
const int MAX_MARCHES = 100;
const float COLLISION_EPSILON = 0.001;

// Camera settings
const float SELF_INTERSECTION_BIAS = 0.001;
const float FAR_PLANE = 20.0;
vec3 CAMERA_POSITION = vec3(2.0, 1.5, 4.0);
vec3 CAMERA_TARGET = vec3(0.0);
const float FOV = 1.5;

// Lighting settings
const float NORMAL_EPSILON = 0.0001;
vec3 SUN_DIRECTION = vec3(0.8, 0.4, 0.2);
vec3 SKY_DIRECTION = vec3(0.0, 1.0, 0.0);
const float SKY_LIGHT_BIAS = 0.5;
vec3 BOUNCE_DIRECTION = vec3(0.0, -1.0, 0.0);
const float BOUNCE_LIGHT_BIAS = 0.5;
const float HORIZON_BIAS = 2.25;
vec3 SUN_COLOR = vec3(7.0, 4.5, 3.0);
vec3 SKY_COLOR = vec3(0.55, 0.85, 1.0);
vec3 SKY_LIGHT_COLOR = vec3(0.5, 0.8, 0.9);
vec3 BOUNCE_LIGHT_COLOR = vec3(0.7, 0.3, 0.2);
vec3 HORIZON_FOG_COLOR = vec3(0.7, 0.75, 0.8);
const float SHADOW_SHARPNESS = 32.0;

// Material settings

const float GROUND_MAT = 1.0;
vec3 GROUND_COLOR = vec3(0.09, 0.18, 0.09);
float GROUND_GLOSSINESS = 10.0;

vec3 BASE_COLOR = vec3(0.18);

const float SPHERE_MAT = 2.0;
vec3 SPHERE_COLOR = vec3(0.18, 0.09, 0.0);
float SPHERE_GLOSSINESS = 128.0;

const float BOX_MAT = 3.0;
vec3 BOX_COLOR = vec3(0.18, 0.09, 0.09);
float BOX_GLOSSINESS = 25.0;

const float LINE_MAT = 4.0;
vec3 LINE_COLOR = vec3(0.09, 0.09, 0.18);
float LINE_GLOSSINESS = 35.0;

// Scene settings
vec3 SPHERE_POSITION = vec3(0.0, -0.25, 0.0);
float SPHERE_RADIUS = 0.5;

vec3 BOX_POSITION = vec3(2.0, -0.125, 0.0);
vec3 BOX_SIZE = vec3(0.475, 0.475, 0.65);
float BOX_RADIUS = 0.125;

vec3 LINE_POSITION_A = vec3(2.0, 0.0, -2.0);
vec3 LINE_POSITION_B = vec3(2.0, 0.0, 2.0);
float LINE_THICKNESS = 0.25;

float GROUND_HEIGHT = -0.25;


vec2 determiner(vec2 a, vec2 b) {
    return (a.x < b.x) ? a : b;
}

vec2 SphereSDF(vec3 sample, float material, vec3 pos, float radius) {
    return vec2(
length(sample + pos) - radius, material);
}

vec2 BoxSDF(vec3 sample, float material, vec3 pos, vec3 size, float radius) {
    vec3 s = size * 0.5;
    vec3 q = abs(sample + pos) - s;
    vec3 dm = max(q, vec3(0.0));
    float d = length(dm) + min(max(max(q.x, q.y), q.z), 0.0);
    return vec2(d - radius, material);
}

vec2 LineSDF(vec3 sample, float material, vec3 a, vec3 b, float thickness) {
    vec3 pMinusA = sample - a;
    vec3 bMinusA = b - a;
    float h = min(1.0, max(0.0, dot(pMinusA, bMinusA) / dot(bMinusA, bMinusA)));
    return vec2(length(pMinusA - bMinusA * h) - thickness * 0.5, material);
}

vec2 PlaneSDF(vec3 sample, float material, float height) {
    return vec2(sample.y - height, material);
}

vec2 distanceToScene(vec3 sample) {
    vec2 distAndMat = vec2(999999.0, 0.0);
    distAndMat = determiner(distAndMat, SphereSDF(sample, SPHERE_MAT, SPHERE_POSITION, SPHERE_RADIUS));
    distAndMat = determiner(distAndMat, BoxSDF(sample, BOX_MAT, BOX_POSITION, BOX_SIZE, BOX_RADIUS));
    distAndMat = determiner(distAndMat, LineSDF(sample, LINE_MAT, LINE_POSITION_A, LINE_POSITION_B, LINE_THICKNESS));
    distAndMat = determiner(distAndMat, PlaneSDF(sample, GROUND_MAT, GROUND_HEIGHT));
    return distAndMat;
}

float calcAO(vec3 pos, vec3 normal) {
    float occ = 0.0;
    float sca = 1.0;
    for(int i = 0; i < 5; i++) {
        float h = 0.01 + 0.12 * float(i) * 0.25;
        float d = distanceToScene(pos + h * normal).x;
        occ += (h - d) * sca;
        sca *= 0.95;
        if(occ > 0.35) break;
    }
    return clamp(1.0 - 3.0 * occ, 0.0, 1.0) * (0.5 + 0.5 * normal.y);
}

vec2 castRay(vec3 origin, vec3 dir) {
    float t = 0.0;
    float m = 0.0;
    for (int i = 0; i < MAX_MARCHES; i++) {
        vec3 sample = origin + t * dir;
        vec2 h = distanceToScene(sample);
        m = h.y;
        if (h.x < COLLISION_EPSILON) break;
        t += h.x;
        if (t > FAR_PLANE) break;
    }
    if (t > FAR_PLANE) {
        t = -1.0;
        m = 0.0;
    }
    return vec2(t, m);
}

float castShadow(vec3 origin, vec3 dir, float minT, float maxT, float sharpness) {
    float res = 1.0;
    float ph = 1e20;
    float t = minT;
    for(int i = 0; i < MAX_MARCHES; i++) {
        float h = distanceToScene(origin + dir * t).x;
        if (h < COLLISION_EPSILON) return 0.0;
        if (t > maxT) break;
        float y = h * h /(2.0 * ph);
        float d = sqrt(h * h - y * y);
        res = min(res, sharpness * d / max(0.0, t - y));
        ph = h;
        t += h;
    }
    return res;
}

vec3 normal(vec3 pos) {
    vec2 e = vec2(NORMAL_EPSILON, 0.0);
    return normalize(vec3(distanceToScene(pos + e.xyy).x - distanceToScene(pos - e.xyy).x, distanceToScene(pos + e.yxy).x - distanceToScene(pos - e.yxy).x, distanceToScene(pos + e.yyx).x - distanceToScene(pos - e.yyx).x));
}

void main(void) {

    vec2 clip = (2.0 * gl_FragCoord.xy - f_resolution) / f_resolution.y;

    vec3 ww = normalize(CAMERA_TARGET - CAMERA_POSITION);
    vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
    vec3 vv = normalize(cross(uu, ww));

    vec3 raydir = vec3(normalize(clip.x * uu + clip.y * vv + FOV * ww));

    vec2 dm = castRay(CAMERA_POSITION, raydir);

    vec3 col = SKY_COLOR - HORIZON_BIAS * (0.5 * raydir.y);
    col = mix(col, HORIZON_FOG_COLOR, exp(-10.0 * raydir.y));

    if (dm.x > 0.0) {
        vec3 hit = CAMERA_POSITION + dm.x * raydir;
        vec3 normal = normal(hit);

        vec3 color = BASE_COLOR;
        float glossiness = 1.0;
        if (dm.y == SPHERE_MAT) {
            color = SPHERE_COLOR;
            glossiness = SPHERE_GLOSSINESS;
        }
        else if (dm.y == BOX_MAT) {
            color = BOX_COLOR;
            glossiness = BOX_GLOSSINESS;
        }
        else if (dm.y == LINE_MAT) {
            color = LINE_COLOR;
            glossiness = LINE_GLOSSINESS;
        }
        else if (dm.y == GROUND_MAT) {
            color = GROUND_COLOR;
            glossiness = GROUND_GLOSSINESS;
        }
        
        float ao = calcAO(hit, normal);
        float sunDiffuse = clamp(dot(normal, SUN_DIRECTION), 0.0, 1.0);
        float skyDiffuse = clamp(SKY_LIGHT_BIAS + SKY_LIGHT_BIAS * dot(normal, SKY_DIRECTION), 0.0, 1.0);
        float sunShadow = castShadow(hit, SUN_DIRECTION, 0.02, 2.5, SHADOW_SHARPNESS);
        float bounceDiffuse = clamp(BOUNCE_LIGHT_BIAS + BOUNCE_LIGHT_BIAS * dot(normal, BOUNCE_DIRECTION), 0.0, 1.0);
       
        vec3 halfVector = normalize(SUN_DIRECTION + CAMERA_POSITION);
        float specular = pow(clamp(dot(normal, halfVector), 0.0, 1.0), glossiness);

        col = color * SUN_COLOR * sunDiffuse * sunShadow * ao;
        col += color * SKY_LIGHT_COLOR * skyDiffuse;
        col += color * BOUNCE_LIGHT_COLOR * bounceDiffuse;
        col += color * SUN_COLOR * specular;
    }

    col = pow(col, vec3(0.4545));

    gl_FragColor = vec4(col, 1.0);

}`

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
            else if (l.includes('warn')) this.consoleManager.warn(l);
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
        const hasFragResUniform = this.editor.value.includes('uniform vec2 f_resolution;');
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
        if (hasFragResUniform) this.gl.uniform2f(this.gl.getUniformLocation(this.program, 'f_resolution'), this.canvas.width, this.canvas.height);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    }

}

export default WebGLRenderer;