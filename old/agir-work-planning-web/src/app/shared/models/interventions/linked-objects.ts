export interface ILinkedObject {
  label: string;
  value: boolean;
}

export const linkedObjects: ILinkedObject[] = [
  { label: 'Intervention', value: false },
  { label: 'Project', value: true }
];
