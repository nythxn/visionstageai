
import React from 'react';
import { StagingStyle } from './types';

export const STAGING_STYLES: StagingStyle[] = [
  {
    id: 'magic',
    name: 'AI Magic Makeover',
    description: 'The "Everything" option. High-end professional staging, optimized lighting, and luxury decor for maximum buyer appeal.',
    prompt: 'Perform a total professional makeover on this room. Modernize the furniture, optimize the lighting, add high-end decor, and ensure the space looks exceptionally warm, inviting, and expensive for a luxury real estate listing. Preserve the existing architecture, flooring, and windows perfectly.',
    icon: '✨'
  },
  {
    id: 'modern',
    name: 'Modern Luxury',
    description: 'Clean lines, neutral palette, and high-end contemporary furniture.',
    prompt: 'Virtually stage this room in a high-end Modern Luxury style. Add sleek contemporary furniture, minimalist decor, and elegant light fixtures. Keep the walls, windows, and floors exactly as they are.',
    icon: '🏢'
  },
  {
    id: 'rustic',
    name: 'Rustic Charm',
    description: 'Warm wood tones, cozy textiles, and a farmhouse aesthetic.',
    prompt: 'Virtually stage this room in a warm Rustic Charm style. Add wooden furniture, soft cozy textiles, farmhouse-style decor, and warm lighting. Preserve the existing architecture perfectly.',
    icon: '🏡'
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    description: 'Bright, airy, functional, and simple with light wood accents.',
    prompt: 'Virtually stage this room in a bright Scandinavian style. Use light-colored wood, functional furniture, and a clean white/grey palette. Maintain the room structure exactly.',
    icon: '❄️'
  },
  {
    id: 'industrial',
    name: 'Industrial Loft',
    description: 'Raw materials, dark metals, and vintage leather elements.',
    prompt: 'Virtually stage this room in an Industrial Loft style. Add metal-framed furniture, vintage leather seating, and Edison bulb lighting. Keep the original floors and walls.',
    icon: '🏭'
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Only the essentials. Space-maximizing and clutter-free.',
    prompt: 'Virtually stage this room in a Minimalist style. Add only essential furniture with simple shapes and a monochrome palette. Ensure the room architecture remains unchanged.',
    icon: '⚪'
  },
  {
    id: 'empty',
    name: 'Empty Room',
    description: 'Remove all existing furniture to show the raw space.',
    prompt: 'Virtually de-stage this room. Remove every single piece of furniture, rug, and wall decor to reveal a completely empty space. The architecture, flooring, and windows must remain identical.',
    icon: '🧹'
  }
];
