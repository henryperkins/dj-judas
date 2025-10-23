import worshipOutdoor from '@/react-app/assets/118356593_10213499559641912_7520418024023544659_n.jpg';
import rehearsalSmile from '@/react-app/assets/119129414_2767285993540352_2150838792970175459_n.jpg';
import praiseTeam from '@/react-app/assets/121920459_2804870329781918_1915198144019307827_n.jpg';
import youthClinic from '@/react-app/assets/125567548_2832403800361904_8388714863051524685_n.jpg';
import bandStage from '@/react-app/assets/490134951_4089878257947779_9135464194249498753_n.jpg';
import directorGuidance from '@/react-app/assets/490539590_4089878487947756_6999358963098825254_n.jpg';
import worshipNight from '@/react-app/assets/490679684_4089878474614424_6667317152643051216_n.jpg';
import outreachVolunteers from '@/react-app/assets/494694210_4110092709259667_4650451242381531522_n.jpg';
import outreachGroup from '@/react-app/assets/497911395_4131116743823930_3710100897030709057_n.jpg';
import groupPortrait from '@/react-app/assets/groupphoto.jpg';

export type GalleryCategory = 'worship' | 'youth choir' | 'community' | 'recording';

export interface LocalGalleryPhoto {
  id: string;
  src: string;
  alt: string;
  caption: string;
  category: GalleryCategory;
}

export const localGalleryPhotos: LocalGalleryPhoto[] = [
  {
    id: 'local-worship-outdoor',
    src: worshipOutdoor,
    alt: 'Outdoor worship set with Voices of Judah leading congregation',
    caption: 'Voices of Judah leading an outdoor worship set in Gary, Indiana.',
    category: 'worship',
  },
  {
    id: 'local-community-rehearsal-fellowship',
    src: rehearsalSmile,
    alt: 'Choir members celebrating after rehearsal',
    caption: 'Smiling choir members fellowship together after Thursday rehearsal.',
    category: 'community',
  },
  {
    id: 'local-worship-praise-team',
    src: praiseTeam,
    alt: 'Praise team singing on sanctuary stage',
    caption: 'Sunday morning praise team ministering on the sanctuary stage.',
    category: 'worship',
  },
  {
    id: 'local-youth-choir-clinic',
    src: youthClinic,
    alt: 'Youth choir practicing harmonies with director',
    caption: 'Northwest Indiana youth choir clinic focused on harmony work.',
    category: 'youth choir',
  },
  {
    id: 'local-recording-band-session',
    src: bandStage,
    alt: 'Band supporting choir during live recording session',
    caption: 'Musicians backing Voices of Judah during a live recording session.',
    category: 'recording',
  },
  {
    id: 'local-worship-director-guidance',
    src: directorGuidance,
    alt: 'Choir director coaching vocalists during rehearsal',
    caption: 'Choir director guiding vocalists through a dynamic rehearsal moment.',
    category: 'worship',
  },
  {
    id: 'local-worship-night-moment',
    src: worshipNight,
    alt: 'Choir lifting hands during worship night',
    caption: 'Unified moment of worship during the regional praise night.',
    category: 'worship',
  },
  {
    id: 'local-community-outreach-meal',
    src: outreachVolunteers,
    alt: 'Volunteers serving meals at community outreach',
    caption: 'Volunteers serving meals during a Gary community outreach event.',
    category: 'community',
  },
  {
    id: 'local-community-outreach-group',
    src: outreachGroup,
    alt: 'Group smiling together after outreach concert',
    caption: 'Voices of Judah posing with supporters after a community concert.',
    category: 'community',
  },
  {
    id: 'local-community-group-portrait',
    src: groupPortrait,
    alt: 'Full Voices of Judah group portrait on church steps',
    caption: 'Entire Voices of Judah ministry team gathered for a portrait.',
    category: 'community',
  },
];