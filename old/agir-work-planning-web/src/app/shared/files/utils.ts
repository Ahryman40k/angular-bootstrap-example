import { HttpClient } from '@angular/common/http';
import { saveAs } from 'file-saver';

export function base64MimeType(encoded: string): string {
  let result = null;

  if (typeof encoded !== 'string') {
    return result;
  }

  const mime = encoded.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);

  if (mime && mime.length) {
    result = mime[1];
  }

  return result;
}

export function base64Data(dataUrl: string): string {
  return dataUrl.split(',')[1];
}

export function readArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as ArrayBuffer);
    };
    reader.onerror = e => {
      reject(e);
    };
    reader.readAsArrayBuffer(file);
  });
}

export function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = e => {
      reject(e);
    };
    reader.readAsDataURL(file);
  });
}

export function downloadText(filename: string, text: string): void {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

export function downloadFile(filename: string, blob: Blob): void {
  const objectUrl = URL.createObjectURL(blob);
  const element = document.createElement('a');
  element.setAttribute('href', objectUrl);
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
  URL.revokeObjectURL(objectUrl);
}

// This method changes the position and the rank of two elements inside an array according to the two provided indexes
// For instance (arr, 0, 1), the arr[0] becomes arr[1] and vice-versa, the same is applied to the rank
export function swapArrayPositionsAndRanks(arr: any, index1: number, index2: number): void {
  [arr[index1], arr[index2]] = [arr[index2], arr[index1]];
  [arr[index1].rank, arr[index2].rank] = [arr[index2].rank, arr[index1].rank];
}

export async function uploadFile<T>(
  http: HttpClient,
  url: string,
  body: { [key: string]: string | Blob },
  headers?: { [key: string]: string }
): Promise<T> {
  const input = new FormData();
  for (const [key, value] of Object.entries(body)) {
    input.append(key, value);
  }

  return http
    .post<T>(url, input, { headers })
    .toPromise();
}

export function downloadCsvFile(data: any, fileName: string): File {
  const csv = data.join('\n');
  const file = new File([csv], fileName, { type: 'text/csv' });
  saveAs(file);
  return file;
}
