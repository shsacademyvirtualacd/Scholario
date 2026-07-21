import React from 'react';

export interface JsonLdSchemaProps {
  siteUrl?: string;
  organizationName?: string;
  logoUrl?: string;
  includeCourses?: boolean;
  includeFaq?: boolean;
}

export const JsonLdSchema: React.FC<JsonLdSchemaProps> = ({
  siteUrl = 'https://scholario.app',
  organizationName = 'Scholario Virtual Academy',
  logoUrl = 'https://scholario.app/favicon.svg',
  includeCourses = true,
  includeFaq = true,
}) => {
  // 1. Organization & EducationalOrganization Schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `${siteUrl}/#organization`,
    name: organizationName,
    alternateName: ['Scholario', 'SHS Academy', 'SHS Virtual Academy'],
    url: siteUrl,
    logo: logoUrl,
    image: `${siteUrl}/og-image.png`,
    description:
      "Scholario is Pakistan's premier Learning Management System — a modern EdTech platform designed for FBISE students, educators, and institutions.",
    email: 'shs.academy.virtual@gmail.com',
    telephone: '+9230586969050',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Rawalpindi',
      addressRegion: 'Punjab',
      addressCountry: 'PK',
    },
    sameAs: [
      'https://www.instagram.com/shs_academy',
      'https://youtube.com/@shsacademy-w5x',
    ],
  };

  // 2. Product & SoftwareApplication Schema
  const softwareProductSchema = {
    '@context': 'https://schema.org',
    '@type': ['SoftwareApplication', 'Product'],
    '@id': `${siteUrl}/#product`,
    name: 'Scholario LMS',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web, Cloud',
    description:
      'Unified Learning Management System featuring live class timetables, structured notes library, attendance tracking, and parent monitoring portal for FBISE education.',
    brand: {
      '@type': 'Brand',
      name: 'Scholario',
    },
    publisher: {
      '@id': `${siteUrl}/#organization`,
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'PKR',
      lowPrice: 2499,
      highPrice: 3499,
      offerCount: 4,
      priceValidUntil: '2026-12-31',
      availability: 'https://schema.org/InStock',
      url: `${siteUrl}/register`,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '128',
      bestRating: '5',
      worstRating: '1',
    },
  };

  // 3. WebSite Schema with Sitelinks SearchBox
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: siteUrl,
    name: 'Scholario',
    description: "Pakistan's Premier Learning Management System for FBISE",
    publisher: {
      '@id': `${siteUrl}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  // 4. FBISE Courses Schemas
  const coursesSchema = includeCourses
    ? [
        {
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: 'FBISE Class 9th Comprehensive Preparation Course',
          description:
            'Complete online course for Federal Board Class 9th featuring Biology and Computer Science streams with live interactive sessions and note vaults.',
          provider: {
            '@type': 'Organization',
            name: organizationName,
            url: siteUrl,
          },
          educationalLevel: 'Secondary Education (9th Grade)',
          offers: [
            {
              '@type': 'Offer',
              category: 'Paid',
              price: 2499,
              priceCurrency: 'PKR',
              availability: 'https://schema.org/InStock',
            },
          ],
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: 'Online',
            courseWorkload: 'PT15H',
          },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: 'FBISE Class 10th Comprehensive Preparation Course',
          description:
            'Complete matriculation preparation for Federal Board Class 10th featuring Biology and Computer Science streams with live timetables and notes.',
          provider: {
            '@type': 'Organization',
            name: organizationName,
            url: siteUrl,
          },
          educationalLevel: 'Secondary Education (10th Grade)',
          offers: [
            {
              '@type': 'Offer',
              category: 'Paid',
              price: 2499,
              priceCurrency: 'PKR',
              availability: 'https://schema.org/InStock',
            },
          ],
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: 'Online',
            courseWorkload: 'PT15H',
          },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: 'FBISE Class 11th FSC & ICS Course (Part 1)',
          description:
            'Intermediate Part 1 prep for Pre-Medical, Pre-Engineering, and ICS streams under Federal Board guidelines with active subject vaults.',
          provider: {
            '@type': 'Organization',
            name: organizationName,
            url: siteUrl,
          },
          educationalLevel: 'Higher Secondary Education (11th Grade / FSC Part 1)',
          offers: [
            {
              '@type': 'Offer',
              category: 'Paid',
              price: 3499,
              priceCurrency: 'PKR',
              availability: 'https://schema.org/InStock',
            },
          ],
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: 'Online',
            courseWorkload: 'PT20H',
          },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: 'FBISE Class 12th FSC & ICS Course (Part 2)',
          description:
            'Intermediate Part 2 prep for Pre-Medical, Pre-Engineering, and ICS streams under Federal Board guidelines with live classes and attendance logs.',
          provider: {
            '@type': 'Organization',
            name: organizationName,
            url: siteUrl,
          },
          educationalLevel: 'Higher Secondary Education (12th Grade / FSC Part 2)',
          offers: [
            {
              '@type': 'Offer',
              category: 'Paid',
              price: 3499,
              priceCurrency: 'PKR',
              availability: 'https://schema.org/InStock',
            },
          ],
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: 'Online',
            courseWorkload: 'PT20H',
          },
        },
      ]
    : [];

  // 5. FAQPage Schema
  const faqSchema = includeFaq
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is Scholario?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Scholario is a modern Learning Management System built exclusively for and operated on behalf of SHS Academy. It serves as a unified portal connecting students, parents, teachers, and administration to streamline the educational experience.',
            },
          },
          {
            '@type': 'Question',
            name: 'Who is eligible to use Scholario?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Scholario access is available to enrolled students, parents/guardians, teachers, and staff members affiliated with SHS Academy for FBISE secondary and higher secondary education.',
            },
          },
          {
            '@type': 'Question',
            name: 'How does the Parent Portal work?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Parent/guardian accounts are linked to their child's student record. Parents get secure, read-only access to view daily class attendance, assignment deadlines, teacher announcements, and term grades.",
            },
          },
          {
            '@type': 'Question',
            name: 'How are fee payments tracked and verified?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Scholario uses a secure manual fee verification process. Payers transfer school fees directly to SHS Academy's bank or mobile wallet accounts, then submit the payment reference or receipt photo inside the portal for administrative verification.",
            },
          },
          {
            '@type': 'Question',
            name: 'Are live classes hosted directly on Scholario?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Scholario manages class timetables and schedules, and provides direct launching links for live classes. The actual live video and audio sessions are hosted externally via integrations with standard tools like Zoom and Google Meet.',
            },
          },
        ],
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareProductSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      {coursesSchema.map((c, idx) => (
        <script
          key={`course-${idx}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(c) }}
        />
      ))}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
    </>
  );
};

export default JsonLdSchema;
