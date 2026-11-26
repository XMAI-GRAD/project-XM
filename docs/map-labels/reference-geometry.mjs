// Liang–Barsky segment clipping. Preserve disconnected pieces; never bridge gaps.
export function clipLine(line, [west, south, east, north]) {
  const result = [];
  let current = [];
  for (let i = 1; i < line.length; i++) {
    const [ax, ay] = line[i - 1],
      [bx, by] = line[i];
    const dx = bx - ax,
      dy = by - ay;
    let lo = 0,
      hi = 1,
      accepted = true;
    const p = [-dx, dx, -dy, dy],
      q = [ax - west, east - ax, ay - south, north - ay];
    for (let k = 0; k < 4; k++) {
      if (p[k] === 0) {
        if (q[k] < 0) accepted = false;
      } else if (p[k] < 0) lo = Math.max(lo, q[k] / p[k]);
      else hi = Math.min(hi, q[k] / p[k]);
    }
    if (!accepted || lo > hi) {
      if (current.length > 1) result.push(current);
      current = [];
      continue;
    }
    const start = [ax + dx * lo, ay + dy * lo],
      end = [ax + dx * hi, ay + dy * hi];
    const last = current.at(-1);
    if (
      last &&
      (Math.abs(last[0] - start[0]) > 1e-10 ||
        Math.abs(last[1] - start[1]) > 1e-10)
    ) {
      if (current.length > 1) result.push(current);
      current = [];
    }
    if (!current.length) current.push(start);
    current.push(end);
  }
  if (current.length > 1) result.push(current);
  return result;
}
