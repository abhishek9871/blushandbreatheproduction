import React from 'react';
import { useParams } from 'react-router-dom';

const SECTIONS: Record<string, { title: string; body: string }> = {
  about: {
    title: 'Our Story',
    body: 'We believe in simple, reliable health and beauty guidance you can trust.'
  },
  careers: {
    title: 'Careers',
    body: 'Join a small team building helpful experiences for everyone.'
  },
  press: {
    title: 'Press',
    body: 'For media inquiries, please reach out via our contact page.'
  },
  contact: {
    title: 'Contact Us',
    body: 'Have a question? We are here to help.'
  },
  faq: {
    title: 'FAQ',
    body: 'Answers to common questions about our features and content.'
  },
  shipping: {
    title: 'Shipping',
    body: 'Standard shipping details and timelines.'
  },
  returns: {
    title: 'Returns',
    body: 'Return policy and how to start a return.'
  },
  terms: {
    title: 'Terms of Service',
    body: 'The terms that govern your use of this site.'
  },
  privacy: {
    title: 'Privacy Policy',
    body: 'How we handle your data and your privacy choices.'
  }
};

const InfoPage: React.FC = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const key = String(slug || '').toLowerCase();
  const section = SECTIONS[key] || { title: 'Info', body: 'Information page.' };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight">{section.title}</h1>
      <p className="mt-4 text-base text-text-subtle-light dark:text-text-subtle-dark">{section.body}</p>
    </main>
  );
};

export default InfoPage;
