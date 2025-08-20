import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  loadTranslations, 
  getTranslation, 
  formatNumber, 
  formatDate, 
  formatCurrency,
  AVAILABLE_LANGUAGES 
} from '../utils/i18n';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'en';
  });
  
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const languages = AVAILABLE_LANGUAGES;

  const translations = {
    en: {
      // Navigation
      'nav.events': 'Events',
      'nav.news': 'News',
      'nav.about': 'About',
      'nav.help': 'Help',
      
      // Auth
      'auth.signin': 'Sign in',
      'auth.signup': 'Sign up',
      'auth.signout': 'Sign out',
      'auth.email': 'Email address',
      'auth.password': 'Password',
      'auth.forgotPassword': 'Forgot your password?',
      'auth.createAccount': 'Create your account',
      'auth.firstName': 'First Name',
      'auth.lastName': 'Last Name',
      'auth.accountType': 'Account Type',
      'auth.attendee': 'Attendee',
      'auth.organizer': 'Event Organizer',
      
             // Social Login
       'social.google': 'Sign in with Google',
       'social.facebook': 'Sign in with Facebook',
       'social.apple': 'Sign in with Apple',
       'social.orContinueWith': 'Or continue with',
       'social.signInToBilten': 'Sign in to Bilten',
       'social.chooseLoginMethod': 'Choose your preferred login method',
       'social.continueWithGoogle': 'Continue with Google',
       'social.continueWithFacebook': 'Continue with Facebook',
       'social.continueWithApple': 'Continue with Apple',
       'social.orSignInWithEmail': 'Or sign in with email',
       
       // Login Page
       'login.title': 'Sign in to your account',
       'login.emailLabel': 'Email address',
       'login.emailPlaceholder': 'Enter your email',
       'login.passwordLabel': 'Password',
       'login.passwordPlaceholder': 'Enter your password',
       'login.forgotPassword': 'Forgot your password?',
       'login.signInButton': 'Sign in',
       'login.signingIn': 'Signing in...',
       'login.orContinueWith': 'Or continue with',
       'login.dontHaveAccount': 'Don\'t have an account?',
       'login.signUpHere': 'Sign up here',
       
       // Register Page
       'register.title': 'Create your account',
       'register.firstNameLabel': 'First Name',
       'register.firstNamePlaceholder': 'Enter your first name',
       'register.lastNameLabel': 'Last Name',
       'register.lastNamePlaceholder': 'Enter your last name',
       'register.emailLabel': 'Email address',
       'register.emailPlaceholder': 'Enter your email',
       'register.passwordLabel': 'Password',
       'register.passwordPlaceholder': 'Enter your password',
       'register.accountTypeLabel': 'Account Type',
       'register.attendeeOption': 'Attendee',
       'register.organizerOption': 'Event Organizer',
       'register.createAccountButton': 'Create account',
       'register.creatingAccount': 'Creating account...',
       'register.orContinueWith': 'Or continue with',
       'register.signUpWithGoogle': 'Sign up with Google',
       'register.signUpWithFacebook': 'Sign up with Facebook',
       'register.signUpWithApple': 'Sign up with Apple',
       'register.alreadyHaveAccount': 'Already have an account?',
       'register.signInHere': 'Sign in here',
      
      // Home
      'home.discover': 'Discover amazing events near you',
      'home.askBilten': 'Ask Bilten',
      'home.tryAsking': 'Try asking:',
      'home.musicEvents': 'Show me music events',
      'home.freeEvents': 'Find free events this weekend',
      'home.businessNetworking': 'Business networking near me',
      'home.artExhibitions': 'Art exhibitions',
      'home.sportsEvents': 'Sports events',
      
      // Footer
      'footer.company': 'Company',
      'footer.events': 'Events',
      'footer.support': 'Support',
      'footer.legal': 'Legal',
      'footer.connect': 'Connect',
      'footer.aboutUs': 'About Us',
      'footer.careers': 'Careers',
      'footer.press': 'Press',
      'footer.contact': 'Contact',
      'footer.browseEvents': 'Browse Events',
      'footer.eventCalendar': 'Event Calendar',
      'footer.searchEvents': 'Search Events',
      'footer.createEvent': 'Create Event',
      'footer.helpCenter': 'Help Center',
      'footer.faq': 'FAQ',
      'footer.contactSupport': 'Contact Support',
      'footer.news': 'News',
      'footer.termsOfService': 'Terms of Service',
      'footer.privacyPolicy': 'Privacy Policy',
      'footer.cookiePolicy': 'Cookie Policy',
      'footer.refundPolicy': 'Refund Policy',
             'footer.allRightsReserved': 'All rights reserved.',
      
       // Common
       'common.loading': 'Loading...',
       'common.error': 'Error',
       'common.success': 'Success',
       'common.cancel': 'Cancel',
       'common.save': 'Save',
       'common.edit': 'Edit',
       'common.delete': 'Delete',
       'common.view': 'View',
       'common.close': 'Close',
       'common.back': 'Back',
       'common.next': 'Next',
       'common.previous': 'Previous',
       'common.search': 'Search',
       'common.filter': 'Filter',
       'common.sort': 'Sort',
       'common.all': 'All',
       'common.none': 'None',
       'common.yes': 'Yes',
       'common.no': 'No',
       'common.ok': 'OK',
       'common.switchToLight': 'Switch to Light Mode',
       'common.switchToDark': 'Switch to Dark Mode',
       
       // Guest Access
       'guest.accessDenied': 'Access Denied',
       'guest.accessDeniedMessage': 'This feature requires a registered account. Please sign in or create an account to continue.',
       'guest.loginToAccess': 'Sign in to Access',
       'guest.createAccount': 'Create Account',
       'guest.backToHome': 'Back to Home',
       'guest.aiChatRestricted': 'AI Chat Restricted',
       'guest.aiChatRestrictedMessage': 'AI chat is only available for registered users. Please sign in to access this feature.',
       'guest.eventDetailsRestricted': 'Event Details Restricted',
       'guest.eventDetailsRestrictedMessage': 'Event details are only available for registered users. Please sign in to view full event information.',
       'guest.signInToViewDetails': 'Sign in to View Details',
       
       // Language
       'language.select': 'Select Language',
       'language.english': 'English',
       'language.arabic': 'Arabic',
       'language.german': 'German',
       'language.french': 'French',
       'language.italian': 'Italian',
       
       // Help Center
       'help.title': 'Help Center',
       'help.subtitle': 'Find answers to common questions and get the support you need',
       'help.searchPlaceholder': 'Search for help articles, FAQs, or topics...',
       'help.noResults': 'No results found',
       'help.noResultsSubtitle': 'Try adjusting your search terms or browse our categories above.',
       'help.clearSearch': 'Clear Search',
       'help.stillNeedHelp': 'Still need help?',
       'help.supportTeam': 'Our support team is here to help you 24/7',
       'help.contactSupport': 'Contact Support',
       'help.sendMessage': 'Send Message',
       'help.legalPolicies': 'Legal & Policies',
       'help.popularTopics': 'Popular Topics',
       
       // Help Center Sections
       'help.sections.gettingStarted': 'Getting Started',
       'help.sections.accountManagement': 'Account Management',
       'help.sections.events': 'Events',
       'help.sections.tickets': 'Tickets',
       'help.sections.payments': 'Payments & Billing',
       'help.sections.technical': 'Technical Support',
       
       // Help Center Questions & Answers
       'help.gs.createAccount.question': 'How do I create an account?',
       'help.gs.createAccount.answer': 'Creating an account is easy! Click the "Register" button in the top navigation, fill in your details including email and password, and verify your email address. You\'ll be ready to start exploring events in no time.',
       
       'help.gs.findEvents.question': 'How do I find events?',
       
       // FAQ Page
       'faq.title': 'Frequently Asked',
       'faq.questions': 'Questions',
       'faq.subtitle': 'Find answers to common questions about Bilten. Can\'t find what you\'re looking for? Contact our support team for personalized help.',
       'faq.searchPlaceholder': 'Search questions...',
       'faq.stats.questions': 'Common Questions',
       'faq.stats.support': 'Support Available',
       'faq.stats.categories': 'Categories',
       'faq.noResults.title': 'No questions found',
       'faq.noResults.subtitle': 'Try adjusting your search terms or browse all categories below.',
       'faq.noResults.clearSearch': 'Clear Search',
       
       // FAQ Categories
       'faq.general.title': 'General Questions',
       'faq.general.whatIsBilten.question': 'What is Bilten?',
       'faq.general.whatIsBilten.answer': 'Bilten is a comprehensive event management platform that connects event organizers with attendees. We provide tools for creating, managing, and discovering events of all types and sizes.',
       'faq.general.createAccount.question': 'How do I create an account?',
       'faq.general.createAccount.answer': 'Creating an account is easy! Click the "Sign Up" button in the top right corner, fill in your details, and verify your email address. You can also sign up using your Google or Facebook account.',
       'faq.general.isFree.question': 'Is Bilten free to use?',
       'faq.general.isFree.answer': 'Bilten offers both free and premium features. Basic event creation and browsing are free, while advanced features like analytics, custom branding, and priority support are available with our premium plans.',
       'faq.general.eventTypes.question': 'What types of events can I create?',
       'faq.general.eventTypes.answer': 'You can create virtually any type of event: concerts, conferences, workshops, meetups, sports events, exhibitions, webinars, and more. Our platform is designed to accommodate events of all sizes and formats.',
       
       'faq.organizers.title': 'For Event Organizers',
       'faq.organizers.createEvent.question': 'How do I create my first event?',
       'faq.organizers.createEvent.answer': 'To create an event, log in to your account and click "Create Event" in your dashboard. Fill in the event details, set your ticket prices, choose your venue, and publish your event. Our step-by-step wizard will guide you through the process.',
       'faq.organizers.paymentMethods.question': 'What payment methods do you support?',
       'faq.organizers.paymentMethods.answer': 'We support major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers. All payments are processed securely through our trusted payment partners.',
       'faq.organizers.manageSales.question': 'How do I manage ticket sales?',
       'faq.organizers.manageSales.answer': 'You can manage ticket sales through your organizer dashboard. Track sales in real-time, view attendee lists, send updates to attendees, and generate reports. You can also set up different ticket types and pricing tiers.',
       'faq.organizers.cancelEvent.question': 'Can I cancel or reschedule an event?',
       'faq.organizers.cancelEvent.answer': 'Yes, you can cancel or reschedule events through your dashboard. We recommend notifying attendees as early as possible. Our refund policies are clearly outlined in our terms of service.',
       'faq.organizers.promoteEvent.question': 'How do I promote my event?',
       'faq.organizers.promoteEvent.answer': 'Bilten offers multiple promotion tools: social media integration, email marketing, featured event placement, and SEO optimization. You can also use our analytics to understand your audience and improve your marketing strategy.',
       
       'faq.attendees.title': 'For Event Attendees',
       'faq.attendees.findEvents.question': 'How do I find events?',
       'faq.attendees.findEvents.answer': 'Browse events by category, location, or date on our events page. Use the search function to find specific events, or check out our recommendations based on your interests and past attendance.',
       'faq.attendees.purchaseTickets.question': 'How do I purchase tickets?',
       'faq.attendees.purchaseTickets.answer': 'Select your desired event, choose your ticket type and quantity, and proceed to checkout. You can pay with credit card, PayPal, or other supported payment methods. Tickets are delivered instantly via email.',
       'faq.attendees.refunds.question': 'Can I get a refund if I can\'t attend?',
       'faq.attendees.refunds.answer': 'Refund policies vary by event and are set by the organizer. Check the event details for specific refund information. In most cases, refunds are available up to 24-48 hours before the event.',
       'faq.attendees.accessTickets.question': 'How do I access my tickets?',
       'faq.attendees.accessTickets.answer': 'Tickets are sent to your email immediately after purchase. You can also access them in your account under "My Tickets". For mobile entry, simply show the QR code on your phone at the event.',
       'faq.attendees.eventCancelled.question': 'What if an event is cancelled?',
       'faq.attendees.eventCancelled.answer': 'If an event is cancelled, you\'ll receive an email notification and automatic refund. The refund will be processed to your original payment method within 5-10 business days.',
       
       'faq.payments.title': 'Payments & Billing',
       'faq.payments.security.question': 'Are my payment details secure?',
       'faq.payments.security.answer': 'Yes, we use industry-standard SSL encryption and PCI DSS compliance to protect your payment information. We never store your full credit card details on our servers.',
       'faq.payments.fees.question': 'What are the service fees?',
       'faq.payments.fees.answer': 'Service fees vary by event type and ticket price. Fees are clearly displayed before purchase and typically range from 3-8% of the ticket price. Organizers can choose to absorb these fees or pass them to attendees.',
       'faq.payments.payouts.question': 'When do organizers receive their payments?',
       'faq.payments.payouts.answer': 'Payments are typically processed within 3-5 business days after the event concludes. For recurring events, payments are processed monthly. You can track payment status in your organizer dashboard.',
       'faq.payments.paymentPlans.question': 'Do you offer payment plans?',
       'faq.payments.paymentPlans.answer': 'Payment plans are available for certain event types and ticket prices. Look for the "Payment Plan" option during checkout. Plans typically allow you to pay in 2-4 installments.',
       
       'faq.technical.title': 'Technical Support',
       'faq.technical.browsers.question': 'What browsers are supported?',
       'faq.technical.browsers.answer': 'Bilten works on all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your browser for the best experience.',
       'faq.technical.mobileApp.question': 'Is there a mobile app?',
       'faq.technical.mobileApp.answer': 'Yes, we have mobile apps for iOS and Android. Download them from the App Store or Google Play Store for the best mobile experience, including offline ticket access.',
       'faq.technical.resetPassword.question': 'How do I reset my password?',
       'faq.technical.resetPassword.answer': 'Click "Forgot Password" on the login page, enter your email address, and follow the instructions in the reset email. You can also change your password in your account settings.',
       'faq.technical.integration.question': 'Can I integrate Bilten with my website?',
       'faq.technical.integration.answer': 'Yes, we offer API access and embeddable widgets for organizers. Contact our support team for integration documentation and assistance.',
       
       'faq.security.title': 'Security & Privacy',
       'faq.security.privacy.question': 'How do you protect my personal information?',
       'faq.security.privacy.answer': 'We follow strict data protection regulations and use industry-standard security measures. Your personal information is encrypted and never shared with third parties without your consent.',
       'faq.security.deleteAccount.question': 'Can I delete my account?',
       'faq.security.deleteAccount.answer': 'Yes, you can delete your account in your account settings. Note that this action is permanent and will cancel any upcoming events you\'ve organized or purchased tickets for.',
       'faq.security.dataBreach.question': 'How do you handle data breaches?',
       'faq.security.dataBreach.answer': 'In the unlikely event of a data breach, we have a comprehensive response plan. We\'ll notify affected users immediately and take all necessary steps to secure accounts and prevent further issues.',
       
       'faq.help.title': 'Need More Help?',
       'faq.help.subtitle': 'Our support team is here to help you with any questions or issues you might have.',
       'faq.help.email.title': 'Email Support',
       'faq.help.email.description': 'Send us an email and we\'ll get back to you within 24 hours.',
       'faq.help.email.button': 'Send Email',
       'faq.help.phone.title': 'Phone Support',
       'faq.help.phone.description': 'Call us during business hours for immediate assistance.',
       'faq.help.phone.button': 'Call Now',
       'faq.help.center.title': 'Help Center',
       'faq.help.center.description': 'Browse our comprehensive help articles and tutorials.',
       'faq.help.center.button': 'Visit Help Center',
       
       'faq.getStarted.title': 'Ready to Get Started?',
       'faq.getStarted.subtitle': 'Explore our platform and discover amazing events or create your own.',
       'faq.getStarted.browseEvents': 'Browse Events',
       'faq.getStarted.createEvent': 'Create Event',
       'help.gs.findEvents.answer': 'You can browse events in several ways: use the search bar to find specific events, browse by category, use the calendar view to see events by date, or check out our featured events on the homepage.',
       
       'help.gs.purchaseTickets.question': 'How do I purchase tickets?',
       'help.gs.purchaseTickets.answer': 'To purchase tickets, first find an event you\'re interested in. Click on the event to view details, select your desired ticket type and quantity, then proceed to checkout. You can pay securely with credit card or other payment methods.',
       
       'help.am.updateProfile.question': 'How do I update my profile information?',
       'help.am.updateProfile.answer': 'Go to your Profile page from the user menu, click "Edit Profile", make your changes, and save. You can update your name, email, profile picture, and other personal information.',
       
       'help.am.changePassword.question': 'How do I change my password?',
       'help.am.changePassword.answer': 'Navigate to Settings > Security, click "Change Password", enter your current password and new password, then confirm the change. Make sure your new password is strong and unique.',
       
       'help.am.deleteAccount.question': 'How do I delete my account?',
       'help.am.deleteAccount.answer': 'To delete your account, go to Settings > Account, scroll to the bottom, and click "Delete Account". Please note this action is irreversible and will permanently remove all your data.',
       
       'help.ev.createEvent.question': 'How do I create an event?',
       'help.ev.createEvent.answer': 'To create an event, you need an organizer account. Click "Create Event" in the navigation, fill in all required information including title, description, date, location, and ticket details. Submit for review and approval.',
       
       'help.ev.editEvent.question': 'Can I edit an event after publishing?',
       'help.ev.editEvent.answer': 'Yes, you can edit your published events. Go to your Organizer Dashboard, find the event, and click "Edit". Note that significant changes may require re-approval and will notify registered attendees.',
       
       'help.ev.cancelEvent.question': 'How do I cancel an event?',
       'help.ev.cancelEvent.answer': 'To cancel an event, go to your Organizer Dashboard, select the event, and click "Cancel Event". You\'ll need to provide a reason and all registered attendees will be automatically refunded and notified.',
       
       'help.tk.accessTickets.question': 'How do I access my tickets?',
       'help.tk.accessTickets.answer': 'Your tickets are available in the "My Tickets" section. You can view them on your phone for entry, download them as PDF, or print them. Each ticket has a unique QR code for entry.',
       
       'help.tk.transferTickets.question': 'Can I transfer my ticket to someone else?',
       'help.tk.transferTickets.answer': 'Yes, you can transfer tickets to another person. Go to "My Tickets", select the ticket, and click "Transfer". Enter the recipient\'s email address and they\'ll receive the ticket.',
       
       'help.tk.lostTickets.question': 'What if I lose my ticket?',
       'help.tk.lostTickets.answer': 'Don\'t worry! You can always access your tickets in the "My Tickets" section. If you\'re having trouble, contact our support team and we\'ll help you retrieve your ticket information.',
       
       'help.pb.paymentMethods.question': 'What payment methods do you accept?',
       'help.pb.paymentMethods.answer': 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and Apple Pay. All payments are processed securely through our trusted payment partners.',
       
       'help.pb.refunds.question': 'How do I get a refund?',
       'help.pb.refunds.answer': 'Refund policies vary by event. For cancelled events, refunds are automatic. For other cases, contact the event organizer first. If you need help, reach out to our support team.',
       
       'help.pb.orderHistory.question': 'Where can I find my order history?',
       'help.pb.orderHistory.answer': 'Your complete order history is available in the "Orders" section. You can view past purchases, download receipts, and track refund status for all your transactions.',
       
       'help.ts.websiteNotLoading.question': 'The website is not loading properly',
       'help.ts.websiteNotLoading.answer': 'Try refreshing the page, clearing your browser cache, or using a different browser. If the problem persists, check your internet connection or contact our technical support team.',
       
       'help.ts.cantLogin.question': 'I can\'t log into my account',
       'help.ts.cantLogin.answer': 'First, make sure you\'re using the correct email and password. If you\'ve forgotten your password, use the "Forgot Password" link. If you\'re still having issues, contact support.',
       
       'help.ts.mobileAppNotWorking.question': 'The mobile app is not working',
       'help.ts.mobileAppNotWorking.answer': 'Try updating the app to the latest version, restarting your device, or reinstalling the app. If problems continue, please report the issue with your device and app version details.',
       
       // Help Center Contact Methods
       'help.contact.liveChat.title': 'Live Chat',
       'help.contact.liveChat.description': 'Get instant help from our support team',
       'help.contact.liveChat.action': 'Start Chat',
       
       'help.contact.email.title': 'Email Support',
       'help.contact.email.description': 'Send us a detailed message',
       'help.contact.email.action': 'Send Email',
       
       'help.contact.phone.title': 'Phone Support',
       'help.contact.phone.description': 'Call us during business hours',
       'help.contact.phone.action': 'Call Now',
       
       // Help Center Popular Topics
       'help.topics.createEvent': 'How to create an event',
       'help.topics.ticketRefunds': 'Ticket refunds and cancellations',
       'help.topics.accountSecurity': 'Account security',
       'help.topics.mobileTroubleshooting': 'Mobile app troubleshooting',
       'help.topics.paymentMethods': 'Payment methods',
       'help.topics.eventPromotion': 'Event promotion tips',
       
       // News & Insights
       'news.title': 'News & Insights',
       'news.subtitle': 'Stay updated with the latest trends, tips, and insights from the event industry',
       'news.searchPlaceholder': 'Search articles...',
       'news.loading': 'Loading articles...',
       'news.noArticles': 'No articles found',
       'news.noArticlesSubtitle': 'Check back soon for new articles!',
       'news.noArticlesSearch': 'Try adjusting your search terms or filters.',
       'news.clearSearch': 'Clear Search',
       'news.clearFilters': 'Clear filters',
       'news.tryAgain': 'Try Again',
       'news.readMore': 'Read More',
       'news.previous': 'Previous',
       'news.next': 'Next',
       'news.views': 'views',
       'news.minRead': 'min',
       
       // News Filters & Sorting
       'news.sortBy': 'Sort by:',
       'news.sortDate': 'Date',
       'news.sortPopularity': 'Popularity',
       'news.sortTitle': 'Title',
       'news.allCategories': 'All Categories',
       
       // News Categories
       'news.categories.technology': 'Technology',
       'news.categories.business': 'Business',
       'news.categories.marketing': 'Marketing',
       'news.categories.design': 'Design',
       'news.categories.general': 'General',
       
       // News Error Messages
       'news.error.loadFailed': 'Failed to load articles:',
       'news.error.searchFailed': 'Search failed:',
       
       // Events Page
       'events.title': 'Bilten Events',
       'events.subtitle': 'Discover and save events you care about.',
       'events.loading': 'Loading amazing events...',
       'events.error.loadFailed': 'Failed to load events:',
       'events.error.tryAgain': 'Try Again',
       'events.noEvents': 'No events match your filters',
       'events.noEventsSubtitle': 'Try adjusting or clearing the filters.',
       'events.clearFilters': 'Clear filters',
       'events.viewDetails': 'View Details',
       'events.filters.search': 'Search events...',
       'events.filters.category': 'Category',
       'events.filters.freeOnly': 'Free events only',
       'events.filters.sortBy': 'Sort by',
       'events.filters.sortDateAsc': 'Date (earliest first)',
       'events.filters.sortDateDesc': 'Date (latest first)',
       'events.filters.sortPriceLow': 'Price (low to high)',
       'events.filters.sortPriceHigh': 'Price (high to low)',
       'events.categories.all': 'All Categories',
       'events.categories.technology': 'Technology',
       'events.categories.business': 'Business',
       'events.categories.arts': 'Arts',
       'events.categories.sports': 'Sports',
       'events.categories.education': 'Education',
       'events.categories.networking': 'Networking',
       
       // Navigation & Menu
       'nav.menu': 'Menu',
       'nav.basket': 'Basket',
       'nav.basketEmpty': 'Your basket is empty',
       'nav.basketItems': 'item',
       'nav.basketItemsPlural': 'items',
       'nav.viewBasket': 'View Basket',
       'nav.total': 'Total:',
       'nav.moreItems': 'more item',
       'nav.moreItemsPlural': 'more items',
       
       // User Menu
       'user.guest': 'Guest',
       'user.platformAdmin': 'Platform Admin',
       'user.eventOrganizer': 'Event Organizer',
       'user.customer': 'Customer',
       'user.user': 'User',
       
       // Menu Items
       'menu.signIn': 'Sign In',
       'menu.signUp': 'Sign Up',
       'menu.logout': 'Logout',
       'menu.myPasket': 'My Pasket',
       'menu.myProfile': 'My Profile',
       'menu.accountSettings': 'Account Settings',
       'menu.notificationPreferences': 'Notification Preferences',
       'menu.faq': 'FAQ',
       'menu.helpSupport': 'Help & Support',
       
       // Admin Menu Items
       'menu.dashboard': 'Dashboard',
       'menu.userManagement': 'User Management',
       'menu.contentModeration': 'Content Moderation',
       'menu.platformAnalytics': 'Platform Analytics',
       'menu.financialReports': 'Financial Reports',
       'menu.systemConfiguration': 'System Configuration',
       'menu.securityCompliance': 'Security & Compliance',
       'menu.teamManagement': 'Team Management',
       
       // Organizer Menu Items
       'menu.eventsManagement': 'Events Management',
       'menu.createEvent': 'Create Event',
       'menu.ticketManagement': 'Ticket Management',
       'menu.organization': 'Organization',
       'menu.financial': 'Financial',
       'menu.analyticsInsights': 'Analytics & Insights',
       'menu.marketing': 'Marketing',
       'menu.customerSupport': 'Customer Support',
       
       // User Menu Items
       'menu.myTickets': 'My Tickets',
       'menu.orderHistory': 'Order History',
       'menu.favoriteEvents': 'Favorite Events',
       'menu.paymentMethods': 'Payment Methods',
       
       // Mobile Menu
       'mobile.menu': 'Menu',
       'mobile.mainNavigation': 'Main Navigation',
    },
    es: {
      'nav.events': 'Eventos',
      'nav.news': 'Noticias',
      'nav.about': 'Acerca de',
      'nav.help': 'Ayuda',
      'auth.signin': 'Iniciar sesión',
      'auth.signup': 'Registrarse',
      'home.discover': 'Descubre eventos increíbles cerca de ti',
      'home.askBilten': 'Preguntar a Bilten',
      'footer.company': 'Empresa',
      'footer.events': 'Eventos',
      'footer.support': 'Soporte',
      'footer.legal': 'Legal',
      'footer.connect': 'Conectar',
      'language.select': 'Seleccionar Idioma',
    },
         fr: {
       'nav.events': 'Événements',
       'nav.news': 'Actualités',
       'nav.about': 'À propos',
       'nav.help': 'Aide',
       'auth.signin': 'Se connecter',
       'auth.signup': 'S\'inscrire',
       'home.discover': 'Découvrez des événements incroyables près de chez vous',
       'home.askBilten': 'Demander à Bilten',
       'footer.company': 'Entreprise',
       'footer.events': 'Événements',
       'footer.support': 'Support',
       'footer.legal': 'Mentions légales',
       'footer.connect': 'Se connecter',
       'language.select': 'Sélectionner la langue',
     },
     de: {
       'nav.events': 'Veranstaltungen',
       'nav.news': 'Nachrichten',
       'nav.about': 'Über uns',
       'nav.help': 'Hilfe',
       'auth.signin': 'Anmelden',
       'auth.signup': 'Registrieren',
       'home.discover': 'Entdecke erstaunliche Events in deiner Nähe',
       'home.askBilten': 'Frage Bilten',
       'footer.company': 'Unternehmen',
       'footer.events': 'Veranstaltungen',
       'footer.support': 'Support',
       'footer.legal': 'Rechtliches',
       'footer.connect': 'Verbinden',
       'language.select': 'Sprache auswählen',
     },
     it: {
       'nav.events': 'Eventi',
       'nav.news': 'Notizie',
       'nav.about': 'Chi siamo',
       'nav.help': 'Aiuto',
       'auth.signin': 'Accedi',
       'auth.signup': 'Registrati',
       'home.discover': 'Scopri eventi incredibili vicino a te',
       'home.askBilten': 'Chiedi a Bilten',
       'footer.company': 'Azienda',
       'footer.events': 'Eventi',
       'footer.support': 'Supporto',
       'footer.legal': 'Legale',
       'footer.connect': 'Connetti',
       'language.select': 'Seleziona lingua',
     },
     ar: {
       // Navigation
       'nav.events': 'الفعاليات',
       'nav.news': 'الأخبار',
       'nav.about': 'حول',
       'nav.help': 'المساعدة',
       
       // Auth
       'auth.signin': 'تسجيل الدخول',
       'auth.signup': 'إنشاء حساب',
       'auth.signout': 'تسجيل الخروج',
       'auth.email': 'البريد الإلكتروني',
       'auth.password': 'كلمة المرور',
       'auth.forgotPassword': 'نسيت كلمة المرور؟',
       'auth.createAccount': 'إنشاء حسابك',
       'auth.firstName': 'الاسم الأول',
       'auth.lastName': 'اسم العائلة',
       'auth.accountType': 'نوع الحساب',
       'auth.attendee': 'مشارك',
       'auth.organizer': 'منظم الفعاليات',
       
       // Social Login
       'social.google': 'تسجيل الدخول بـ Google',
       'social.facebook': 'تسجيل الدخول بـ Facebook',
       'social.apple': 'تسجيل الدخول بـ Apple',
       'social.orContinueWith': 'أو المتابعة بـ',
       'social.signInToBilten': 'تسجيل الدخول إلى بيلتن',
       'social.chooseLoginMethod': 'اختر طريقة تسجيل الدخول المفضلة لديك',
       'social.continueWithGoogle': 'المتابعة بـ Google',
       'social.continueWithFacebook': 'المتابعة بـ Facebook',
       'social.continueWithApple': 'المتابعة بـ Apple',
       'social.orSignInWithEmail': 'أو تسجيل الدخول بالبريد الإلكتروني',
       
       // Login Page
       'login.title': 'تسجيل الدخول إلى حسابك',
       'login.emailLabel': 'البريد الإلكتروني',
       'login.emailPlaceholder': 'أدخل بريدك الإلكتروني',
       'login.passwordLabel': 'كلمة المرور',
       'login.passwordPlaceholder': 'أدخل كلمة المرور',
       'login.forgotPassword': 'نسيت كلمة المرور؟',
       'login.signInButton': 'تسجيل الدخول',
       'login.signingIn': 'جاري تسجيل الدخول...',
       'login.orContinueWith': 'أو المتابعة بـ',
       'login.dontHaveAccount': 'ليس لديك حساب؟',
       'login.signUpHere': 'إنشاء حساب هنا',
       
       // Register Page
       'register.title': 'إنشاء حسابك',
       'register.firstNameLabel': 'الاسم الأول',
       'register.firstNamePlaceholder': 'أدخل اسمك الأول',
       'register.lastNameLabel': 'اسم العائلة',
       'register.lastNamePlaceholder': 'أدخل اسم العائلة',
       'register.emailLabel': 'البريد الإلكتروني',
       'register.emailPlaceholder': 'أدخل بريدك الإلكتروني',
       'register.passwordLabel': 'كلمة المرور',
       'register.passwordPlaceholder': 'أدخل كلمة المرور',
       'register.accountTypeLabel': 'نوع الحساب',
       'register.attendeeOption': 'مشارك',
       'register.organizerOption': 'منظم الفعاليات',
       'register.createAccountButton': 'إنشاء حساب',
       'register.creatingAccount': 'جاري إنشاء الحساب...',
       'register.orContinueWith': 'أو المتابعة بـ',
       'register.signUpWithGoogle': 'إنشاء حساب بـ Google',
       'register.signUpWithFacebook': 'إنشاء حساب بـ Facebook',
       'register.signUpWithApple': 'إنشاء حساب بـ Apple',
       'register.alreadyHaveAccount': 'لديك حساب بالفعل؟',
       'register.signInHere': 'تسجيل الدخول هنا',
       
       // Home
       'home.discover': 'اكتشف فعاليات مذهلة قريبة منك',
       'home.askBilten': 'اسأل بيلتن',
       'home.tryAsking': 'جرب أن تسأل:',
       'home.musicEvents': 'أرني فعاليات الموسيقى',
       'home.freeEvents': 'ابحث عن فعاليات مجانية هذا الأسبوع',
       'home.businessNetworking': 'شبكة الأعمال التجارية قريبة مني',
       'home.artExhibitions': 'معارض الفن',
       'home.sportsEvents': 'فعاليات الرياضة',
       
       // Footer
       'footer.company': 'الشركة',
       'footer.events': 'الفعاليات',
       'footer.support': 'الدعم',
       'footer.legal': 'القانونية',
       'footer.connect': 'تواصل',
       'footer.aboutUs': 'من نحن',
       'footer.careers': 'الوظائف',
       'footer.press': 'الصحافة',
       'footer.contact': 'اتصل بنا',
       'footer.browseEvents': 'تصفح الفعاليات',
       'footer.eventCalendar': 'تقويم الفعاليات',
       'footer.searchEvents': 'البحث في الفعاليات',
       'footer.createEvent': 'إنشاء فعالية',
       'footer.helpCenter': 'مركز المساعدة',
       'footer.faq': 'الأسئلة الشائعة',
       'footer.contactSupport': 'اتصل بالدعم',
       'footer.news': 'الأخبار',
       'footer.termsOfService': 'شروط الخدمة',
       'footer.privacyPolicy': 'سياسة الخصوصية',
       'footer.cookiePolicy': 'سياسة ملفات تعريف الارتباط',
       'footer.refundPolicy': 'سياسة الاسترداد',
       'footer.allRightsReserved': 'جميع الحقوق محفوظة.',
       
       // Language
       'language.select': 'اختر اللغة',
       'language.english': 'الإنجليزية',
       'language.arabic': 'العربية',
       'language.german': 'الألمانية',
       'language.french': 'الفرنسية',
       'language.italian': 'الإيطالية',
       
       // Common
       'common.loading': 'جاري التحميل...',
       'common.error': 'خطأ',
       'common.success': 'نجح',
       'common.cancel': 'إلغاء',
       'common.save': 'حفظ',
       'common.edit': 'تعديل',
       'common.delete': 'حذف',
       'common.view': 'عرض',
       'common.close': 'إغلاق',
       'common.back': 'رجوع',
       'common.next': 'التالي',
       'common.previous': 'السابق',
       'common.search': 'بحث',
       'common.filter': 'تصفية',
       'common.sort': 'ترتيب',
       'common.all': 'الكل',
       'common.none': 'لا شيء',
       'common.yes': 'نعم',
       'common.no': 'لا',
       'common.ok': 'موافق',
       'common.switchToLight': 'التبديل إلى الوضع الفاتح',
       'common.switchToDark': 'التبديل إلى الوضع الداكن',
       
       // Guest Access
       'guest.accessDenied': 'تم رفض الوصول',
       'guest.accessDeniedMessage': 'هذه الميزة تتطلب حساب مسجل. يرجى تسجيل الدخول أو إنشاء حساب للمتابعة.',
       'guest.loginToAccess': 'تسجيل الدخول للوصول',
       'guest.createAccount': 'إنشاء حساب',
       'guest.backToHome': 'العودة إلى الصفحة الرئيسية',
       'guest.aiChatRestricted': 'الدردشة الذكية مقيدة',
       'guest.aiChatRestrictedMessage': 'الدردشة الذكية متاحة فقط للمستخدمين المسجلين. يرجى تسجيل الدخول للوصول إلى هذه الميزة.',
       'guest.eventDetailsRestricted': 'تفاصيل الفعالية مقيدة',
       'guest.eventDetailsRestrictedMessage': 'تفاصيل الفعالية متاحة فقط للمستخدمين المسجلين. يرجى تسجيل الدخول لعرض معلومات الفعالية الكاملة.',
       'guest.signInToViewDetails': 'تسجيل الدخول لعرض التفاصيل',
       
       // Help Center
       'help.title': 'مركز المساعدة',
       'help.subtitle': 'اعثر على إجابات للأسئلة الشائعة واحصل على الدعم الذي تحتاجه',
       'help.searchPlaceholder': 'ابحث عن مقالات المساعدة أو الأسئلة الشائعة أو المواضيع...',
       'help.noResults': 'لم يتم العثور على نتائج',
       'help.noResultsSubtitle': 'جرب تعديل مصطلحات البحث أو تصفح فئاتنا أعلاه.',
       'help.clearSearch': 'مسح البحث',
       'help.stillNeedHelp': 'هل ما زلت بحاجة إلى مساعدة؟',
       'help.supportTeam': 'فريق الدعم لدينا هنا لمساعدتك على مدار الساعة طوال أيام الأسبوع',
       'help.contactSupport': 'اتصل بالدعم',
       'help.sendMessage': 'إرسال رسالة',
       'help.legalPolicies': 'القانونية والسياسات',
       'help.popularTopics': 'المواضيع الشائعة',
       
       // Help Center Sections
       'help.sections.gettingStarted': 'البدء',
       'help.sections.accountManagement': 'إدارة الحساب',
       'help.sections.events': 'الفعاليات',
       'help.sections.tickets': 'التذاكر',
       'help.sections.payments': 'المدفوعات والفواتير',
       'help.sections.technical': 'الدعم التقني',
       
       // Help Center Questions & Answers
       'help.gs.createAccount.question': 'كيف يمكنني إنشاء حساب؟',
       'help.gs.createAccount.answer': 'إنشاء حساب سهل! انقر على زر "إنشاء حساب" في التنقل العلوي، املأ تفاصيلك بما في ذلك البريد الإلكتروني وكلمة المرور، وتحقق من عنوان بريدك الإلكتروني. ستكون جاهزاً لبدء استكشاف الفعاليات في أي وقت.',
       
       'help.gs.findEvents.question': 'كيف يمكنني العثور على الفعاليات؟',
       'help.gs.findEvents.answer': 'يمكنك تصفح الفعاليات بعدة طرق: استخدم شريط البحث للعثور على فعاليات محددة، تصفح حسب الفئة، استخدم عرض التقويم لرؤية الفعاليات حسب التاريخ، أو تحقق من الفعاليات المميزة على الصفحة الرئيسية.',
       
       'help.gs.purchaseTickets.question': 'كيف يمكنني شراء التذاكر؟',
       'help.gs.purchaseTickets.answer': 'لشراء التذاكر، ابحث أولاً عن فعالية تهتم بها. انقر على الفعالية لعرض التفاصيل، اختر نوع التذكرة المطلوب والكمية، ثم تابع إلى الدفع. يمكنك الدفع بأمان ببطاقة الائتمان أو طرق الدفع الأخرى.',
       
       'help.am.updateProfile.question': 'كيف يمكنني تحديث معلومات ملفي الشخصي؟',
       'help.am.updateProfile.answer': 'اذهب إلى صفحة ملفك الشخصي من قائمة المستخدم، انقر على "تعديل الملف الشخصي"، قم بالتغييرات وحفظها. يمكنك تحديث اسمك والبريد الإلكتروني وصورة الملف الشخصي والمعلومات الشخصية الأخرى.',
       
       'help.am.changePassword.question': 'كيف يمكنني تغيير كلمة المرور؟',
       'help.am.changePassword.answer': 'انتقل إلى الإعدادات > الأمان، انقر على "تغيير كلمة المرور"، أدخل كلمة المرور الحالية وكلمة المرور الجديدة، ثم أكد التغيير. تأكد من أن كلمة المرور الجديدة قوية وفريدة.',
       
       'help.am.deleteAccount.question': 'كيف يمكنني حذف حسابي؟',
       'help.am.deleteAccount.answer': 'لحذف حسابك، اذهب إلى الإعدادات > الحساب، انتقل إلى الأسفل، وانقر على "حذف الحساب". يرجى ملاحظة أن هذا الإجراء لا يمكن التراجع عنه وسيزيل جميع بياناتك نهائياً.',
       
       'help.ev.createEvent.question': 'كيف يمكنني إنشاء فعالية؟',
       'help.ev.createEvent.answer': 'لإنشاء فعالية، تحتاج إلى حساب منظم. انقر على "إنشاء فعالية" في التنقل، املأ جميع المعلومات المطلوبة بما في ذلك العنوان والوصف والتاريخ والموقع وتفاصيل التذاكر. أرسل للمراجعة والموافقة.',
       
       'help.ev.editEvent.question': 'هل يمكنني تعديل فعالية بعد نشرها؟',
       'help.ev.editEvent.answer': 'نعم، يمكنك تعديل الفعاليات المنشورة. اذهب إلى لوحة تحكم المنظم، ابحث عن الفعالية، وانقر على "تعديل". لاحظ أن التغييرات المهمة قد تتطلب إعادة الموافقة وستخطر المشاركين المسجلين.',
       
       'help.ev.cancelEvent.question': 'كيف يمكنني إلغاء فعالية؟',
       'help.ev.cancelEvent.answer': 'لإلغاء فعالية، اذهب إلى لوحة تحكم المنظم، اختر الفعالية، وانقر على "إلغاء الفعالية". ستحتاج إلى تقديم سبب وسيتم رد الأموال تلقائياً لجميع المشاركين المسجلين وإخطارهم.',
       
       'help.tk.accessTickets.question': 'كيف يمكنني الوصول إلى تذاكري؟',
       'help.tk.accessTickets.answer': 'تذاكرك متاحة في قسم "تذاكري". يمكنك عرضها على هاتفك للدخول، تحميلها كملف PDF، أو طباعتها. كل تذكرة لها رمز QR فريد للدخول.',
       
       'help.tk.transferTickets.question': 'هل يمكنني نقل تذكرتي إلى شخص آخر؟',
       'help.tk.transferTickets.answer': 'نعم، يمكنك نقل التذاكر إلى شخص آخر. اذهب إلى "تذاكري"، اختر التذكرة، وانقر على "نقل". أدخل عنوان البريد الإلكتروني للمستلم وسيتلقى التذكرة.',
       
       'help.tk.lostTickets.question': 'ماذا لو فقدت تذكرتي؟',
       'help.tk.lostTickets.answer': 'لا تقلق! يمكنك دائماً الوصول إلى تذاكرك في قسم "تذاكري". إذا كنت تواجه مشكلة، اتصل بفريق الدعم وسنساعدك في استرداد معلومات تذكرتك.',
       
       'help.pb.paymentMethods.question': 'ما هي طرق الدفع التي تقبلونها؟',
       'help.pb.paymentMethods.answer': 'نحن نقبل جميع بطاقات الائتمان الرئيسية (فيزا، ماستركارد، أمريكان إكسبريس)، باي بال، وآبل باي. جميع المدفوعات تتم معالجتها بأمان من خلال شركاء الدفع الموثوقين لدينا.',
       
       'help.pb.refunds.question': 'كيف يمكنني الحصول على استرداد؟',
       'help.pb.refunds.answer': 'سياسات الاسترداد تختلف حسب الفعالية. للفعاليات الملغاة، الاستردادات تلقائية. للحالات الأخرى، اتصل بمنظم الفعالية أولاً. إذا كنت بحاجة إلى مساعدة، تواصل مع فريق الدعم لدينا.',
       
       'help.pb.orderHistory.question': 'أين يمكنني العثور على سجل طلباتي؟',
       'help.pb.orderHistory.answer': 'سجل طلباتك الكامل متاح في قسم "الطلبات". يمكنك عرض المشتريات السابقة، تحميل الإيصالات، وتتبع حالة الاسترداد لجميع معاملاتك.',
       
       'help.ts.websiteNotLoading.question': 'الموقع لا يتم تحميله بشكل صحيح',
       'help.ts.websiteNotLoading.answer': 'جرب تحديث الصفحة، مسح ذاكرة التخزين المؤقت للمتصفح، أو استخدام متصفح مختلف. إذا استمرت المشكلة، تحقق من اتصال الإنترنت أو اتصل بفريق الدعم التقني لدينا.',
       
       'help.ts.cantLogin.question': 'لا يمكنني تسجيل الدخول إلى حسابي',
       'help.ts.cantLogin.answer': 'أولاً، تأكد من استخدام البريد الإلكتروني وكلمة المرور الصحيحة. إذا نسيت كلمة المرور، استخدم رابط "نسيت كلمة المرور". إذا كنت ما زلت تواجه مشاكل، اتصل بالدعم.',
       
       'help.ts.mobileAppNotWorking.question': 'التطبيق المحمول لا يعمل',
       'help.ts.mobileAppNotWorking.answer': 'جرب تحديث التطبيق إلى أحدث إصدار، إعادة تشغيل جهازك، أو إعادة تثبيت التطبيق. إذا استمرت المشاكل، يرجى الإبلاغ عن المشكلة مع تفاصيل جهازك وإصدار التطبيق.',
       
       // Help Center Contact Methods
       'help.contact.liveChat.title': 'الدردشة المباشرة',
       'help.contact.liveChat.description': 'احصل على مساعدة فورية من فريق الدعم لدينا',
       'help.contact.liveChat.action': 'ابدأ الدردشة',
       
       'help.contact.email.title': 'دعم البريد الإلكتروني',
       'help.contact.email.description': 'أرسل لنا رسالة مفصلة',
       'help.contact.email.action': 'إرسال بريد إلكتروني',
       
       'help.contact.phone.title': 'دعم الهاتف',
       'help.contact.phone.description': 'اتصل بنا خلال ساعات العمل',
       'help.contact.phone.action': 'اتصل الآن',
       
       // Help Center Popular Topics
       'help.topics.createEvent': 'كيفية إنشاء فعالية',
       'help.topics.ticketRefunds': 'استرداد وإلغاء التذاكر',
       'help.topics.accountSecurity': 'أمان الحساب',
       'help.topics.mobileTroubleshooting': 'استكشاف أخطاء التطبيق المحمول',
       'help.topics.paymentMethods': 'طرق الدفع',
       'help.topics.eventPromotion': 'نصائح ترويج الفعاليات',
       
       // News & Insights
       'news.title': 'الأخبار والرؤى',
       'news.subtitle': 'ابق محدثاً مع أحدث الاتجاهات والنصائح والرؤى من صناعة الفعاليات',
       'news.searchPlaceholder': 'البحث في المقالات...',
       'news.loading': 'جاري تحميل المقالات...',
       'news.noArticles': 'لم يتم العثور على مقالات',
       'news.noArticlesSubtitle': 'تحقق مرة أخرى قريباً للحصول على مقالات جديدة!',
       'news.noArticlesSearch': 'جرب تعديل مصطلحات البحث أو المرشحات.',
       'news.clearSearch': 'مسح البحث',
       'news.clearFilters': 'مسح المرشحات',
       'news.tryAgain': 'حاول مرة أخرى',
       'news.readMore': 'اقرأ المزيد',
       'news.previous': 'السابق',
       'news.next': 'التالي',
       'news.views': 'مشاهدات',
       'news.minRead': 'دقيقة قراءة',
       
       // News Filters & Sorting
       'news.sortBy': 'ترتيب حسب:',
       'news.sortDate': 'التاريخ',
       'news.sortPopularity': 'الشعبية',
       'news.sortTitle': 'العنوان',
       'news.allCategories': 'جميع الفئات',
       
       // News Categories
       'news.categories.technology': 'التكنولوجيا',
       'news.categories.business': 'الأعمال',
       'news.categories.marketing': 'التسويق',
       'news.categories.design': 'التصميم',
       'news.categories.general': 'عام',
       
       // News Error Messages
       'news.error.loadFailed': 'فشل في تحميل المقالات:',
       'news.error.searchFailed': 'فشل البحث:',
       
       // Events Page
       'events.title': 'فعاليات بيلتن',
       'events.subtitle': 'اكتشف واحفظ الفعاليات التي تهتم بها.',
       'events.loading': 'جاري تحميل الفعاليات المذهلة...',
       'events.error.loadFailed': 'فشل في تحميل الفعاليات:',
       'events.error.tryAgain': 'حاول مرة أخرى',
       'events.noEvents': 'لا توجد فعاليات تطابق مرشحاتك',
       'events.noEventsSubtitle': 'جرب تعديل أو مسح المرشحات.',
       'events.clearFilters': 'مسح المرشحات',
       'events.viewDetails': 'عرض التفاصيل',
       'events.filters.search': 'البحث في الفعاليات...',
       'events.filters.category': 'الفئة',
       'events.filters.freeOnly': 'الفعاليات المجانية فقط',
       'events.filters.sortBy': 'ترتيب حسب',
       'events.filters.sortDateAsc': 'التاريخ (الأقدم أولاً)',
       'events.filters.sortDateDesc': 'التاريخ (الأحدث أولاً)',
       'events.filters.sortPriceLow': 'السعر (من الأقل إلى الأعلى)',
       'events.filters.sortPriceHigh': 'السعر (من الأعلى إلى الأقل)',
       'events.categories.all': 'جميع الفئات',
       'events.categories.technology': 'التكنولوجيا',
       'events.categories.business': 'الأعمال',
       'events.categories.arts': 'الفنون',
       'events.categories.sports': 'الرياضة',
       'events.categories.education': 'التعليم',
       'events.categories.networking': 'الشبكات',
       
       // Navigation & Menu
       'nav.menu': 'القائمة',
       'nav.basket': 'السلة',
       'nav.basketEmpty': 'السلة فارغة',
       'nav.basketItems': 'عنصر',
       'nav.basketItemsPlural': 'عناصر',
       'nav.viewBasket': 'عرض السلة',
       'nav.total': 'المجموع:',
       'nav.moreItems': 'عناصر إضافية',
       'nav.moreItemsPlural': 'عناصر إضافية',
       
       // User Menu
       'user.guest': 'زائر',
       'user.platformAdmin': 'مدير المنصة',
       'user.eventOrganizer': 'منظم الفعاليات',
       'user.customer': 'عميل',
       'user.user': 'مستخدم',
       
       // Menu Items
       'menu.signIn': 'تسجيل الدخول',
       'menu.signUp': 'إنشاء حساب',
       'menu.logout': 'تسجيل الخروج',
       'menu.myPasket': 'سلتي',
       'menu.myProfile': 'ملفي الشخصي',
       'menu.accountSettings': 'إعدادات الحساب',
       'menu.notificationPreferences': 'تفضيلات الإشعارات',
       'menu.faq': 'الأسئلة الشائعة',
       'menu.helpSupport': 'المساعدة والدعم',
       
       // Admin Menu Items
       'menu.dashboard': 'لوحة التحكم',
       'menu.userManagement': 'إدارة المستخدمين',
       'menu.contentModeration': 'مراقبة المحتوى',
       'menu.platformAnalytics': 'تحليلات المنصة',
       'menu.financialReports': 'التقارير المالية',
       'menu.systemConfiguration': 'إعدادات النظام',
       'menu.securityCompliance': 'الأمان والامتثال',
       'menu.teamManagement': 'إدارة الفريق',
       
       // Organizer Menu Items
       'menu.eventsManagement': 'إدارة الفعاليات',
       'menu.createEvent': 'إنشاء فعالية',
       'menu.ticketManagement': 'إدارة التذاكر',
       'menu.organization': 'المنظمة',
       'menu.financial': 'المالية',
       'menu.analyticsInsights': 'التحليلات والرؤى',
       'menu.marketing': 'التسويق',
       'menu.customerSupport': 'دعم العملاء',
       
       // FAQ Page
       'faq.title': 'الأسئلة',
       'faq.questions': 'الشائعة',
       'faq.subtitle': 'اعثر على إجابات للأسئلة الشائعة حول بيلتن. لا تجد ما تبحث عنه؟ اتصل بفريق الدعم للحصول على مساعدة مخصصة.',
       'faq.searchPlaceholder': 'البحث في الأسئلة...',
       'faq.stats.questions': 'أسئلة شائعة',
       'faq.stats.support': 'دعم متاح',
       'faq.stats.categories': 'فئات',
       'faq.noResults.title': 'لم يتم العثور على أسئلة',
       'faq.noResults.subtitle': 'حاول تعديل مصطلحات البحث أو تصفح جميع الفئات أدناه.',
       'faq.noResults.clearSearch': 'مسح البحث',
       
       // FAQ Categories
       'faq.general.title': 'أسئلة عامة',
       'faq.general.whatIsBilten.question': 'ما هو بيلتن؟',
       'faq.general.whatIsBilten.answer': 'بيلتن هو منصة شاملة لإدارة الفعاليات تربط منظمي الفعاليات بالمشاركين. نوفر أدوات لإنشاء وإدارة واكتشاف الفعاليات من جميع الأنواع والأحجام.',
       'faq.general.createAccount.question': 'كيف أنشئ حساباً؟',
       'faq.general.createAccount.answer': 'إنشاء الحساب سهل! انقر على زر "إنشاء حساب" في الزاوية العلوية اليمنى، املأ تفاصيلك، وتحقق من بريدك الإلكتروني. يمكنك أيضاً التسجيل باستخدام حساب Google أو Facebook.',
       'faq.general.isFree.question': 'هل بيلتن مجاني للاستخدام؟',
       'faq.general.isFree.answer': 'بيلتن يقدم ميزات مجانية ومميزة. إنشاء الفعاليات الأساسية والتصفح مجاني، بينما الميزات المتقدمة مثل التحليلات والعلامة التجارية المخصصة والدعم ذو الأولوية متاحة مع خططنا المميزة.',
       'faq.general.eventTypes.question': 'ما أنواع الفعاليات التي يمكنني إنشاؤها؟',
       'faq.general.eventTypes.answer': 'يمكنك إنشاء أي نوع من الفعاليات تقريباً: الحفلات الموسيقية والمؤتمرات وورش العمل واللقاءات والفعاليات الرياضية والمعارض والندوات عبر الإنترنت والمزيد. منصتنا مصممة لاستيعاب الفعاليات من جميع الأحجام والتنسيقات.',
       
       'faq.organizers.title': 'لمنظمي الفعاليات',
       'faq.organizers.createEvent.question': 'كيف أنشئ فعاليتي الأولى؟',
       'faq.organizers.createEvent.answer': 'لإنشاء فعالية، سجل الدخول إلى حسابك وانقر على "إنشاء فعالية" في لوحة التحكم. املأ تفاصيل الفعالية، حدد أسعار التذاكر، اختر مكان الفعالية، ونشر فعاليتك. سيرشدك معالجنا خطوة بخطوة خلال العملية.',
       'faq.organizers.paymentMethods.question': 'ما طرق الدفع التي تدعمونها؟',
       'faq.organizers.paymentMethods.answer': 'ندعم بطاقات الائتمان الرئيسية (Visa و MasterCard و American Express) و PayPal والتحويلات المصرفية. جميع المدفوعات تتم معالجتها بأمان من خلال شركائنا الموثوقين في الدفع.',
       'faq.organizers.manageSales.question': 'كيف أدير مبيعات التذاكر؟',
       'faq.organizers.manageSales.answer': 'يمكنك إدارة مبيعات التذاكر من خلال لوحة تحكم المنظم. تتبع المبيعات في الوقت الفعلي، اعرض قوائم المشاركين، أرسل تحديثات للمشاركين، واصدر تقارير. يمكنك أيضاً إعداد أنواع مختلفة من التذاكر ومستويات الأسعار.',
       'faq.organizers.cancelEvent.question': 'هل يمكنني إلغاء أو إعادة جدولة فعالية؟',
       'faq.organizers.cancelEvent.answer': 'نعم، يمكنك إلغاء أو إعادة جدولة الفعاليات من خلال لوحة التحكم. نوصي بإخطار المشاركين في أقرب وقت ممكن. سياسات الاسترداد موضحة بوضوح في شروط الخدمة.',
       'faq.organizers.promoteEvent.question': 'كيف أروج لفعاليتي؟',
       'faq.organizers.promoteEvent.answer': 'بيلتن يقدم أدوات ترويج متعددة: تكامل وسائل التواصل الاجتماعي والتسويق عبر البريد الإلكتروني ووضع الفعاليات المميزة وتحسين محركات البحث. يمكنك أيضاً استخدام تحليلاتنا لفهم جمهورك وتحسين استراتيجية التسويق.',
       
       'faq.attendees.title': 'لمشاركي الفعاليات',
       'faq.attendees.findEvents.question': 'كيف أجد الفعاليات؟',
       'faq.attendees.findEvents.answer': 'تصفح الفعاليات حسب الفئة أو الموقع أو التاريخ في صفحة الفعاليات. استخدم وظيفة البحث للعثور على فعاليات محددة، أو تحقق من توصياتنا بناءً على اهتماماتك وحضورك السابق.',
       'faq.attendees.purchaseTickets.question': 'كيف أشتري تذاكر؟',
       'faq.attendees.purchaseTickets.answer': 'اختر الفعالية المطلوبة، اختر نوع التذكرة والكمية، وانتقل إلى الدفع. يمكنك الدفع ببطاقة الائتمان أو PayPal أو طرق الدفع المدعومة الأخرى. يتم تسليم التذاكر فوراً عبر البريد الإلكتروني.',
       'faq.attendees.refunds.question': 'هل يمكنني الحصول على استرداد إذا لم أتمكن من الحضور؟',
       'faq.attendees.refunds.answer': 'تختلف سياسات الاسترداد حسب الفعالية ويحددها المنظم. تحقق من تفاصيل الفعالية للحصول على معلومات الاسترداد المحددة. في معظم الحالات، الاسترداد متاح حتى 24-48 ساعة قبل الفعالية.',
       'faq.attendees.accessTickets.question': 'كيف أصل إلى تذاكري؟',
       'faq.attendees.accessTickets.answer': 'يتم إرسال التذاكر إلى بريدك الإلكتروني فوراً بعد الشراء. يمكنك أيضاً الوصول إليها في حسابك تحت "تذاكري". للدخول عبر الهاتف المحمول، ما عليك سوى عرض رمز QR على هاتفك في الفعالية.',
       'faq.attendees.eventCancelled.question': 'ماذا لو تم إلغاء الفعالية؟',
       'faq.attendees.eventCancelled.answer': 'إذا تم إلغاء الفعالية، ستتلقى إشعاراً بالبريد الإلكتروني واسترداداً تلقائياً. سيتم معالجة الاسترداد إلى طريقة الدفع الأصلية خلال 5-10 أيام عمل.',
       
       'faq.payments.title': 'المدفوعات والفواتير',
       'faq.payments.security.question': 'هل تفاصيل الدفع الخاصة بي آمنة؟',
       'faq.payments.security.answer': 'نعم، نستخدم تشفير SSL القياسي في الصناعة والامتثال لـ PCI DSS لحماية معلومات الدفع الخاصة بك. نحن لا نخزن تفاصيل بطاقة الائتمان الكاملة على خوادمنا.',
       'faq.payments.fees.question': 'ما هي رسوم الخدمة؟',
       'faq.payments.fees.answer': 'تختلف رسوم الخدمة حسب نوع الفعالية وسعر التذكرة. يتم عرض الرسوم بوضوح قبل الشراء وعادة ما تتراوح من 3-8% من سعر التذكرة. يمكن للمنظمين اختيار امتصاص هذه الرسوم أو تمريرها للمشاركين.',
       'faq.payments.payouts.question': 'متى يتلقى المنظمون مدفوعاتهم؟',
       'faq.payments.payouts.answer': 'عادة ما تتم معالجة المدفوعات خلال 3-5 أيام عمل بعد انتهاء الفعالية. للفعاليات المتكررة، تتم معالجة المدفوعات شهرياً. يمكنك تتبع حالة الدفع في لوحة تحكم المنظم.',
       'faq.payments.paymentPlans.question': 'هل تقدمون خطط دفع؟',
       'faq.payments.paymentPlans.answer': 'خطط الدفع متاحة لأنواع معينة من الفعاليات وأسعار التذاكر. ابحث عن خيار "خطة الدفع" أثناء الدفع. عادة ما تسمح الخطط بالدفع في 2-4 أقساط.',
       
       'faq.technical.title': 'الدعم التقني',
       'faq.technical.browsers.question': 'ما المتصفحات المدعومة؟',
       'faq.technical.browsers.answer': 'بيلتن يعمل على جميع المتصفحات الحديثة بما في ذلك Chrome و Firefox و Safari و Edge. نوصي باستخدام أحدث إصدار من متصفحك للحصول على أفضل تجربة.',
       'faq.technical.mobileApp.question': 'هل هناك تطبيق للهاتف المحمول؟',
       'faq.technical.mobileApp.answer': 'نعم، لدينا تطبيقات للهاتف المحمول لنظامي iOS و Android. قم بتحميلها من App Store أو Google Play Store للحصول على أفضل تجربة للهاتف المحمول، بما في ذلك الوصول للتذاكر دون اتصال.',
       'faq.technical.resetPassword.question': 'كيف أعيد تعيين كلمة المرور؟',
       'faq.technical.resetPassword.answer': 'انقر على "نسيت كلمة المرور" في صفحة تسجيل الدخول، أدخل عنوان بريدك الإلكتروني، واتبع التعليمات في بريد إعادة التعيين. يمكنك أيضاً تغيير كلمة المرور في إعدادات حسابك.',
       'faq.technical.integration.question': 'هل يمكنني دمج بيلتن مع موقعي الإلكتروني؟',
       'faq.technical.integration.answer': 'نعم، نقدم وصول API وأدوات قابلة للتضمين للمنظمين. اتصل بفريق الدعم للحصول على وثائق التكامل والمساعدة.',
       
       'faq.security.title': 'الأمان والخصوصية',
       'faq.security.privacy.question': 'كيف تحمون معلوماتي الشخصية؟',
       'faq.security.privacy.answer': 'نتبع لوائح حماية البيانات الصارمة ونستخدم تدابير الأمان القياسية في الصناعة. معلوماتك الشخصية مشفرة ولا يتم مشاركتها مع أطراف ثالثة دون موافقتك.',
       'faq.security.deleteAccount.question': 'هل يمكنني حذف حسابي؟',
       'faq.security.deleteAccount.answer': 'نعم، يمكنك حذف حسابك في إعدادات حسابك. لاحظ أن هذا الإجراء دائم وسيلغي أي فعاليات قادمة قمت بتنظيمها أو شراء تذاكر لها.',
       'faq.security.dataBreach.question': 'كيف تتعاملون مع خروقات البيانات؟',
       'faq.security.dataBreach.answer': 'في حالة حدوث خرق للبيانات، لدينا خطة استجابة شاملة. سنخطر المستخدمين المتأثرين فوراً ونتخذ جميع الخطوات اللازمة لتأمين الحسابات ومنع المزيد من المشاكل.',
       
       'faq.help.title': 'تحتاج المزيد من المساعدة؟',
       'faq.help.subtitle': 'فريق الدعم لدينا هنا لمساعدتك في أي أسئلة أو مشاكل قد تواجهها.',
       'faq.help.email.title': 'الدعم عبر البريد الإلكتروني',
       'faq.help.email.description': 'أرسل لنا بريداً إلكترونياً وسنرد عليك خلال 24 ساعة.',
       'faq.help.email.button': 'إرسال بريد إلكتروني',
       'faq.help.phone.title': 'الدعم عبر الهاتف',
       'faq.help.phone.description': 'اتصل بنا خلال ساعات العمل للحصول على مساعدة فورية.',
       'faq.help.phone.button': 'اتصل الآن',
       'faq.help.center.title': 'مركز المساعدة',
       'faq.help.center.description': 'تصفح مقالات المساعدة الشاملة والدروس التعليمية.',
       'faq.help.center.button': 'زيارة مركز المساعدة',
       
       'faq.getStarted.title': 'مستعد للبدء؟',
       'faq.getStarted.subtitle': 'استكشف منصتنا واكتشف فعاليات مذهلة أو أنشئ فعاليتك الخاصة.',
       'faq.getStarted.browseEvents': 'تصفح الفعاليات',
       'faq.getStarted.createEvent': 'إنشاء فعالية',
       
       // User Menu Items
       'menu.myTickets': 'تذاكري',
       'menu.orderHistory': 'سجل الطلبات',
       'menu.favoriteEvents': 'الفعاليات المفضلة',
       'menu.paymentMethods': 'طرق الدفع',
       
       // Mobile Menu
       'mobile.menu': 'القائمة',
       'mobile.mainNavigation': 'التنقل الرئيسي',
     },
  };

  const t = (key) => {
    return translations[currentLanguage]?.[key] || translations.en[key] || key;
  };

  const changeLanguage = (languageCode) => {
    setCurrentLanguage(languageCode);
    localStorage.setItem('language', languageCode);
    // Update document direction for RTL languages
    if (languageCode === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  };

  useEffect(() => {
    // Set initial document direction
    if (currentLanguage === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [currentLanguage]);

  const value = {
    currentLanguage,
    changeLanguage,
    languages,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
