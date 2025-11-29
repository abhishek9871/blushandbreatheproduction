/**
 * Emergency Medical Information Page
 * 
 * Critical emergency contacts and overdose information.
 * Designed for quick access during medical emergencies.
 * 
 * Route: /info/emergency
 */

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface EmergencyContact {
  name: string;
  number: string;
  description: string;
  icon: string;
  urgent: boolean;
}

const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    name: 'Emergency Services (US)',
    number: '911',
    description: 'For life-threatening emergencies - call immediately if someone is unconscious, not breathing, or having a severe allergic reaction',
    icon: 'emergency',
    urgent: true
  },
  {
    name: 'Poison Control Center (US)',
    number: '1-800-222-1222',
    description: 'Available 24/7 for poisoning emergencies and medication overdose. Free, confidential advice from toxicology experts.',
    icon: 'science',
    urgent: true
  },
  {
    name: 'Suicide & Crisis Lifeline',
    number: '988',
    description: 'Free, confidential 24/7 support for people in distress, prevention and crisis resources.',
    icon: 'support',
    urgent: true
  },
  {
    name: 'SAMHSA Helpline',
    number: '1-800-662-4357',
    description: 'Substance Abuse and Mental Health Services Administration - Free, confidential, 24/7 treatment referral service.',
    icon: 'health_and_safety',
    urgent: false
  }
];

const OVERDOSE_SIGNS = [
  { sign: 'Unresponsiveness or unconsciousness', severity: 'critical' },
  { sign: 'Slow, shallow, or no breathing', severity: 'critical' },
  { sign: 'Blue or grayish skin, lips, or fingernails', severity: 'critical' },
  { sign: 'Choking or gurgling sounds', severity: 'critical' },
  { sign: 'Pinpoint pupils (opioids)', severity: 'warning' },
  { sign: 'Seizures or convulsions', severity: 'critical' },
  { sign: 'Extreme confusion or agitation', severity: 'warning' },
  { sign: 'Chest pain or rapid heartbeat', severity: 'warning' },
  { sign: 'Severe vomiting', severity: 'warning' },
  { sign: 'High fever or profuse sweating', severity: 'warning' }
];

