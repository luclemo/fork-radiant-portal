// Vite's `?raw` import: the file's text as a string (the HPO mock data).
declare module '*?raw' {
  const text: string;
  export default text;
}
