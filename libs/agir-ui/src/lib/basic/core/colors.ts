/*
 * Copyright (c) 2023 Ville de Montreal. All rights reserved.
 * Licensed under the MIT license.
 * See LICENSE file in the project root for full license information.
 */

const colorKindMap = {
  action: '#097D6C',
  primary: '#000000',
  'primary-reversed': '#FFFFFF',
  secondary: '#637381',
  tertiary: '#ADB5BD',
  informative: '#0079C4',
  negative: '#D3310A',
  positive: '#0DA566',
  warning: '#FFB833',
  default: '#097D6C',
};

export type ColorKind = keyof typeof colorKindMap;

export function ColorToHex(color: ColorKind): string {
  return colorKindMap[color] || colorKindMap.default;
}
