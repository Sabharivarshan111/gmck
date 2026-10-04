import art0 from '@/assets/buddy/originals/cat-classic.png';
import art1 from '@/assets/buddy/originals/cat-soft.png';
import art2 from '@/assets/buddy/originals/cat-bold.png';
import art3 from '@/assets/buddy/originals/dog-classic.png';
import art4 from '@/assets/buddy/originals/dog-soft.png';
import art5 from '@/assets/buddy/originals/dog-bold.png';
import art6 from '@/assets/buddy/originals/fox-classic.png';
import art7 from '@/assets/buddy/originals/fox-soft.png';
import art8 from '@/assets/buddy/originals/fox-bold.png';
import art9 from '@/assets/buddy/originals/panda-classic.png';
import art10 from '@/assets/buddy/originals/panda-soft.png';
import art11 from '@/assets/buddy/originals/panda-bold.png';
import art12 from '@/assets/buddy/originals/rabbit-classic.png';
import art13 from '@/assets/buddy/originals/rabbit-soft.png';
import art14 from '@/assets/buddy/originals/rabbit-bold.png';
import art15 from '@/assets/buddy/originals/otter-classic.png';
import art16 from '@/assets/buddy/originals/otter-soft.png';
import art17 from '@/assets/buddy/originals/otter-bold.png';
import art18 from '@/assets/buddy/originals/penguin-classic.png';
import art19 from '@/assets/buddy/originals/penguin-soft.png';
import art20 from '@/assets/buddy/originals/penguin-bold.png';
import art21 from '@/assets/buddy/originals/bear-classic.png';
import art22 from '@/assets/buddy/originals/bear-soft.png';
import art23 from '@/assets/buddy/originals/bear-bold.png';
import art24 from '@/assets/buddy/originals/squirrel-classic.png';
import art25 from '@/assets/buddy/originals/squirrel-soft.png';
import art26 from '@/assets/buddy/originals/squirrel-bold.png';
// Original artwork from IP as Logo; eye crops are animated at runtime.
export const animalArtwork = {
  'cat-classic': {
    source: art0,
    eyes: [
      { x: 119, y: 187, w: 37, h: 45, skin: '#fef7f1' },
      { x: 214, y: 217, w: 38, h: 44, skin: '#fef6f1' },
    ],
  },
  'cat-soft': {
    source: art1,
    eyes: [
      { x: 91, y: 193, w: 36, h: 43, skin: '#f1dbbc' },
      { x: 199, y: 232, w: 37, h: 42, skin: '#f2ddbd' },
    ],
  },
  'cat-bold': {
    source: art2,
    eyes: [
      { x: 97, y: 159, w: 35, h: 45, skin: '#fde4b5' },
      { x: 199, y: 180, w: 36, h: 44, skin: '#c2b291' },
    ],
  },
  'dog-classic': {
    source: art3,
    eyes: [
      { x: 163, y: 238, w: 32, h: 39, skin: '#fa9f4f' },
      { x: 251, y: 203, w: 32, h: 39, skin: '#f99f4d' },
    ],
  },
  'dog-soft': {
    source: art4,
    eyes: [
      { x: 150, y: 154, w: 33, h: 32, skin: '#696964' },
      { x: 246, y: 133, w: 33, h: 33, skin: '#6a6a66' },
    ],
  },
  'dog-bold': {
    source: art5,
    eyes: [
      { x: 180, y: 269, w: 29, h: 37, skin: '#f1aa7a' },
      { x: 276, y: 243, w: 29, h: 38, skin: '#f1aa79' },
    ],
  },
  'fox-classic': {
    source: art6,
    eyes: [
      { x: 166, y: 228, w: 32, h: 38, skin: '#d75d23' },
      { x: 268, y: 207, w: 30, h: 38, skin: '#d85e23' },
    ],
  },
  'fox-soft': {
    source: art7,
    eyes: [
      { x: 162, y: 236, w: 46, h: 28, skin: '#f8e1c0' },
      { x: 267, y: 213, w: 46, h: 28, skin: '#f8e1bf' },
    ],
  },
  'fox-bold': {
    source: art8,
    eyes: [
      { x: 153, y: 233, w: 31, h: 41, skin: '#f4e3c1' },
      { x: 237, y: 218, w: 31, h: 41, skin: '#f5e4c2' },
    ],
  },
  'panda-classic': {
    source: art9,
    eyes: [
      { x: 109, y: 189, w: 68, h: 80, skin: '#fdfbf6' },
      { x: 232, y: 157, w: 77, h: 74, skin: '#fdfbf7' },
    ],
  },
  'panda-soft': {
    source: art10,
    eyes: [
      { x: 65, y: 169, w: 48, h: 30, skin: '#2e3236' },
      { x: 167, y: 204, w: 48, h: 30, skin: '#2f3237' },
    ],
  },
  'panda-bold': {
    source: art11,
    eyes: [
      { x: 89, y: 192, w: 66, h: 70, skin: '#fcf0da' },
      { x: 196, y: 210, w: 57, h: 72, skin: '#fdefda' },
    ],
  },
  'rabbit-classic': {
    source: art12,
    eyes: [
      { x: 146, y: 243, w: 32, h: 37, skin: '#fceccf' },
      { x: 245, y: 230, w: 32, h: 37, skin: '#fceccf' },
    ],
  },
  'rabbit-soft': {
    source: art13,
    eyes: [
      { x: 127, y: 241, w: 29, h: 31, skin: '#cdcbca' },
      { x: 221, y: 252, w: 29, h: 32, skin: '#cdcac9' },
    ],
  },
  'rabbit-bold': {
    source: art14,
    eyes: [
      { x: 141, y: 200, w: 30, h: 34, skin: '#fefcfa' },
      { x: 237, y: 176, w: 32, h: 37, skin: '#fefcfa' },
    ],
  },
  'otter-classic': {
    source: art15,
    eyes: [
      { x: 86, y: 174, w: 35, h: 34, skin: '#93654a' },
      { x: 216, y: 212, w: 34, h: 34, skin: '#926549' },
    ],
  },
  'otter-soft': {
    source: art16,
    eyes: [
      { x: 138, y: 207, w: 45, h: 47, skin: '#92593b' },
      { x: 266, y: 170, w: 45, h: 48, skin: '#93583c' },
    ],
  },
  'otter-bold': {
    source: art17,
    eyes: [
      { x: 130, y: 208, w: 41, h: 44, skin: '#edd5aa' },
      { x: 265, y: 179, w: 41, h: 44, skin: '#ecd4a9' },
    ],
  },
  'penguin-classic': {
    source: art18,
    eyes: [
      { x: 115, y: 166, w: 36, h: 39, skin: '#fcf2e1' },
      { x: 210, y: 190, w: 36, h: 39, skin: '#fcf4e2' },
    ],
  },
  'penguin-soft': {
    source: art19,
    eyes: [
      { x: 132, y: 189, w: 47, h: 37, skin: '#f9f4e9' },
      { x: 255, y: 147, w: 48, h: 37, skin: '#faf5e9' },
    ],
  },
  'penguin-bold': {
    source: art20,
    eyes: [
      { x: 143, y: 215, w: 34, h: 44, skin: '#f6f2e8' },
      { x: 251, y: 181, w: 35, h: 45, skin: '#f5f1e6' },
    ],
  },
  'bear-classic': {
    source: art21,
    eyes: [
      { x: 102, y: 195, w: 36, h: 40, skin: '#96603a' },
      { x: 218, y: 230, w: 36, h: 40, skin: '#986138' },
    ],
  },
  'bear-soft': {
    source: art22,
    eyes: [
      { x: 123, y: 186, w: 27, h: 34, skin: '#fdf5e8' },
      { x: 251, y: 170, w: 27, h: 34, skin: '#fef8eb' },
    ],
  },
  'bear-bold': {
    source: art23,
    eyes: [
      { x: 84, y: 157, w: 34, h: 36, skin: '#ac693a' },
      { x: 207, y: 189, w: 36, h: 35, skin: '#ad6a3a' },
    ],
  },
  'squirrel-classic': {
    source: art24,
    eyes: [
      { x: 96, y: 221, w: 29, h: 34, skin: '#fcdeae' },
      { x: 186, y: 197, w: 29, h: 33, skin: '#fbdeb0' },
    ],
  },
  'squirrel-soft': {
    source: art25,
    eyes: [
      { x: 120, y: 264, w: 41, h: 46, skin: '#f6dfc0' },
      { x: 226, y: 215, w: 40, h: 45, skin: '#f6e0c0' },
    ],
  },
  'squirrel-bold': {
    source: art26,
    eyes: [
      { x: 53, y: 207, w: 29, h: 34, skin: '#f9e4c7' },
      { x: 147, y: 227, w: 29, h: 34, skin: '#fae6c8' },
    ],
  },
} as const;
export type AnimalArtworkKey = keyof typeof animalArtwork;
