import { Renderer, Viewport } from './unicodetiles'

/// Class: CanvasRenderer
/// Renders the <Viewport> into an HTML5 <canvas> element.
///
/// *Note:* This is an internal class used by <Viewport>
class CanvasRenderer implements Renderer {
  private canvas: HTMLCanvasElement
  private offscreen: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private ctx2: CanvasRenderingContext2D

  private th?: number
  private tw?: number
  private gap?: number

  constructor(private view: Viewport) {
    this.canvas = document.createElement('canvas')
    if (!this.canvas.getContext) throw('Canvas not supported')
    this.ctx2 = this.canvas.getContext('2d')
    if (!this.ctx2 || !this.ctx2.fillText) throw('Canvas not supported')
    view.elem.appendChild(this.canvas)

    // Create an offscreen canvas for rendering
    this.offscreen = document.createElement('canvas')
    this.ctx = this.offscreen.getContext('2d')
    this.updateStyle()
    this.canvas.width = (view.squarify ? this.th : this.tw) * view.w
    this.canvas.height = this.th * view.h
    this.offscreen.width = this.canvas.width
    this.offscreen.height = this.canvas.height
    // Doing this again since setting canvas w/h resets the state
    this.updateStyle()
  }

  public getRendererString(): string { return 'canvas' }

  public updateStyle(s?: any) {
    s = s || window.getComputedStyle(this.view.elem, null)
    this.ctx.font = `${s.fontSize}/${s.lineHeight} ${s.fontFamily}`
    this.ctx.textBaseline = 'middle'
    this.tw = this.ctx.measureText('M').width
    this.th = parseInt(s.fontSize, 10)
    this.gap = this.view.squarify ? (this.th - this.tw) : 0
    if (this.view.squarify) this.tw = this.th
  }

  public clear() { /* No op */ }

  public render() {
    let tile, ch, fg, bg, x, y
    const view = this.view,
          buffer = this.view.buffer,
          w = view.w, h = view.h,
          hth = 0.5 * this.th,
          hgap = 0.5 * this.gap // Squarification

    // Clearing with one big rect is much faster than with individual char rects
    this.ctx.fillStyle = view.defaultBackground
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    y = hth // half because textBaseline is middle
    for (let j = 0; j < h; ++j) {
      x = 0
      for (let i = 0; i < w; ++i) {
        tile = buffer[j][i]
        ch = tile.ch
        fg = tile.getColorRGB()
        bg = tile.getBackgroundRGB()
        // Only render background if the color is non-default
        if (bg.length && bg !== view.defaultBackground) {
          this.ctx.fillStyle = bg
          this.ctx.fillRect(x, y - hth, this.tw, this.th)
        }
        // Do not attempt to render empty char
        if (ch.length) {
          if (!fg.length) fg = view.defaultColor
          this.ctx.fillStyle = fg
          this.ctx.fillText(ch, x + hgap, y)
        }
        x += this.tw
      }
      y += this.th
    }
    this.ctx2.drawImage(this.offscreen, 0, 0)
  }
}

export const canvasRenderer = function(viewport: Viewport): Renderer {
  return new CanvasRenderer(viewport)
}
