export function smallFunction() {
  return "small from webpack";
}

export function largeFunction() {
  // simulate large unused code
  const big = Array(1000)
    .fill(0)
    .map((_, i) => i)
    .join(",");
  return `large ${big}`;
}
