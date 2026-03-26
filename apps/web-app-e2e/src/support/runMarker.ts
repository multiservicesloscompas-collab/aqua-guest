export interface E2ERunMarker {
  id: string;
  notesValue: string;
}

function randomSegment(length = 6): string {
  return Math.random()
    .toString(36)
    .slice(2, 2 + length);
}

export function createRunMarker(): E2ERunMarker {
  const id = `E2E_WATER_SALE_${Date.now()}_${randomSegment()}`;
  return {
    id,
    notesValue: id,
  };
}
