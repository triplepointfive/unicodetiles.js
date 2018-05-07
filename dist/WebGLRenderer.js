"use strict";
var VERTEX_SHADER = "\nattribute vec2 position;\nattribute vec2 texCoord;\nattribute vec3 color;\nattribute vec3 bgColor;\nattribute float charIndex;\nuniform vec2 uResolution;\nuniform vec2 uTileCounts;\nuniform vec2 uPadding;\nvarying vec2 vTexCoord;\nvarying vec3 vColor;\nvarying vec3 vBgColor;\n\nvoid main() {\n  vec2 tileCoords = floor(vec2(mod(charIndex, uTileCounts.x), charIndex / uTileCounts.x));\n  vTexCoord = (texCoord + tileCoords) / uTileCounts;\n  vTexCoord += (0.5 - texCoord) * uPadding;\n  vColor = color;\n  vBgColor = bgColor;\n  vec2 pos = position / uResolution * 2.0 - 1.0;\n  gl_Position = vec4(pos.x, -pos.y, 0.0, 1.0);\n}\n";
var FRAGMENT_SHADER = "\nprecision mediump float;\nuniform sampler2D uFont;\nvarying vec2 vTexCoord;\nvarying vec3 vColor;\nvarying vec3 vBgColor;\n\nvoid main() {\n  vec4 color = texture2D(uFont, vTexCoord);\n  color.rgb = mix(vBgColor, vColor, color.rgb);\n  gl_FragColor = color;\n}\n";
/// Class: WebGLRenderer
/// Renders the <Viewport> with WebGL.
/// Given decent GPU drivers and browser support, this is the fastest renderer.
///
/// *Note:* This is an internal class used by <Viewport>
var WebGLRenderer = (function () {
    function WebGLRenderer(view) {
        var _this = this;
        this.view = view;
        this.view = view;
        this.canvas = document.createElement('canvas');
        // Try to fetch the context
        if (!this.canvas.getContext)
            throw ('Canvas not supported');
        this.gl = this.canvas.getContext('experimental-webgl');
        if (!this.gl)
            throw ('WebGL not supported');
        view.elem.appendChild(this.canvas);
        this.charMap = {};
        this.charArray = [];
        this.defaultColors = { r: 1.0, g: 1.0, b: 1.0, br: 0.0, bg: 0.0, bb: 0.0 };
        this.attribs = {
            position: { buffer: null, data: null, itemSize: 2, location: null, hint: this.gl.STATIC_DRAW },
            texCoord: { buffer: null, data: null, itemSize: 2, location: null, hint: this.gl.STATIC_DRAW },
            color: { buffer: null, data: null, itemSize: 3, location: null, hint: this.gl.DYNAMIC_DRAW },
            bgColor: { buffer: null, data: null, itemSize: 3, location: null, hint: this.gl.DYNAMIC_DRAW },
            charIndex: { buffer: null, data: null, itemSize: 1, location: null, hint: this.gl.DYNAMIC_DRAW }
        };
        // Create an offscreen canvas for rendering text to texture
        if (!this.offscreen)
            this.offscreen = document.createElement('canvas');
        this.offscreen.style.position = 'absolute';
        this.offscreen.style.top = '0px';
        this.offscreen.style.left = '0px';
        this.ctx = this.offscreen.getContext('2d');
        if (!this.ctx)
            throw 'Failed to acquire offscreen canvas drawing context';
        // WebGL drawing canvas
        this.updateStyle();
        this.canvas.width = (view.squarify ? this.th : this.tw) * view.w;
        this.canvas.height = this.th * view.h;
        this.offscreen.width = 0;
        this.offscreen.height = 0;
        // Doing this again since setting canvas w/h resets the state
        this.updateStyle();
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        var vertexShader = this.compileShader(this.gl.VERTEX_SHADER, VERTEX_SHADER);
        var fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
        var program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        this.gl.deleteShader(vertexShader);
        this.gl.deleteShader(fragmentShader);
        var ok = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
        if (!ok) {
            var msg = "Error linking program: " + this.gl.getProgramInfoLog(program);
            this.gl.deleteProgram(program);
            throw msg;
        }
        this.gl.useProgram(program);
        // Get attribute locations
        this.attribs.position.location = this.gl.getAttribLocation(program, 'position');
        this.attribs.texCoord.location = this.gl.getAttribLocation(program, 'texCoord');
        this.attribs.color.location = this.gl.getAttribLocation(program, 'color');
        this.attribs.bgColor.location = this.gl.getAttribLocation(program, 'bgColor');
        this.attribs.charIndex.location = this.gl.getAttribLocation(program, 'charIndex');
        // Setup buffers and uniforms
        this.initBuffers();
        var resolutionLocation = this.gl.getUniformLocation(program, 'uResolution');
        this.gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);
        this.tileCountsLocation = this.gl.getUniformLocation(program, 'uTileCounts');
        this.gl.uniform2f(this.tileCountsLocation, this.view.w, this.view.h);
        this.paddingLocation = this.gl.getUniformLocation(program, 'uPadding');
        this.gl.uniform2f(this.paddingLocation, 0.0, 0.0);
        // Setup texture
        // view.elem.appendChild(this.offscreen) // Debug offscreen
        var texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.cacheChars(" !\"#$%&'()*+,-./0123456789:<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~");
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.activeTexture(this.gl.TEXTURE0);
        setTimeout(function () {
            _this.updateStyle();
            _this.buildTexture();
            _this.render();
        }, 100);
    }
    WebGLRenderer.prototype.getRendererString = function () { return 'webgl'; };
    WebGLRenderer.prototype.buildTexture = function () {
        var w = this.offscreen.width / (this.tw + this.pad), h = this.offscreen.height / (this.th + this.pad);
        // Check if need to resize the canvas
        var charCount = this.charArray.length;
        if (charCount > Math.floor(w) * Math.floor(h)) {
            w = Math.ceil(Math.sqrt(charCount));
            h = w + 2; // Allocate some extra space too
            this.offscreen.width = w * (this.tw + this.pad);
            this.offscreen.height = h * (this.th + this.pad);
            this.updateStyle();
            this.gl.uniform2f(this.tileCountsLocation, w, h);
        }
        this.gl.uniform2f(this.paddingLocation, this.pad / this.offscreen.width, this.pad / this.offscreen.height);
        var c = 0, ch;
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.offscreen.width, this.offscreen.height);
        this.ctx.fillStyle = '#ffffff';
        var halfGap = 0.5 * this.gap; // Squarification
        var tw = this.tw + this.pad, th = this.th + this.pad;
        var y = 0.5 * th; // Half because textBaseline is middle
        for (var j = 0; j < h; ++j) {
            var x = this.pad * 0.5;
            for (var i = 0; i < w; ++i, ++c) {
                ch = this.charArray[c];
                if (ch === undefined)
                    break;
                this.ctx.fillText(ch, x + halfGap, y);
                x += tw;
            }
            if (!ch)
                break;
            y += th;
        }
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.offscreen);
    };
    WebGLRenderer.prototype.cacheChars = function (chars, build) {
        if (build === void 0) { build = true; }
        if (!this.gl)
            return; // Nothing to do if not using WebGL renderer
        var changed = false;
        for (var i = 0; i < chars.length; ++i) {
            if (!this.charMap[chars[i]]) {
                changed = true;
                this.charArray.push(chars[i]);
                this.charMap[chars[i]] = this.charArray.length - 1;
            }
        }
        if (changed && build)
            this.buildTexture();
    };
    WebGLRenderer.prototype.updateStyle = function (s) {
        s = s || window.getComputedStyle(this.view.elem, null);
        this.ctx.font = s.fontSize + '/' + s.lineHeight + ' ' + s.fontFamily;
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#ffffff';
        this.tw = this.ctx.measureText('M').width;
        this.th = parseInt(s.fontSize, 10);
        this.gap = this.view.squarify ? (this.th - this.tw) : 0;
        if (this.view.squarify)
            this.tw = this.th;
        this.pad = Math.ceil(this.th * 0.2) * 2.0; // Must be even number
        var color = s.color.match(/\d+/g);
        var bgColor = s.backgroundColor.match(/\d+/g);
        this.defaultColors.r = parseInt(color[0], 10) / 255;
        this.defaultColors.g = parseInt(color[1], 10) / 255;
        this.defaultColors.b = parseInt(color[2], 10) / 255;
        this.defaultColors.br = parseInt(bgColor[0], 10) / 255;
        this.defaultColors.bg = parseInt(bgColor[1], 10) / 255;
        this.defaultColors.bb = parseInt(bgColor[2], 10) / 255;
    };
    WebGLRenderer.prototype.clear = function () { };
    WebGLRenderer.prototype.render = function () {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        var w = this.view.w, h = this.view.h;
        // Create new tile data
        var tiles = this.view.buffer;
        var defaultColor = this.view.defaultColor;
        var defaultBgColor = this.view.defaultBackground;
        var newChars = false;
        for (var j = 0; j < h; ++j) {
            for (var i = 0; i < w; ++i) {
                var tile = tiles[j][i];
                var ch = this.charMap[tile.ch];
                if (ch === undefined) {
                    this.cacheChars(tile.ch, false);
                    newChars = true;
                    ch = this.charMap[tile.ch];
                }
                var k = this.attribs.color.itemSize * 6 * (j * w + i);
                var kk = this.attribs.charIndex.itemSize * 6 * (j * w + i);
                var r = tile.r === undefined ? this.defaultColors.r : tile.r / 255;
                var g = tile.g === undefined ? this.defaultColors.g : tile.g / 255;
                var b = tile.b === undefined ? this.defaultColors.b : tile.b / 255;
                var br = tile.br === undefined ? this.defaultColors.br : tile.br / 255;
                var bg = tile.bg === undefined ? this.defaultColors.bg : tile.bg / 255;
                var bb = tile.bb === undefined ? this.defaultColors.bb : tile.bb / 255;
                for (var m = 0; m < 6; ++m) {
                    var n = k + m * this.attribs.color.itemSize;
                    this.attribs.color.data[n + 0] = r;
                    this.attribs.color.data[n + 1] = g;
                    this.attribs.color.data[n + 2] = b;
                    this.attribs.bgColor.data[n + 0] = br;
                    this.attribs.bgColor.data[n + 1] = bg;
                    this.attribs.bgColor.data[n + 2] = bb;
                    this.attribs.charIndex.data[kk + m] = ch;
                }
            }
        }
        // Upload
        if (newChars)
            this.buildTexture();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.attribs.color.buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.attribs.color.data, this.attribs.color.hint);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.attribs.bgColor.buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.attribs.bgColor.data, this.attribs.bgColor.hint);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.attribs.charIndex.buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.attribs.charIndex.data, this.attribs.charIndex.hint);
        var attrib = this.attribs.position;
        this.gl.drawArrays(this.gl.TRIANGLES, 0, attrib.data.length / attrib.itemSize);
    };
    // Setup GLSL
    WebGLRenderer.prototype.compileShader = function (type, source) {
        var shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        var ok = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
        if (!ok) {
            var msg = 'Error compiling shader: ' + this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw msg;
        }
        return shader;
    };
    WebGLRenderer.prototype.initBuffers = function () {
        var a, attrib, attribs = this.attribs;
        var w = this.view.w, h = this.view.h;
        // Allocate data arrays
        for (a in this.attribs) {
            attrib = attribs[a];
            attrib.data = new Float32Array(attrib.itemSize * 6 * w * h);
        }
        // Generate static data
        for (var j = 0; j < h; ++j) {
            for (var i = 0; i < w; ++i) {
                // Position & texCoords
                var k = attribs.position.itemSize * 6 * (j * w + i);
                this.insertQuad(attribs.position.data, k, i * this.tw, j * this.th, this.tw, this.th);
                this.insertQuad(attribs.texCoord.data, k, 0.0, 0.0, 1.0, 1.0);
            }
        }
        // Upload
        for (a in this.attribs) {
            attrib = attribs[a];
            if (attrib.buffer)
                this.gl.deleteBuffer(attrib.buffer);
            attrib.buffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, attrib.buffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, attrib.data, attrib.hint);
            this.gl.enableVertexAttribArray(attrib.location);
            this.gl.vertexAttribPointer(attrib.location, attrib.itemSize, this.gl.FLOAT, false, 0, 0);
        }
    };
    WebGLRenderer.prototype.insertQuad = function (arr, i, x, y, w, h) {
        var x1 = x, y1 = y, x2 = x + w, y2 = y + h;
        arr[i] = x1;
        arr[++i] = y1;
        arr[++i] = x2;
        arr[++i] = y1;
        arr[++i] = x1;
        arr[++i] = y2;
        arr[++i] = x1;
        arr[++i] = y2;
        arr[++i] = x2;
        arr[++i] = y1;
        arr[++i] = x2;
        arr[++i] = y2;
    };
    return WebGLRenderer;
}());
exports.webGLRenderer = function (viewport) {
    return new WebGLRenderer(viewport);
};
