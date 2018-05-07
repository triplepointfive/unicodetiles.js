"use strict";
/// Class: DOMRenderer
/// Renders the <Viewport> into DOM elements.
///
/// *Note:* This is an internal class used by <Viewport>
var DOMRenderer = (function () {
    function DOMRenderer(view) {
        this.view = view;
        // Create a matrix of <span> elements, cache references
        this.spans = new Array(view.h);
        this.colors = new Array(view.h);
        for (var j = 0; j < view.h; ++j) {
            this.spans[j] = new Array(view.w);
            this.colors[j] = new Array(view.w);
            for (var i = 0; i < view.w; ++i) {
                this.spans[j][i] = document.createElement('div');
                view.elem.appendChild(this.spans[j][i]);
            }
            // Line break
            this.spans[j].push(document.createElement('br'));
            view.elem.appendChild(this.spans[j][view.w]);
        }
        setTimeout(this.updateStyle, 0);
    }
    DOMRenderer.prototype.render = function () {
        var w = this.view.w, h = this.view.h, buffer = this.view.buffer, defaultColor = this.view.defaultColor, defaultBackground = this.view.defaultBackground;
        for (var j = 0; j < h; ++j) {
            for (var i = 0; i < w; ++i) {
                var tile = buffer[j][i];
                var span = this.spans[j][i];
                // Check and update colors
                var fg = tile.r === undefined ? defaultColor : tile.getColorRGB();
                var bg = tile.br === undefined ? defaultBackground : tile.getBackgroundRGB();
                var colorHash = fg + bg;
                if (colorHash !== this.colors[j][i]) {
                    this.colors[j][i] = colorHash;
                    span.style.color = fg;
                    span.style.backgroundColor = bg;
                }
                // Check and update character
                var ch = tile.getChar();
                if (ch !== span.innerHTML) {
                    span.innerHTML = ch;
                }
            }
        }
    };
    ;
    DOMRenderer.prototype.updateStyle = function (s) {
        s = window.getComputedStyle(this.spans[0][0], null);
        var tw = parseInt(s.width, 10);
        if (tw === 0 || isNaN(tw))
            return; // Nothing to do, exit
        var th = parseInt(s.height, 10);
        if (this.view.squarify)
            tw = th;
        var w = this.view.w, h = this.view.h;
        for (var j = 0; j < h; ++j) {
            for (var i = 0; i < w; ++i) {
                this.spans[j][i].style.width = tw + 'px';
            }
        }
    };
    ;
    DOMRenderer.prototype.clear = function () {
        for (var j = 0; j < this.view.h; ++j) {
            for (var i = 0; i < this.view.w; ++i) {
                this.colors[j][i] = '';
            }
        }
    };
    ;
    DOMRenderer.prototype.getRendererString = function () {
        return 'dom';
    };
    return DOMRenderer;
}());
exports.domRenderer = function (viewport) {
    return new DOMRenderer(viewport);
};
