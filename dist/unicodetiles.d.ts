export declare class Tile {
    ch: string;
    r: number;
    g: number;
    b: number;
    br: number;
    bg: number;
    bb: number;
    constructor(ch: string, r?: number, g?: number, b?: number, br?: number, bg?: number, bb?: number);
    getChar(): string;
    setChar(ch: string): void;
    setColor(r: number, g: number, b: number): void;
    setGrey(grey: number): void;
    setBackground(r: number, g: number, b: number): void;
    resetColor(): void;
    resetBackground(): void;
    getColorHex(): string;
    getBackgroundHex(): string;
    getColorRGB(): string;
    getBackgroundRGB(): string;
    getColorJSON(): {
        'r': number;
        'g': number;
        'b': number;
    } | {};
    getBackgroundJSON(): {
        'r': number;
        'g': number;
        'b': number;
    } | {};
    copy(other: Tile): void;
    clone(): Tile;
}
export declare const VERSION = "2.1";
export interface Renderer {
    updateStyle(s?: any): void;
    getRendererString(): string;
    clear(): void;
    render(): void;
}
export declare class Viewport {
    elem: HTMLElement;
    w: number;
    h: number;
    squarify: boolean;
    cx: number;
    cy: number;
    buffer: Tile[][];
    renderer: Renderer;
    defaultColor?: string;
    defaultBackground?: string;
    constructor(elem: HTMLElement, w: number, h: number, renderer: (viewport: Viewport) => Renderer, squarify?: boolean);
    private updateStyle(updateRenderer);
    getRendererString(): string;
    put(tile: Tile, x: number, y: number): void;
    unsafePut(tile: Tile, x: number, y: number): void;
    putString(str: string, x: number, y: number, r?: number, g?: number, b?: number, br?: number, bg?: number, bb?: number): void;
    get(x: number, y: number): Tile;
    clear(): void;
    render(): void;
}
