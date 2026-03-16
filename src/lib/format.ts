export function formatNumber(num: number, digits: number = 9) {
  const rounded = (Math.round(num * 10) / 10).toFixed(1);
  const [intPart, decPart] = rounded.split(".");
  const padded = intPart.padStart(digits, "0");
  const withCommas = padded.replace(/(\d{3})(?=\d)/g, "$1,");
  return `${withCommas}.${decPart}`;
}
