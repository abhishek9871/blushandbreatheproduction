import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const InfoPage: React.FC = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const key = String(slug || '').toLowerCase();
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [contactMessage, setContactMessage] = useState('');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactStatus('sending');
    setContactMessage('');

    try {
      const response = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });

      if (response.ok) {
        setContactStatus('success');
        setContactMessage('Thanks for reaching out! We\'ll get back to you soon.');
        setContactForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setContactStatus('error');
        setContactMessage('Failed to send message. Please try again.');
      }
    } catch (error) {
      setContactStatus('error');
      setContactMessage('Failed to send message. Please try again.');
    }

    setTimeout(() => {
      setContactStatus('idle');
      setContactMessage('');
    }, 5000);
  };

  const renderContent = () => {
    switch (key) {
      case 'about':
        return (
          <div className="space-y-12">
            <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl">
              <span className="material-symbols-outlined text-5xl text-primary">favorite</span>
              <div>
                <h2 className="text-2xl font-bold mb-2">Our Mission</h2>
                <p className="text-lg text-text-subtle-light dark:text-text-subtle-dark">Empowering your wellness journey with trusted health and beauty insights.</p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Who We Are</h3>
              <p className="text-text-subtle-light dark:text-text-subtle-dark leading-relaxed mb-4">
                HealthBeauty Hub is your trusted companion in the world of health, beauty, and wellness. We're a passionate team of health enthusiasts, beauty experts, and nutrition specialists dedicated to bringing you the most reliable and up-to-date information to help you make informed decisions about your wellbeing.
              </p>
              <p className="text-text-subtle-light dark:text-text-subtle-dark leading-relaxed">
                Founded with the belief that everyone deserves access to quality health and beauty information, we've created a platform that aggregates content from trusted sources, curates products from reputable sellers, and provides educational resources to help you on your wellness journey.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl">
                <span className="material-symbols-outlined text-4xl text-primary mb-3 block">verified</span>
                <h4 className="font-bold mb-2">Trusted Sources</h4>
                <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">We aggregate content from PubMed, verified beauty brands, and certified nutrition databases.</p>
              </div>
              <div className="p-6 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl">
                <span className="material-symbols-outlined text-4xl text-secondary mb-3 block">diversity_3</span>
                <h4 className="font-bold mb-2">Community First</h4>
                <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">Your health and satisfaction are our top priorities. We're here to support your wellness goals.</p>
              </div>
              <div className="p-6 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl">
                <span className="material-symbols-outlined text-4xl text-accent mb-3 block">school</span>
                <h4 className="font-bold mb-2">Education Focused</h4>
                <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">We believe in empowering you with knowledge to make the best choices for your health.</p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">What Makes Us Different</h3>
              <ul className="space-y-3">
                {[
                  'Content aggregation from multiple trusted sources including PubMed and verified health databases',
                  'Product curation exclusively from eBay\'s verified sellers and established brands',
                  'Comprehensive nutrition tracking and meal planning tools powered by USDA data',
                  'Educational videos and articles to help you understand health and beauty topics',
                  'No sales pressure - we\'re here to inform, not to push products'
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="material-symbols-outlined text-primary mt-1">check_circle</span>
                    <span className="text-text-subtle-light dark:text-text-subtle-dark">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      case 'careers':
        return (
          <div className="space-y-12">
            <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl">
              <span className="material-symbols-outlined text-5xl text-primary">work</span>
              <div>
                <h2 className="text-2xl font-bold mb-2">Join Our Team</h2>
                <p className="text-lg text-text-subtle-light dark:text-text-subtle-dark">Help us empower people to make better health and beauty choices.</p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Why Work With Us</h3>
              <p className="text-text-subtle-light dark:text-text-subtle-dark leading-relaxed mb-6">
                At HealthBeauty Hub, we're building more than just a website - we're creating a movement toward informed wellness decisions. Our team is small, passionate, and dedicated to making a real impact in people's lives.
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {[
                  { icon: 'home', title: 'Remote-First', desc: 'Work from anywhere in the world. We value output, not office hours.' },
                  { icon: 'schedule', title: 'Flexible Hours', desc: 'Set your own schedule. We trust you to manage your time effectively.' },
                  { icon: 'trending_up', title: 'Growth Opportunities', desc: 'Learn new skills and grow with us as we expand our platform.' },
                  { icon: 'favorite', title: 'Health Focused', desc: 'We practice what we preach. Your wellbeing matters to us.' }
                ].map((benefit, idx) => (
                  <div key={idx} className="flex gap-4 p-4 border border-border-light dark:border-border-dark rounded-lg">
                    <span className="material-symbols-outlined text-3xl text-primary">{benefit.icon}</span>
                    <div>
                      <h4 className="font-bold mb-1">{benefit.title}</h4>
                      <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Open Positions</h3>
              <div className="space-y-4">
                {[
                  { role: 'Full-Stack Developer', type: 'Full-time', location: 'Remote', desc: 'Help us build and scale our platform with React, TypeScript, and Cloudflare Workers.' },
                  { role: 'Content Curator', type: 'Part-time', location: 'Remote', desc: 'Research and curate health and beauty content from trusted sources.' },
                  { role: 'UI/UX Designer', type: 'Contract', location: 'Remote', desc: 'Design beautiful, accessible interfaces that delight our users.' }
                ].map((job, idx) => (
                  <div key={idx} className="p-6 border border-border-light dark:border-border-dark rounded-xl hover:border-primary transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-lg font-bold">{job.role}</h4>
                      <span className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full">{job.type}</span>
                    </div>
                    <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mb-2">{job.desc}</p>
                    <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {job.location}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-xl">
                <h4 className="font-bold mb-2">Don't see a role that fits?</h4>
                <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mb-4">We're always looking for talented people. Send us your resume and tell us how you'd like to contribute!</p>
                <Link to="/info/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors">
                  <span>Get in Touch</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        );

      case 'press':
        return (
          <div className="space-y-12">
            <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-xl">
              <span className="material-symbols-outlined text-5xl text-secondary">newspaper</span>
              <div>
                <h2 className="text-2xl font-bold mb-2">Press & Media</h2>
                <p className="text-lg text-text-subtle-light dark:text-text-subtle-dark">Resources and information for journalists and media professionals.</p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">About HealthBeauty Hub</h3>
              <p className="text-text-subtle-light dark:text-text-subtle-dark leading-relaxed mb-4">
                HealthBeauty Hub is a comprehensive health and wellness platform that aggregates trusted content from medical journals, curates quality beauty products, and provides educational resources to help people make informed decisions about their health and wellness.
              </p>
              <p className="text-text-subtle-light dark:text-text-subtle-dark leading-relaxed">
                Our platform brings together health articles from PubMed, beauty products from verified eBay sellers, nutritional data from USDA databases, and educational videos - all in one convenient location.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Press Kit</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { icon: 'download', title: 'Brand Assets', desc: 'Logos, colors, and brand guidelines' },
                  { icon: 'article', title: 'Fact Sheet', desc: 'Key statistics and company information' },
                  { icon: 'image', title: 'Screenshots', desc: 'High-resolution platform screenshots' },
                  { icon: 'person', title: 'Team Bios', desc: 'Information about our leadership team' }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 border border-border-light dark:border-border-dark rounded-lg hover:border-secondary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-3xl text-secondary mb-2 block">{item.icon}</span>
                    <h4 className="font-bold mb-1">{item.title}</h4>
                    <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Media Inquiries</h3>
              <p className="text-text-subtle-light dark:text-text-subtle-dark mb-4">
                For press inquiries, interviews, or media requests, please contact us through our <Link to="/info/contact" className="text-primary hover:underline">contact page</Link> or reach out directly to our media team.
              </p>
              <div className="p-6 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl">
                <h4 className="font-bold mb-3">Quick Facts</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2"><span className="font-semibold min-w-32">Founded:</span> <span className="text-text-subtle-light dark:text-text-subtle-dark">2024</span></li>
                  <li className="flex gap-2"><span className="font-semibold min-w-32">Platform:</span> <span className="text-text-subtle-light dark:text-text-subtle-dark">Web-based health & beauty aggregator</span></li>
                  <li className="flex gap-2"><span className="font-semibold min-w-32">Content Sources:</span> <span className="text-text-subtle-light dark:text-text-subtle-dark">PubMed, eBay, USDA, YouTube</span></li>
                  <li className="flex gap-2"><span className="font-semibold min-w-32">Mission:</span> <span className="text-text-subtle-light dark:text-text-subtle-dark">Democratizing access to trusted health information</span></li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-12">
            <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-accent/10 to-primary/10 rounded-xl">
              <span className="material-symbols-outlined text-5xl text-accent">mail</span>
              <div>
                <h2 className="text-2xl font-bold mb-2">Get in Touch</h2>
                <p className="text-lg text-text-subtle-light dark:text-text-subtle-dark">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: 'support_agent', title: 'Customer Support', desc: 'Questions about our platform or features? We\'re here to help.', hours: '24/7' },
                { icon: 'campaign', title: 'Media Inquiries', desc: 'Press, partnerships, or collaboration opportunities.', hours: '1-2 business days' },
                { icon: 'bug_report', title: 'Technical Issues', desc: 'Experiencing a problem? Let us know so we can fix it.', hours: 'Priority support' }
              ].map((item, idx) => (
                <div key={idx} className="p-6 text-center border border-border-light dark:border-border-dark rounded-xl">
                  <span className="material-symbols-outlined text-4xl text-primary mb-3 block">{item.icon}</span>
                  <h4 className="font-bold mb-2">{item.title}</h4>
                  <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mb-2">{item.desc}</p>
                  <p className="text-xs text-primary">Response time: {item.hours}</p>
                </div>
              ))}
            </div>

            <div className="max-w-2xl mx-auto">
              <h3 className="text-xl font-bold mb-6 text-center">Send Us a Message</h3>
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold mb-2">Your Name</label>
                  <input
                    type="text"
                    id="name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold mb-2">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-4 py-3 border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold mb-2">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="How can we help?"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold mb-2">Message</label>
                  <textarea
                    id="message"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    placeholder="Tell us more about your inquiry..."
                    required
                  />
                </div>
                {contactMessage && (
                  <p className={`text-sm ${contactStatus === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {contactMessage}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={contactStatus === 'sending'}
                  className="w-full px-6 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {contactStatus === 'sending' ? (
                    <>
                      <span>Sending...</span>
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    </>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <span className="material-symbols-outlined">send</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        );

      case 'faq':
        return (
          <div className="space-y-12">
            <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl">
              <span className="material-symbols-outlined text-5xl text-primary">help</span>
              <div>
                <h2 className="text-2xl font-bold mb-2">Frequently Asked Questions</h2>
                <p className="text-lg text-text-subtle-light dark:text-text-subtle-dark">Find answers to common questions about our platform.</p>
              </div>
            </div>

            <div className="space-y-6">
              {[
                {
                  q: 'What is HealthBeauty Hub?',
                  a: 'HealthBeauty Hub is a comprehensive platform that aggregates health and beauty content from trusted sources. We bring together medical articles from PubMed, beauty products from verified eBay sellers, nutrition data from USDA, and educational videos to help you make informed wellness decisions.'
                },
                {
                  q: 'Is the health information on your site reliable?',
                  a: 'Yes! We exclusively aggregate content from trusted sources like PubMed (medical research database), USDA nutrition databases, and verified health organizations. We never create our own medical content - we simply make it easier for you to discover trusted information.'
                },
                {
                  q: 'Do you sell products directly?',
                  a: 'No, we are a content aggregator, not a seller. All products shown on our platform are from eBay\'s verified sellers. When you click on a product, you\'ll be directed to eBay to complete your purchase. This ensures you have eBay\'s buyer protection and customer service.'
                },
                {
                  q: 'How do I track my nutrition?',
                  a: 'Our Nutrition page features a powerful tracking tool powered by USDA data. You can search for foods, add them to your cart, compare nutritional values, and track your daily intake. All data is stored locally in your browser for your privacy.'
                },
                {
                  q: 'Can I save articles and products for later?',
                  a: 'Absolutely! Use the bookmark feature (heart icon) on any article, product, or video to save it for later. Your bookmarks are stored in your browser and accessible from the Bookmarks page.'
                },
                {
                  q: 'Is my data private and secure?',
                  a: 'Yes. We take privacy seriously. Most of your data (bookmarks, nutrition cart, preferences) is stored locally in your browser and never sent to our servers. We use HTTPS encryption for all communications and don\'t sell your data to third parties.'
                },
                {
                  q: 'Do you have a mobile app?',
                  a: 'Currently, we\'re a web-based platform optimized for both desktop and mobile browsers. You can access HealthBeauty Hub from any device with a web browser. A dedicated mobile app may come in the future based on user demand.'
                },
                {
                  q: 'How often is content updated?',
                  a: 'We update our content daily! Health articles are pulled fresh from PubMed, products are synced with eBay\'s current inventory, and videos are regularly refreshed from YouTube. You\'ll always find up-to-date information.'
                },
                {
                  q: 'Can I contribute content or suggest features?',
                  a: 'We love hearing from our community! While we don\'t accept user-generated health content (to maintain quality and accuracy), we absolutely welcome feature suggestions and feedback. Please use our contact page to share your ideas.'
                },
                {
                  q: 'Is HealthBeauty Hub free to use?',
                  a: 'Yes, our platform is completely free to use. We may earn small affiliate commissions when you purchase products through eBay links, which helps us keep the platform free and continuously improving.'
                }
              ].map((faq, idx) => (
                <details key={idx} className="group p-6 border border-border-light dark:border-border-dark rounded-xl hover:border-primary transition-colors">
                  <summary className="cursor-pointer font-bold flex justify-between items-center">
                    <span>{faq.q}</span>
                    <span className="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
                  </summary>
                  <p className="mt-4 text-text-subtle-light dark:text-text-subtle-dark leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>

            <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl text-center">
              <h4 className="font-bold mb-2">Still have questions?</h4>
              <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mb-4">Can't find the answer you're looking for? We're here to help!</p>
              <Link to="/info/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors">
                <span>Contact Support</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>
        );

      case 'shipping':
        return (
          <div className="space-y-12">
            <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-secondary/10 to-accent/10 rounded-xl">
              <span className="material-symbols-outlined text-5xl text-secondary">local_shipping</span>
              <div>
                <h2 className="text-2xl font-bold mb-2">Shipping Information</h2>
                <p className="text-lg text-text-subtle-light dark:text-text-subtle-dark">Everything you need to know about product delivery.</p>
              </div>
            </div>

            <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-3xl">info</span>
                <div>
                  <h3 className="font-bold text-yellow-800 dark:text-yellow-300 mb-2">Important Notice</h3>
                  <p className="text-yellow-700 dark:text-yellow-200 leading-relaxed">
                    <strong>HealthBeauty Hub is a content aggregator</strong>, not a product seller or marketplace. All products shown on our platform are from <strong>eBay's verified sellers</strong>. We do not handle, store, or ship any products ourselves.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">How Shipping Works</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="font-bold text-primary">1</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Browse Products on HealthBeauty Hub</h4>
                    <p className="text-text-subtle-light dark:text-text-subtle-dark">Explore our curated selection of health and beauty products from verified eBay sellers.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="font-bold text-primary">2</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Click to Purchase on eBay</h4>
                    <p className="text-text-subtle-light dark:text-text-subtle-dark">When you find a product you like, clicking it will direct you to eBay's secure checkout.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="font-bold text-primary">3</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">eBay Handles Everything</h4>
                    <p className="text-text-subtle-light dark:text-text-subtle-dark">The eBay seller processes your order, packages your item, and ships it directly to you. Shipping times, costs, and methods are determined by the individual seller.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="font-bold text-primary">4</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Track Your Order</h4>
                    <p className="text-text-subtle-light dark:text-text-subtle-dark">Use eBay's tracking system to monitor your shipment. You'll receive updates directly from eBay and the seller.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Shipping Details</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 border border-border-light dark:border-border-dark rounded-xl">
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">schedule</span>
                    Delivery Times
                  </h4>
                  <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                    Shipping times vary by seller and shipping method. Most eBay sellers offer standard, expedited, and express shipping options. Check the product listing on eBay for specific delivery estimates.
                  </p>
                </div>
                <div className="p-6 border border-border-light dark:border-border-dark rounded-xl">
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">payments</span>
                    Shipping Costs
                  </h4>
                  <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                    Shipping fees are set by individual eBay sellers. Many offer free shipping on qualifying orders. The total shipping cost will be displayed during eBay's checkout process before you complete your purchase.
                  </p>
                </div>
                <div className="p-6 border border-border-light dark:border-border-dark rounded-xl">
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">public</span>
                    International Shipping
                  </h4>
                  <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                    Some sellers ship internationally. Check the product listing on eBay to see if the seller ships to your country and for international shipping costs and estimated delivery times.
                  </p>
                </div>
                <div className="p-6 border border-border-light dark:border-border-dark rounded-xl">
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">verified</span>
                    Buyer Protection
                  </h4>
                  <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                    All purchases are protected by eBay's Money Back Guarantee. If an item doesn't arrive or doesn't match the listing description, eBay will help you get your money back.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl">
              <h4 className="font-bold mb-2">Need Help with Shipping?</h4>
              <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mb-4">
                For questions about a specific order, shipping status, or delivery issues, please contact eBay's customer support or the seller directly through eBay's messaging system. HealthBeauty Hub cannot assist with shipping inquiries as we don't handle any transactions.
              </p>
              <a
                href="https://www.ebay.com/help/home"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
              >
                <span>Visit eBay Help Center</span>
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
            </div>
          </div>
        );

      case 'returns':
        return (
          <div className="space-y-12">
            <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-accent/10 to-secondary/10 rounded-xl">
              <span className="material-symbols-outlined text-5xl text-accent">keyboard_return</span>
              <div>
                <h2 className="text-2xl font-bold mb-2">Returns & Refunds</h2>
                <p className="text-lg text-text-subtle-light dark:text-text-subtle-dark">Understanding the return process for products.</p>
              </div>
            </div>

            <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-3xl">info</span>
                <div>
                  <h3 className="font-bold text-yellow-800 dark:text-yellow-300 mb-2">Important Notice</h3>
                  <p className="text-yellow-700 dark:text-yellow-200 leading-relaxed">
                    <strong>HealthBeauty Hub is a content aggregator</strong>, not a product seller or marketplace. All returns and refunds are handled exclusively by <strong>eBay and the individual sellers</strong>. We do not process returns or issue refunds ourselves.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">How Returns Work</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                    <span className="font-bold text-accent">1</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Check the Return Policy</h4>
                    <p className="text-text-subtle-light dark:text-text-subtle-dark">Each eBay seller sets their own return policy. Before purchasing, check the product listing on eBay to see the seller's return window, conditions, and who pays for return shipping.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                    <span className="font-bold text-accent">2</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Initiate Return on eBay</h4>
                    <p className="text-text-subtle-light dark:text-text-subtle-dark">If you need to return an item, log into your eBay account, go to "Purchase History," find the item, and click "Return this item." Follow eBay's guided return process.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                    <span className="font-bold text-accent">3</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Ship the Item Back</h4>
                    <p className="text-text-subtle-light dark:text-text-subtle-dark">Follow the seller's return instructions. You'll receive a return shipping label or address. Pack the item securely in its original packaging if possible.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                    <span className="font-bold text-accent">4</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Receive Your Refund</h4>
                    <p className="text-text-subtle-light dark:text-text-subtle-dark">Once the seller receives and inspects the return, your refund will be processed through eBay. Refunds are typically issued to your original payment method within a few business days.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">eBay Money Back Guarantee</h3>
              <div className="p-6 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl">
                <p className="text-text-subtle-light dark:text-text-subtle-dark leading-relaxed mb-4">
                  Most purchases on eBay are covered by the <strong>eBay Money Back Guarantee</strong>. This means you can get your money back if:
                </p>
                <ul className="space-y-2 mb-4">
                  {[
                    'The item doesn\'t arrive',
                    'The item is damaged or defective',
                    'The item doesn\'t match the listing description',
                    'You receive the wrong item'
                  ].map((item, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="material-symbols-outlined text-accent">check_circle</span>
                      <span className="text-text-subtle-light dark:text-text-subtle-dark">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                  If the seller doesn't resolve your issue, eBay will step in and help. You're protected for most purchases.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Common Return Scenarios</h3>
              <div className="space-y-4">
                {[
                  { title: 'Changed Your Mind?', desc: 'Many sellers accept returns even if you simply changed your mind. Check the specific seller\'s return policy on the product listing.' },
                  { title: 'Wrong Item Received?', desc: 'Contact the seller immediately through eBay\'s messaging system. Most sellers will send the correct item or provide a full refund.' },
                  { title: 'Item Damaged in Shipping?', desc: 'Take photos and contact the seller right away. You\'re protected by eBay\'s Money Back Guarantee for damaged items.' },
                  { title: 'Item Not as Described?', desc: 'Open a return request through eBay. Provide details about how the item differs from the listing. eBay will help facilitate the return.' }
                ].map((scenario, idx) => (
                  <details key={idx} className="group p-6 border border-border-light dark:border-border-dark rounded-xl hover:border-accent transition-colors">
                    <summary className="cursor-pointer font-bold flex justify-between items-center">
                      <span>{scenario.title}</span>
                      <span className="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
                    </summary>
                    <p className="mt-4 text-sm text-text-subtle-light dark:text-text-subtle-dark">{scenario.desc}</p>
                  </details>
                ))}
              </div>
            </div>

            <div className="p-6 bg-accent/5 border border-accent/20 rounded-xl">
              <h4 className="font-bold mb-2">Need Help with a Return?</h4>
              <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mb-4">
                For questions about returning a specific item or getting a refund, please contact eBay's customer support or the seller directly through eBay's messaging system. HealthBeauty Hub cannot assist with returns or refunds as we don't handle any transactions.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://www.ebay.com/help/buying/returns-refunds/returning-item?id=4041"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  <span>eBay Returns Guide</span>
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
                <a
                  href="https://www.ebay.com/help/home"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 border-2 border-accent text-accent rounded-lg hover:bg-accent/10 transition-colors"
                >
                  <span>eBay Help Center</span>
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              </div>
            </div>
          </div>
        );

      case 'terms':
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl">
              <span className="material-symbols-outlined text-5xl text-primary">gavel</span>
              <div>
                <h2 className="text-2xl font-bold mb-2">Terms of Service</h2>
                <p className="text-lg text-text-subtle-light dark:text-text-subtle-dark">Last updated: November 2024</p>
              </div>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <h3>1. Acceptance of Terms</h3>
              <p>By accessing and using HealthBeauty Hub, you accept and agree to be bound by these Terms of Service.</p>

              <h3>2. Description of Service</h3>
              <p>HealthBeauty Hub is a content aggregation platform that provides links to health articles, beauty products, and wellness information from third-party sources.</p>

              <h3>3. User Responsibilities</h3>
              <p>You agree to use this service for lawful purposes only and in a way that does not infringe the rights of others.</p>

              <h3>4. Disclaimer</h3>
              <p>The information provided on HealthBeauty Hub is for educational purposes only and should not be considered medical advice. Always consult with a healthcare professional.</p>

              <h3>5. Limitation of Liability</h3>
              <p>HealthBeauty Hub is not liable for any damages arising from your use of this service or reliance on information provided.</p>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-secondary/10 to-accent/10 rounded-xl">
              <span className="material-symbols-outlined text-5xl text-secondary">shield</span>
              <div>
                <h2 className="text-2xl font-bold mb-2">Privacy Policy</h2>
                <p className="text-lg text-text-subtle-light dark:text-text-subtle-dark">Last updated: November 2024</p>
              </div>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <h3>1. Information We Collect</h3>
              <p>We collect minimal information necessary to provide our services, including browser data stored locally and anonymous usage statistics.</p>

              <h3>2. How We Use Your Information</h3>
              <p>Your data is used solely to improve your experience on HealthBeauty Hub. We do not sell your data to third parties.</p>

              <h3>3. Data Storage</h3>
              <p>Most of your data (bookmarks, preferences) is stored locally in your browser. Newsletter subscriptions are stored securely on our servers.</p>

              <h3>4. Third-Party Services</h3>
              <p>We use third-party services (eBay, YouTube, PubMed) which have their own privacy policies. Please review their policies when using their services.</p>

              <h3>5. Your Rights</h3>
              <p>You have the right to access, modify, or delete your personal information at any time by contacting us.</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-text-subtle-light dark:text-text-subtle-dark mb-4 block">info</span>
            <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
            <p className="text-text-subtle-light dark:text-text-subtle-dark">The information page you're looking for doesn't exist.</p>
          </div>
        );
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      {renderContent()}
    </main>
  );
};

export default InfoPage;
