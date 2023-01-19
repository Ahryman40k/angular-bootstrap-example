export enum LayerPrefix {
  HIGHLIGHT = 'highlight',
  HOVER = 'hover',
  PROJECT = 'project'
}
export type LayerPrefixType = LayerPrefix.HIGHLIGHT | LayerPrefix.HOVER | LayerPrefix.PROJECT | '';

export enum LayerPostfix {
  HIGHLIGHT_BORDER = 'highlight-border',
  HOVER_BORDER = 'hover-border',
  OUTLINE = 'outline'
}
export type LayerPostfixType = LayerPostfix.HIGHLIGHT_BORDER | LayerPostfix.HOVER_BORDER | LayerPostfix.OUTLINE | '';

export enum LayerType {
  CIRCLE = 'circle',
  LINE = 'line',
  FILL = 'fill',
  SYMBOL = 'symbol'
}

export enum LayerGeometryType {
  LINE_STRING = 'LineString',
  POINT = 'Point',
  POLYGON = 'Polygon'
}

export enum LayerWidth {
  LINE_BORDER = 4
}
