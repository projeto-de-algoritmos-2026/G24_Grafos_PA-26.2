declare module 'jspdf' {
  export default class jsPDF {
    constructor(orientation?: string, unit?: string, format?: string);
    setFontSize(size: number): void;
    text(text: string, x: number, y: number): void;
    addImage(imageData: string, format: string, x: number, y: number, width: number, height: number): void;
    save(filename: string): void;
  }
}
