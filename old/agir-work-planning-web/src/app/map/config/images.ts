import { ICustomImage } from 'src/app/shared/models/custom-image';

const iconsPath = './assets/map-icons/';
const imagesPath = './assets/images/';
export const mapImages: ICustomImage[] = [
  {
    id: 'intervention-pin',
    fileName: `${iconsPath}intervention-pin.png`
  },
  {
    id: 'intervention-accepted-pin',
    fileName: `${iconsPath}intervention-accepted-pin.png`
  },
  {
    id: 'intervention-refused-pin',
    fileName: `${iconsPath}intervention-refused-pin.png`
  },
  {
    id: 'intervention-canceled-pin',
    fileName: `${iconsPath}intervention-canceled-pin.png`
  },
  {
    id: 'past-project-pin',
    fileName: `${iconsPath}past-project-pin.png`
  },
  {
    id: 'canceled-project-pin',
    fileName: `${iconsPath}canceled-project-pin.png`
  },
  {
    id: 'planned-project-pin',
    fileName: `${iconsPath}planned-project-pin.png`
  },
  {
    id: 'postponed-project-pin',
    fileName: `${iconsPath}postponed-project-pin.png`
  },
  {
    id: 'final-ordered-project-pin',
    fileName: `${iconsPath}final-ordered-project-pin.png`
  },
  { id: 'replanned-project-pin', fileName: `${iconsPath}replanned-project-pin.png` },
  {
    id: 'programmed-project-pin',
    fileName: `${iconsPath}programmed-project-pin.png`
  },
  {
    id: 'present-project-pin',
    fileName: `${iconsPath}present-project-pin.png`
  },
  {
    id: 'future-project-pin',
    fileName: `${iconsPath}future-project-pin.png`
  },
  {
    id: 'decision-required-pin',
    fileName: `${iconsPath}decision-pin.png`
  },
  {
    id: 'decision-required-not-wished-pin',
    fileName: `${iconsPath}decision-required-not-wished.png`
  },
  {
    id: 'decision-required-wished-pin',
    fileName: `${iconsPath}decision-required-wished.png`
  },
  {
    id: 'decision-not-required-waiting-pin',
    fileName: `${iconsPath}decision-not-required-waiting.png`
  },
  {
    id: 'pattern',
    fileName: `${imagesPath}motif-marine.png`
  },
  {
    id: 'fuchsia-pattern',
    fileName: `${imagesPath}pattern-marine-planned-project.png`
  },
  {
    id: 'address-pin',
    fileName: `${iconsPath}address-pin.png`
  },
  {
    id: 'borough-count-cluster',
    fileName: `${iconsPath}borough-count-cluster.png`
  },
  {
    id: 'borough-count-cluster-hover',
    fileName: `${iconsPath}borough-count-cluster-hover.png`
  },
  {
    id: 'city-count-cluster',
    fileName: `${iconsPath}city-count-cluster.png`
  },
  {
    id: 'asset-pin',
    fileName: `${iconsPath}asset-pin.png`
  },
  {
    id: 'past-rtu-project-pin',
    fileName: `${iconsPath}past-rtu-project-pin.png`
  },
  {
    id: 'present-rtu-project-pin',
    fileName: `${iconsPath}present-rtu-project-pin.png`
  },
  {
    id: 'future-rtu-project-pin',
    fileName: `${iconsPath}future-rtu-project-pin.png`
  },
  {
    id: 'preliminary-ordered-project-pin',
    fileName: `${iconsPath}preliminary-ordered-project-pin.png`
  },
  // criterias
  {
    id: 'criteria-navy-blue',
    fileName: `${iconsPath}criteria-navy-blue.png`
  },
  {
    id: 'criteria-royal-blue',
    fileName: `${iconsPath}criteria-royal-blue.png`
  },
  {
    id: 'criteria-light-blue',
    fileName: `${iconsPath}criteria-light-blue.png`
  },
  {
    id: 'criteria-green',
    fileName: `${iconsPath}criteria-green.png`
  },
  {
    id: 'criteria-yellow',
    fileName: `${iconsPath}criteria-yellow.png`
  }
];