export default function EmergencyInfoPage() {
  return (
    <>
      <Head>
        <title>Emergency Medical Information | Blush & Breathe</title>
        <meta name="description" content="Critical emergency medical contacts, overdose signs, and what to do in a medical emergency. Poison Control: 1-800-222-1222" />
        <meta name="robots" content="index, follow" />
      </Head>

      <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Emergency Header - High Visibility */}
        <section className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white py-8">
          <div className="max-w-4xl mx-auto px-4">
            <nav className="flex items-center gap-2 text-sm text-red-200 mb-4">
              <Link href="/" className="hover:text-white">Home</Link>
              <span>/</span>
              <Link href="/info/about" className="hover:text-white">Info</Link>
              <span>/</span>
              <span className="text-white">Emergency</span>
            </nav>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl">emergency</span>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Emergency Information</h1>
                <p className="text-red-200 mt-1">Critical contacts and overdose information</p>
              </div>
            </div>
          </div>
        </section>

        {/* Critical Alert Banner */}
        <div className="bg-red-100 dark:bg-red-900/50 border-b-2 border-red-500">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl animate-pulse">warning</span>
              <p className="text-red-800 dark:text-red-200 font-medium">
                <strong>If someone is not breathing or unconscious, call 911 immediately.</strong> Do not wait.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <section className="py-8">
          <div className="max-w-4xl mx-auto px-4">
            {/* Emergency Contacts */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500">call</span>
                Emergency Contacts
              </h2>

              <div className="grid gap-4">
                {EMERGENCY_CONTACTS.map((contact) => (
                  <div
                    key={contact.number}
                    className={`rounded-xl p-5 ${
                      contact.urgent
                        ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          contact.urgent
                            ? 'bg-red-100 dark:bg-red-800/50'
                            : 'bg-blue-100 dark:bg-blue-900/50'
                        }`}>
                          <span className={`material-symbols-outlined text-2xl ${
                            contact.urgent
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-blue-600 dark:text-blue-400'
                          }`}>
                            {contact.icon}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{contact.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{contact.description}</p>
                        </div>
                      </div>
                      <a
                        href={`tel:${contact.number.replace(/-/g, '')}`}
                        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-lg transition-colors flex-shrink-0 ${
                          contact.urgent
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined">call</span>
                        {contact.number}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Signs of Overdose */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-orange-500">visibility</span>
                Signs of Overdose or Poisoning
              </h2>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800">
                  <p className="text-orange-800 dark:text-orange-200 font-medium">
                    Recognize these warning signs and act quickly. Time is critical in overdose situations.
                  </p>
                </div>
                <div className="p-5">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {OVERDOSE_SIGNS.map((item, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-3 p-3 rounded-lg ${
                          item.severity === 'critical'
                            ? 'bg-red-50 dark:bg-red-900/20'
                            : 'bg-yellow-50 dark:bg-yellow-900/20'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-lg flex-shrink-0 ${
                          item.severity === 'critical'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {item.severity === 'critical' ? 'error' : 'warning'}
                        </span>
                        <span className={`text-sm ${
                          item.severity === 'critical'
                            ? 'text-red-800 dark:text-red-200 font-medium'
                            : 'text-yellow-800 dark:text-yellow-200'
                        }`}>
                          {item.sign}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* What To Do */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-green-500">check_circle</span>
                What To Do in an Emergency
              </h2>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <ol className="space-y-4">
                  <li className="flex items-start gap-4">
                    <span className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold flex-shrink-0">1</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Call 911 Immediately</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        If someone is unconscious, not breathing, or having a severe reaction, call emergency services first.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold flex-shrink-0">2</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Stay With the Person</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        Keep the person awake if possible. Turn them on their side if they&apos;re vomiting or unconscious (recovery position).
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="w-8 h-8 rounded-full bg-yellow-600 text-white flex items-center justify-center font-bold flex-shrink-0">3</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Gather Information</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        If safe to do so, find out what substance was taken, how much, and when. Have this ready for emergency responders.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">4</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Administer Naloxone if Available</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        For suspected opioid overdose, administer Narcan/Naloxone if available. It&apos;s safe even if the overdose is not opioid-related.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold flex-shrink-0">5</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Do NOT Induce Vomiting</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        Unless directed by Poison Control, do not make the person vomit. Some substances cause more damage when vomited.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>

            {/* Naloxone/Narcan Information */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-purple-500">medication</span>
                About Naloxone (Narcan)
              </h2>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-6">
                <p className="text-purple-900 dark:text-purple-100 mb-4">
                  <strong>Naloxone</strong> is a life-saving medication that can reverse an opioid overdose. It&apos;s available without a prescription at most pharmacies.
                </p>
                <ul className="space-y-2 text-purple-800 dark:text-purple-200">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm mt-0.5 text-purple-600 dark:text-purple-400">check</span>
                    Safe to use - it won&apos;t harm someone who hasn&apos;t taken opioids
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm mt-0.5 text-purple-600 dark:text-purple-400">check</span>
                    Available as nasal spray or injection
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm mt-0.5 text-purple-600 dark:text-purple-400">check</span>
                    Works within 2-5 minutes
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm mt-0.5 text-purple-600 dark:text-purple-400">check</span>
                    Multiple doses may be needed for strong opioids
                  </li>
                </ul>
                <p className="mt-4 text-sm text-purple-700 dark:text-purple-300">
                  <strong>Important:</strong> Always call 911 even after giving Naloxone. The effects may wear off before the opioids do.
                </p>
              </div>
            </div>

            {/* International Emergency Numbers */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-blue-500">public</span>
                International Emergency Numbers
              </h2>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Country</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Emergency</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Poison Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">United States</td>
                      <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">911</td>
                      <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">1-800-222-1222</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">United Kingdom</td>
                      <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">999 / 112</td>
                      <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">111 (NHS)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">Canada</td>
                      <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">911</td>
                      <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">1-844-764-7669</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">Australia</td>
                      <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">000</td>
                      <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">13 11 26</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">European Union</td>
                      <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">112</td>
                      <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">Varies by country</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">India</td>
                      <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">112</td>
                      <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">1800-116-117</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Back Link */}
            <div className="text-center">
              <Link
                href="/medicines"
                className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Back to MediVault
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
