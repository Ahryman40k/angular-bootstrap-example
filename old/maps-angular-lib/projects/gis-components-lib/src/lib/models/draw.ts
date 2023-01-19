/**
 *   List of supported Draw controls in this map library
 *
 * @enum {number}
 */
export enum DrawControls {
  Trash = 'trash'
}

export const SUPPORTED_DRAW_CONTROLS = [DrawControls.Trash];

/**
 * Inteface for the controls of the draw tool
 * 2020-11-03 : for now the only supported tool in this lib is the trash
 *
 */
export interface IDrawControls {
  trash?: string;
}
