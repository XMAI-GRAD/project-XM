export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ArtworkPoint {
  x: number;
  y: number;
}

export interface CalibrationLandmark {
  id: string;
  name: string;
  coordinates: Coordinates;
  image: ArtworkPoint;
  source: string;
}

export interface MapCalibration {
  researchedOn: string;
  artwork: { src: string; width: number; height: number; sha256: string };
  origin: Coordinates;
  maxCheckErrorPixels: number;
  controls: CalibrationLandmark[];
  checks: CalibrationLandmark[];
}

export interface ArtworkTransform {
  origin: Coordinates;
  x: number[];
  y: number[];
}

export function validCoordinates(point: Coordinates): boolean {
  return (
    Number.isFinite(point?.latitude) &&
    Number.isFinite(point?.longitude) &&
    Math.abs(point.latitude) <= 85.05112878 &&
    Math.abs(point.longitude) <= 180
  );
}

// EPSG:3857 metres relative to a nearby origin, keeping the least-squares
// calculation well-conditioned. Image y grows downward; northing grows upward.
function projected(point: Coordinates, origin: Coordinates): number[] {
  if (!validCoordinates(point) || !validCoordinates(origin))
    throw new Error("Invalid coordinates for Web Mercator");
  const radians = Math.PI / 180;
  const northing = (latitude: number) =>
    Math.log(Math.tan(Math.PI / 4 + (latitude * radians) / 2));
  return [
    6378137 * (point.longitude - origin.longitude) * radians,
    6378137 * (northing(point.latitude) - northing(origin.latitude)),
    1,
  ];
}

function solve(matrix: number[][], values: number[]): number[] {
  const rows = matrix.map((row, i) => [...row, values[i]]);
  for (let col = 0; col < 3; col++) {
    let pivot = col;
    for (let row = col + 1; row < 3; row++)
      if (Math.abs(rows[row][col]) > Math.abs(rows[pivot][col])) pivot = row;
    if (Math.abs(rows[pivot][col]) < 1e-9)
      throw new Error("Map control points are collinear or duplicated");
    [rows[col], rows[pivot]] = [rows[pivot], rows[col]];
    const divisor = rows[col][col];
    for (let j = col; j < 4; j++) rows[col][j] /= divisor;
    for (let row = 0; row < 3; row++) {
      if (row === col) continue;
      const factor = rows[row][col];
      for (let j = col; j < 4; j++) rows[row][j] -= factor * rows[col][j];
    }
  }
  return rows.map((row) => row[3]);
}

export function fitArtworkTransform(
  origin: Coordinates,
  controls: CalibrationLandmark[],
): ArtworkTransform {
  if (controls.length < 3)
    throw new Error("At least three map control points are required");
  const matrix = Array.from({ length: 3 }, () => [0, 0, 0]);
  const x = [0, 0, 0],
    y = [0, 0, 0];
  for (const control of controls) {
    if (!Number.isFinite(control.image.x) || !Number.isFinite(control.image.y))
      throw new Error("Invalid artwork control point");
    const p = projected(control.coordinates, origin);
    for (let i = 0; i < 3; i++) {
      x[i] += p[i] * control.image.x;
      y[i] += p[i] * control.image.y;
      for (let j = 0; j < 3; j++) matrix[i][j] += p[i] * p[j];
    }
  }
  return { origin, x: solve(matrix, x), y: solve(matrix, y) };
}

export function projectToArtwork(
  point: Coordinates,
  transform: ArtworkTransform,
): ArtworkPoint {
  const p = projected(point, transform.origin);
  return {
    x: p.reduce((sum, value, i) => sum + value * transform.x[i], 0),
    y: p.reduce((sum, value, i) => sum + value * transform.y[i], 0),
  };
}
