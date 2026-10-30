import React from 'react';
import { Sprout, ShieldCheck, HeartHandshake, Cloud } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-900 text-slate-300 mt-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-forest-600 flex items-center justify-center text-white">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                {t('nav.brandTitle', 'Agri')} {t('nav.brandHighlight', 'Marketplace')}
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t('footer.brandDesc', 'Cloud-Native AI Agriculture platform connecting Indian farmers directly with commercial buyers and consumers.')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              {t('footer.marketplaceTitle', 'Marketplace')}
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/marketplace" className="hover:text-white transition">
                  {t('footer.allCrops', 'All Crops Catalog')}
                </Link>
              </li>
              <li>
                <Link to="/marketplace?category=Grains" className="hover:text-white transition">
                  {t('footer.grainsCereals', 'Grains & Cereals')}
                </Link>
              </li>
              <li>
                <Link to="/marketplace?category=Vegetables" className="hover:text-white transition">
                  {t('footer.freshVegetables', 'Fresh Vegetables')}
                </Link>
              </li>
              <li>
                <Link to="/marketplace?category=Fruits" className="hover:text-white transition">
                  {t('footer.seasonalFruits', 'Seasonal Fruits')}
                </Link>
              </li>
              <li>
                <Link to="/sell" className="hover:text-white transition">
                  {t('footer.listProduce', 'List Produce')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              {t('footer.cloudArch', 'Cloud Architecture')}
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-forest-400" />
                <span>{t('footer.springBoot', 'Spring Boot 3.5 & Java 21')}</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-forest-400" />
                <span>{t('footer.mysql', 'MySQL 8.0 Persistence')}</span>
              </li>
              <li className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-forest-400" />
                <span>{t('footer.docker', 'Docker & Minikube Ready')}</span>
              </li>
              <li>
                <Link to="/dashboard" className="text-forest-400 hover:underline">
                  {t('footer.systemStatus', 'System Status & Metrics')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Direct contact & note */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              {t('footer.assuranceTitle', 'Farmer Direct Assurance')}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('footer.assuranceDesc', 'Every crop listing is directly maintained by farmers and verified agrarian producers. Zero middleman markup, real-time weights, and transparent location sourcing.')}
            </p>
            <div className="mt-4 p-3 rounded-lg bg-slate-800/80 border border-slate-700/50 text-xs text-slate-300">
              <span className="font-semibold text-forest-400">Port 8080:</span> Spring Boot Backend<br />
              <span className="font-semibold text-forest-400">Port 5173:</span> React / Vite Frontend
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>{t('footer.copyright', { year: new Date().getFullYear(), defaultValue: `© ${new Date().getFullYear()} Cloud-Native AI Agri Marketplace. Built for CNAD Project.` })}</p>
          <p className="mt-2 sm:mt-0">{t('footer.phase', 'Phase 8 — Multilingual Support (English, Telugu & Hindi)')}</p>
        </div>
      </div>
    </footer>
  );
}
