export function convertIdsToString<T, U>(doc: T | T[], paths: string[], convertValue: (obj: U) => string) {
  for (const path of paths) {
    const pathSections = path.split('.');
    const lastSection = pathSections[pathSections.length - 1];
    conversionMachine(doc, pathSections, lastSection, convertValue);
  }
}

function conversionMachine(obj: any, pathSections: string[], lastSection: string, convertValue: (obj: any) => string) {
  const pathSection = pathSections.shift();
  if (!pathSection || !obj[pathSection]) {
    return;
  }
  if (Array.isArray(obj[pathSection])) {
    const ids: string[] = [];
    for (const item of obj[pathSection]) {
      if (!item) {
        return;
      }
      if (pathSection === lastSection) {
        ids.push(convertValue(item));
      } else {
        conversionMachine(item, [...pathSections, pathSection], lastSection, convertValue);
      }
    }
    if (ids.length) {
      obj[pathSection] = ids;
    }
  } else if (obj[lastSection]) {
    obj[lastSection] = convertValue(obj[lastSection]);
  } else if (obj[pathSection]) {
    conversionMachine(obj[pathSection], pathSections, lastSection, convertValue);
  }
}
