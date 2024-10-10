export async function sleep(delayInMs: number) {
  return new Promise((resolve) => setTimeout(resolve, delayInMs));
}

export const addCityInName = (str: string): string =>
  `${str}${str.toLowerCase().includes("lille") ? "" : " lille"}`;
