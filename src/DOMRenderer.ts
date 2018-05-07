import { Renderer, Viewport } from './unicodetiles'

/// Class: DOMRenderer
/// Renders the <Viewport> into DOM elements.
///
/// *Note:* This is an internal class used by <Viewport>
export class DOMRenderer implements Renderer {
  private colors: string[][]
  private spans: HTMLElement[][]

  constructor(private view: Viewport) {
    // Create a matrix of <span> elements, cache references
    this.spans = new Array(view.h)
    this.colors = new Array(view.h)
    for (let j = 0; j < view.h; ++j) {
      this.spans[j] = new Array(view.w)
      this.colors[j] = new Array(view.w)
      for (let i = 0; i < view.w; ++i) {
        this.spans[j][i] = document.createElement('div')
        view.elem.appendChild(this.spans[j][i])
      }
      // Line break
      this.spans[j].push(document.createElement('br'))
      view.elem.appendChild(this.spans[j][view.w])
    }
    setTimeout(this.updateStyle, 0)
  }

  public render(): void {
    const w = this.view.w,
          h = this.view.h,
          buffer = this.view.buffer,
          defaultColor = this.view.defaultColor,
          defaultBackground = this.view.defaultBackground

    for (let j = 0; j < h; ++j) {
      for (let i = 0; i < w; ++i) {
        let tile = buffer[j][i]
        let span = this.spans[j][i]

        // Check and update colors
        const fg = tile.r === undefined ? defaultColor : tile.getColorRGB()
        const bg = tile.br === undefined ? defaultBackground : tile.getBackgroundRGB()
        const colorHash = fg + bg
        if (colorHash !== this.colors[j][i]) {
          this.colors[j][i] = colorHash
          span.style.color = fg
          span.style.backgroundColor = bg
        }

        // Check and update character
        let ch = tile.getChar()
        if (ch !== span.innerHTML) {
          span.innerHTML = ch
        }
      }
    }
  };

  public updateStyle(s: any) {
    s = window.getComputedStyle(this.spans[0][0], null)
    let tw = parseInt(s.width, 10)
    if (tw === 0 || isNaN(tw)) return // Nothing to do, exit
    const th = parseInt(s.height, 10)
    if (this.view.squarify) tw = th
    const w = this.view.w, h = this.view.h
    for (let j = 0; j < h; ++j) {
      for (let i = 0; i < w; ++i) {
        this.spans[j][i].style.width = tw + 'px'
      }
    }
  };

  public clear(): void {
    for (let j = 0; j < this.view.h; ++j) {
      for (let i = 0; i < this.view.w; ++i) {
        this.colors[j][i] = ''
      }
    }
  };

  public getRendererString(): string {
    return 'dom'
  }
}
