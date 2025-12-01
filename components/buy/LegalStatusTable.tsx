/**
 * LegalStatusTable Component
 * 
 * Displays DMAA legal status across different countries.
 * Optimized for featured snippets.
 */

import React from 'react';
import type { LegalStatusByCountry } from '@/types';

interface LegalStatusTableProps {
  data: LegalStatusByCountry[];
}

export default function LegalStatusTable({ data }: LegalStatusTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'banned':
        return { icon: 'block', text: 'Banned', color: 'text-alert-red bg-alert-red-light dark:bg-alert-red-dark/30' };
      case 'legal':
        return { icon: 'check_circle', text: 'Legal', color: 'text-success-green bg-success-green-light dark:bg-success-green-dark/30' };
      case 'gray_area':
        return { icon: 'help', text: 'Gray Area', color: 'text-warning-amber bg-warning-amber-light dark:bg-warning-amber-dark/30' };
      default:
        return { icon: 'help', text: 'Unknown', color: 'text-gray-500 bg-gray-100 dark:bg-gray-800' };
    }
  };

  return (
    <div className="my-6 overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            <th className="p-3 text-left font-medium text-text-light dark:text-text-dark border border-border-light dark:border-border-dark">
              Country
            </th>
            <th className="p-3 text-center font-medium text-text-light dark:text-text-dark border border-border-light dark:border-border-dark">
              Legal Status
            </th>
            <th className="p-3 text-left font-medium text-text-light dark:text-text-dark border border-border-light dark:border-border-dark">
              Regulatory Authority
            </th>
            <th className="p-3 text-left font-medium text-text-light dark:text-text-dark border border-border-light dark:border-border-dark">
              Penalty
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const badge = getStatusBadge(item.status);
            return (
              <tr 
                key={index}
                className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}`}
              >
                <td className="p-3 border border-border-light dark:border-border-dark">
                  <span className="font-medium text-text-light dark:text-text-dark">
                    {item.country}
                  </span>
                </td>
                <td className="p-3 text-center border border-border-light dark:border-border-dark">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
                    <span className="material-symbols-outlined text-sm">{badge.icon}</span>
                    {badge.text}
                  </span>
                </td>
                <td className="p-3 border border-border-light dark:border-border-dark text-text-subtle-light dark:text-text-subtle-dark">
                  {item.authority}
                </td>
                <td className="p-3 border border-border-light dark:border-border-dark text-text-subtle-light dark:text-text-subtle-dark">
                  {item.penalty}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Note */}
      <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mt-2 italic">
        * Legal status accurate as of last update. Laws change frequently - verify with local authorities.
      </p>
    </div>
  );
}
