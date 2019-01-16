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
    backgroundToColor(): void;
    swapColors(): void;
    resetColor(): void;
    resetBackground(): void;
    getColorHex(): string;
    getBackgroundHex(): string;
    getColorRGB(): string;
    getBackgroundRGB(): string;
    getColorJSON(): {
        r: number;
        g: number;
        b: number;
    } | {
        r?: undefined;
        g?: undefined;
        b?: undefined;
    };
    getBackgroundJSON(): {
        r: number;
        g: number;
        b: number;
    } | {
        r?: undefined;
        g?: undefined;
        b?: undefined;
    };
    copy(other: Tile): void;
    clone(): Tile;
}
export declare const VERSION = "2.1";
export declare const NULLCHAR = " ";
export declare const CSSCLASS = "unicodetiles";
export declare const NULLTILE: Tile;
export interface Renderer {
    updateStyle(s?: any): void;
    getRendererString(): string;
    clear(): void;
    render(): void;
}
export declare class Viewport {
    elem: Element;
    w: number;
    h: number;
    squarify: boolean;
    cx: number;
    cy: number;
    buffer: Tile[][];
    renderer: Renderer;
    defaultColor?: string;
    defaultBackground?: string;
    constructor(elem: Element, w: number, h: number, renderer: (viewport: Viewport) => Renderer, squarify?: boolean);
    private updateStyle(updateRenderer);
    getRendererString(): string;
    put(tile: Tile, x: number, y: number): void;
    unsafePut(tile: Tile, x: number, y: number): void;
    putString(str: string, x: number, y: number, r?: number, g?: number, b?: number, br?: number, bg?: number, bb?: number): void;
    get(x: number, y: number): Tile;
    clear(): void;
    render(): void;
}
export declare class Engine {
    viewport: Viewport;
    tileFunc: (x: number, y: number) => Tile;
    w: number;
    h: number;
    private refreshCache;
    private cacheEnabled;
    private transitionTimer?;
    private transitionDuration;
    private transition?;
    private maskFunc?;
    private shaderFunc?;
    private cachex;
    private cachey;
    private tileCache;
    private tileCache2;
    constructor(viewport: Viewport, tileFunc: (x: number, y: number) => Tile, w: number, h: number);
    setTileFunc(func: (x: number, y: number) => Tile, effect?: string, duration?: number): void;
    setMaskFunc(func: (x: number, y: number) => boolean): void;
    setShaderFunc(func: (tile: Tile, x: number, y: number) => Tile): void;
    setWorldSize(width: number, height: number): void;
    setCacheEnabled(mode: boolean): void;
    update(x?: number, y?: number): void;
}
