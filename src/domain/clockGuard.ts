export function clockShift(wallDelta: number, monotonicDelta: number) {
  return wallDelta < 0 || Math.abs(wallDelta - monotonicDelta) > 5000;
}
