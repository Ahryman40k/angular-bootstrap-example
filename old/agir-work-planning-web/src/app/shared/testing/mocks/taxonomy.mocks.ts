import { ITaxonomy } from '@villemontreal/agir-work-planning-lib';

import { DEFAULT_EXECUTOR_CODE } from '../../taxonomies/constants';
const requestorHqPriority = 'requestor.hq.priority';
const requestorBellPriority = 'requestor.bell.priority';
export const taxonomyMocks: { [key: string]: ITaxonomy[] } = {
  requestors: [
    {
      id: '1',
      group: 'requestor',
      code: 'hq',
      label: {
        en: 'Hydro-Quebec',
        fr: 'Hydro-Québec'
      }
    },
    {
      id: '2',
      group: 'requestor',
      code: 'bell',
      label: {
        en: 'Bell',
        fr: 'Bell'
      }
    }
  ],
  executors: [
    {
      id: '1',
      group: 'executor',
      code: DEFAULT_EXECUTOR_CODE,
      label: {
        en: 'Direction des infrastructures',
        fr: 'Infrastructures Manager'
      }
    }
  ],
  all: [
    {
      id: '1',
      group: 'assetOwner',
      code: 'dep',
      label: {
        en: 'DEP',
        fr: 'DEP'
      }
    },
    {
      id: '1',
      group: 'assetOwner',
      code: 'dgrse',
      label: {
        en: 'DGRSE',
        fr: 'DGRSE'
      }
    },
    {
      id: '1',
      group: 'assetType',
      code: 'streetTree',
      label: {
        en: 'Street Tree',
        fr: 'Arbre de rue'
      }
    },
    {
      id: '1',
      group: 'assetType',
      code: 'fireHydrant',
      label: {
        en: 'Fire Hydrant',
        fr: 'Borne fontaine'
      }
    },
    {
      id: '1',
      group: 'assetOwner',
      code: 'dep',
      label: {
        en: 'DEP',
        fr: 'DEP'
      }
    },
    {
      id: '1',
      group: 'assetOwnership',
      code: 'fireHydrant',
      label: {
        en: '',
        fr: ''
      },
      valueString1: 'dep'
    },
    {
      id: '1',
      group: 'requestor',
      code: 'hq',
      label: {
        en: 'Hydro-Quebec',
        fr: 'Hydro-Québec'
      }
    },
    {
      id: '1',
      group: 'requestor',
      code: 'bell',
      label: {
        en: 'Bell',
        fr: 'Bell'
      }
    },
    {
      id: '1',
      group: 'requestor.hq.contactInfo',
      code: 'simon.villiard',
      label: {
        en: 'Simon Villiard',
        fr: 'Simon Villiard'
      }
    },
    {
      id: '1',
      group: 'requestor.hq.contactInfo',
      code: 'michael.lavigne',
      label: {
        en: 'Michael Lavigne',
        fr: 'Michael Lavigne'
      }
    },
    {
      id: '1',
      group: 'requestor.bell.contactInfo',
      code: 'martin.carpentier',
      label: {
        en: 'Martin Carpentier',
        fr: 'Martin Carpentier'
      }
    },
    {
      id: '1',
      group: 'requestor.bell.contactInfo',
      code: 'julien.blanchard',
      label: {
        en: 'Julien Blanchard',
        fr: 'Julien Blanchard'
      }
    },
    {
      id: '1',
      group: requestorHqPriority,
      code: '1',
      label: {
        en: '1',
        fr: '1'
      }
    },
    {
      id: '1',
      group: requestorHqPriority,
      code: '2',
      label: {
        en: '2',
        fr: '2'
      }
    },
    {
      id: '1',
      group: requestorHqPriority,
      code: '3',
      label: {
        en: '3',
        fr: '3'
      }
    },
    {
      id: '1',
      group: requestorHqPriority,
      code: '4',
      label: {
        en: '4',
        fr: '4'
      }
    },
    {
      id: '1',
      group: requestorBellPriority,
      code: '100',
      label: {
        en: '100',
        fr: '100'
      }
    },
    {
      id: '1',
      group: requestorBellPriority,
      code: '200',
      label: {
        en: '200',
        fr: '200'
      }
    },
    {
      id: '1',
      group: requestorBellPriority,
      code: '300',
      label: {
        en: '300',
        fr: '300'
      }
    },
    {
      id: '1',
      group: requestorBellPriority,
      code: '400',
      label: {
        en: '400',
        fr: '400'
      }
    },
    {
      id: '1',
      group: 'programType',
      code: 'so',
      label: {
        en: 'No Subject',
        fr: 'Sans-Objet'
      }
    },
    {
      id: '1',
      group: 'programType',
      code: 'pcpr',
      label: {
        en: 'PCPR',
        fr: 'PCPR'
      }
    },
    {
      id: '1',
      group: 'programType',
      code: 'PRCPR',
      label: {
        en: 'PRCPR',
        fr: 'PRCPR'
      }
    },
    {
      id: '1',
      group: 'interventionType',
      code: 'reconstruction',
      label: {
        en: 'Reconstruction',
        fr: 'Reconstruction'
      }
    },
    {
      id: '1',
      group: 'interventionType',
      code: 'rehabilitation',
      label: {
        en: 'Rehabilitation',
        fr: 'Réhabilitation'
      }
    }
  ]
};
