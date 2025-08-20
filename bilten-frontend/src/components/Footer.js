import React from 'react';
import { Link } from 'react-router-dom';
import LanguageDropdown from './LanguageDropdown';
import ThemeToggle from './ThemeToggle';
import { useLanguage } from '../context/LanguageContext';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  const footerSections = [
    {
      title: t('footer.company'),
      links: [
        { label: t('footer.aboutUs'), href: '/about' },
        { label: t('footer.careers'), href: '/careers' },
        { label: t('footer.press'), href: '/press' },
        { label: t('footer.contact'), href: '/contact' },
      ],
    },
    {
      title: t('footer.events'),
      links: [
        { label: t('footer.browseEvents'), href: '/events' },
        { label: t('footer.eventCalendar'), href: '/events/calendar' },
        { label: t('footer.searchEvents'), href: '/events/search' },
        { label: t('footer.createEvent'), href: '/create-event' },
      ],
    },
    {
      title: t('footer.support'),
      links: [
        { label: t('footer.helpCenter'), href: '/help' },
        { label: t('footer.faq'), href: '/faq' },
        { label: t('footer.contactSupport'), href: '/contact' },
        { label: t('footer.news'), href: '/news' },
      ],
    },
    {
      title: t('footer.legal'),
      links: [
        { label: t('footer.termsOfService'), href: '/terms-of-service' },
        { label: t('footer.privacyPolicy'), href: '/privacy-policy' },
        { label: t('footer.cookiePolicy'), href: '/cookie-policy' },
        { label: t('footer.refundPolicy'), href: '/refund-policy' },
      ],
    },
    {
      title: t('footer.connect'),
      links: [
        { label: 'Facebook', href: 'https://facebook.com', external: true },
        { label: 'Twitter', href: 'https://twitter.com', external: true },
        { label: 'Instagram', href: 'https://instagram.com', external: true },
        { label: 'LinkedIn', href: 'https://linkedin.com', external: true },
      ],
    },
  ];

  return (
    <footer className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 rtl:space-x-reverse mb-4 md:mb-0">
              <Link to="/" className="text-2xl brand-bilten text-primary-600 dark:text-primary-400">
                Bilten
              </Link>
              <span className="text-gray-600 dark:text-gray-400 text-sm">
                © {currentYear} Bilten. {t('footer.allRightsReserved')}
              </span>
            </div>
            
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <ThemeToggle />
              <LanguageDropdown />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;