export interface Testimonial {
  id: string;
  text: string;
  author: string;
  role?: string;
  location?: string;
  rating: number;
  date?: string;
  eventType?: string;
}

export const testimonials: Testimonial[] = [
  {
    id: '1',
    text: 'DJ Lee & Voices of Judah brought such an anointed atmosphere to our church service. Their ministry through music truly touched every heart in the congregation.',
    author: 'Pastor Michael Johnson',
    role: 'Senior Pastor',
    location: 'Gary, IN',
    rating: 5,
    eventType: 'Worship Service'
  },
  {
    id: '2',
    text: 'The choir\'s performance at our community gospel fest was absolutely phenomenal. They had everyone on their feet praising God!',
    author: 'Sarah Williams',
    role: 'Event Coordinator',
    location: 'Chicago, IL',
    rating: 5,
    eventType: 'Gospel Concert'
  },
  {
    id: '3',
    text: 'We\'ve been blessed to have DJ Lee & Voices of Judah minister at our annual revival for three years running. They never disappoint!',
    author: 'Deacon Robert Davis',
    role: 'Music Ministry Director',
    location: 'Hammond, IN',
    rating: 5,
    eventType: 'Church Revival'
  },
  {
    id: '4',
    text: 'Their rendition of "I Love to Praise Him" during our wedding ceremony was absolutely beautiful. It was exactly what we envisioned for our special day.',
    author: 'Marcus & Angela Thompson',
    role: 'Newlyweds',
    location: 'Merrillville, IN',
    rating: 5,
    eventType: 'Wedding Ceremony'
  },
  {
    id: '5',
    text: 'The youth were so inspired by their performance and testimony. DJ Lee has a gift for connecting with young people through gospel music.',
    author: 'Minister Tracey Brooks',
    role: 'Youth Pastor',
    location: 'East Chicago, IN',
    rating: 5,
    eventType: 'Youth Conference'
  },
  {
    id: '6',
    text: 'Having them minister at my mother\'s homegoing service brought such comfort to our family. Their voices truly carried the presence of God.',
    author: 'James Mitchell',
    role: 'Family Member',
    location: 'Gary, IN',
    rating: 5,
    eventType: 'Funeral Service'
  }
];

export const featuredTestimonial = {
  text: 'For over a decade, DJ Lee & Voices of Judah have been a cornerstone of gospel music in Northwest Indiana. Their dedication to ministry and excellence in worship is unmatched.',
  author: 'Bishop William Crawford',
  platform: 'Greater Faith Community Church',
  role: 'Presiding Bishop'
};