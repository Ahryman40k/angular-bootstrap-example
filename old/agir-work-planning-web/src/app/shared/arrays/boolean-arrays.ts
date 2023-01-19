export function arrayOfYesNo(): { value: boolean; label: { en: string; fr: string } }[] {
  return [
    {
      value: undefined,
      label: {
        en: '',
        fr: ''
      }
    },
    {
      value: true,
      label: {
        en: 'Yes',
        fr: 'Oui'
      }
    },
    {
      value: false,
      label: {
        en: 'No',
        fr: 'Non'
      }
    }
  ];
}
