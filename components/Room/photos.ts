// Photos pinned to the pegboard above the desk.
//
// Drop image files into `public/room/photos/` and set `src` (e.g. "/room/photos/trip.jpg").
// Square-ish images work best — they are cropped to the polaroid window.
// Entries without `src` render a generated placeholder picture.

export type RoomPhoto = {
  src?: string;
  /** Position on the pegboard in hole units from its centre (holes are 5 cm apart). */
  col: number;
  row: number;
  /** Tilt in radians. */
  tilt: number;
};

export const ROOM_PHOTOS: RoomPhoto[] = [
  { col: -4, row: 1.6, tilt: 0.06 },
  { col: -1.6, row: 1.8, tilt: -0.05 },
  { col: 1, row: 1.5, tilt: 0.04 },
  { col: 3.6, row: 1.7, tilt: -0.07 },
  { col: -3, row: -1.6, tilt: -0.04 },
  { col: -0.3, row: -1.8, tilt: 0.07 },
  { col: 2.4, row: -1.5, tilt: -0.03 },
];
