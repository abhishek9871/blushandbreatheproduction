import Head from 'next/head';
import Link from 'next/link';
import { useEffect } from 'react';

export default function CareersPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openPositions = [
    {
      title: 'Content Curator',
      type: 'Remote',
      department: 'Editorial',
      description: 'Help us discover and curate the best health and beauty content from across the web.'
    },
    {
      title: 'Full Stack Developer',
      type: 'Remote',
      department: 'Engineering',
      description: 'Build features that help millions discover trusted wellness information.'
    },
    {
      title: 'SEO Specialist',
      type: 'Remote',
      department: 'Growth',
      description: 'Optimize our platform to help more people find the health content they need.'
    }
  ];

  return (
    <>
      <Head>
        <title>Careers | Join Blush & Breathe Team</title>
        <meta name="description" content="Join the Blush & Breathe team. We're building the future of health and beauty content curation. Explore remote opportunities in engineering, content, and growth." />
        <meta name="keywords" content="careers, jobs, health tech jobs, remote work, content curator jobs, wellness platform careers" />
        <meta property="og:title" content="Careers at Blush & Breathe" />
        <meta property="og:description" content="Join our mission to make health and beauty information accessible to everyone." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://blushandbreathproduction.vercel.app/info/careers" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-secondary/5 to-transparent dark:from-secondary/10">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 bg-secondary/10 text-secondary rounded-full text-sm font-medium mb-6">
              Careers
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Build the Future of<br className="hidden sm:block" /> Wellness Discovery
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Join a passionate team dedicated to making health and beauty information 
              accessible to everyone, everywhere.
            </p>
          </div>
        </section>

        {/* Why Join Us */}
        <section className="py-12 sm:py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
              Why Join Blush & Breathe?
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: 'home', title: '100% Remote', desc: 'Work from anywhere in the world' },
                { icon: 'schedule', title: 'Flexible Hours', desc: 'We trust you to manage your time' },
                { icon: 'favorite', title: 'Health First', desc: 'Wellness stipend for all team members' },
                { icon: 'trending_up', title: 'Growth', desc: 'Learn and grow with challenging projects' }
              ].map((perk, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                  <span className="material-symbols-outlined text-4xl text-secondary mb-3 block">
                    {perk.icon}
                  </span>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{perk.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{perk.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section className="py-12 sm:py-16 px-4 bg-white dark:bg-gray-800/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
              Open Positions
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-12">
              We&apos;re always looking for talented individuals to join our team.
            </p>
            
            <div className="space-y-4">
              {openPositions.map((job, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 hover:shadow-lg transition-all border border-transparent hover:border-secondary/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {job.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {job.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-secondary/10 text-secondary text-xs rounded-full">
                          {job.type}
                        </span>
                        <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                          {job.department}
                        </span>
                      </div>
                    </div>
                    <Link 
                      href="/info/contact" 
                      className="px-5 py-2.5 bg-secondary text-white rounded-lg font-medium hover:bg-secondary/90 transition-colors text-center whitespace-nowrap"
                    >
                      Apply Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Don't See Your Role */}
        <section className="py-12 sm:py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-secondary/10 to-primary/10 rounded-2xl p-8 sm:p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-secondary mb-4 block">
                mail
              </span>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Don&apos;t See Your Role?
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-lg mx-auto">
                We&apos;re always interested in meeting talented people. Send us your resume 
                and tell us how you can contribute to our mission.
              </p>
              <Link 
                href="/info/contact" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-white rounded-lg font-semibold hover:bg-secondary/90 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">send</span>
                Get in Touch
              </Link>
            </div>
          </div>
        </section>

        {/* Our Culture */}
        <section className="py-12 sm:py-16 px-4 bg-white dark:bg-gray-800/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
              Our Culture
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Mission-Driven',
                  desc: 'We believe in the power of information to transform lives. Every feature we build helps someone make better health decisions.',
                  icon: 'flag'
                },
                {
                  title: 'Continuous Learning',
                  desc: 'The health and wellness space evolves constantly. We encourage curiosity and provide resources for professional development.',
                  icon: 'school'
                },
                {
                  title: 'Work-Life Balance',
                  desc: 'We practice what we preach. A healthy team builds better products. Take time off, disconnect, and recharge.',
                  icon: 'balance'
                }
              ].map((item, i) => (
                <div key={i} className="text-center p-6">
                  <span className="material-symbols-outlined text-4xl text-primary mb-4 block">
                    {item.icon}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
