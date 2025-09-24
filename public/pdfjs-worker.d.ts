declare module "pdfjs-dist/legacy/build/pdf" {
  const pdfjsLib: any;
  export = pdfjsLib;
}

declare module "pdfjs-dist/legacy/build/pdf.worker.entry" {
  const workerSrc: any;
  export default workerSrc;
}
