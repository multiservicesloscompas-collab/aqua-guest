/** An expense amount typed in the form must be a finite number greater than 0. */
export function isValidExpenseAmount(input: string): boolean {
  if (input.trim() === '') return false;
  const value = Number(input);
  return Number.isFinite(value) && value > 0;
}
