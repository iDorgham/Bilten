import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  CalendarIcon, 
  ArrowTopRightOnSquareIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  PhotoIcon,
  DocumentIcon,
  UserIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  MegaphoneIcon,
  NewspaperIcon,
  VideoCameraIcon,
  CameraIcon
} from '@heroicons/react/24/outline';

const Press = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Company News', 'Product Updates', 'Partnerships', 'Funding', 'Events'];

  const pressReleases = [
    {
      id: 1,
      title: 'Bilten Raises $25M Series B Funding to Expand Event Platform',
      category: 'Funding',
      date: '2024-01-15',
      summary: 'Bilten, the leading event discovery and ticketing platform, has secured $25 million in Series B funding to accelerate product development and expand into new markets.',
      content: 'The funding round was led by Tech Ventures Capital, with participation from existing investors. The company plans to use the funds to enhance its AI-powered event recommendations, expand its mobile app capabilities, and grow its team across engineering, design, and customer success roles.',
      link: '#',
      featured: true
    },
    {
      id: 2,
      title: 'Bilten Launches AI-Powered Event Recommendations',
      category: 'Product Updates',
      date: '2024-01-10',
      summary: 'Bilten introduces advanced AI algorithms to provide personalized event recommendations based on user preferences and behavior patterns.',
      content: 'The new AI recommendation engine analyzes user browsing history, ticket purchases, and social connections to suggest relevant events. Early testing shows a 40% increase in user engagement and ticket sales.',
      link: '#',
      featured: false
    },
    {
      id: 3,
      title: 'Bilten Partners with Major Music Festivals',
      category: 'Partnerships',
      date: '2024-01-05',
      summary: 'Bilten announces exclusive ticketing partnerships with three major music festivals, expanding its reach in the live entertainment market.',
      content: 'The partnerships include exclusive ticketing rights for Summer Beats Festival, Rock Nation, and Electronic Dreams. These festivals collectively attract over 500,000 attendees annually.',
      link: '#',
      featured: false
    },
    {
      id: 4,
      title: 'Bilten Surpasses 1 Million Active Users',
      category: 'Company News',
      date: '2023-12-20',
      summary: 'Bilten reaches a major milestone with over 1 million active users on its platform, marking significant growth in the event discovery space.',
      content: 'The platform has seen rapid adoption since its launch, with users discovering and attending events across 50+ cities. The milestone reflects the growing demand for streamlined event discovery and ticketing solutions.',
      link: '#',
      featured: false
    },
    {
      id: 5,
      title: 'Bilten Introduces Virtual Event Support',
      category: 'Product Updates',
      date: '2023-12-15',
      summary: 'Bilten expands its platform to support virtual and hybrid events, enabling organizers to reach global audiences.',
      content: 'The new virtual event features include live streaming integration, virtual networking rooms, and digital ticketing for online events. This expansion addresses the growing demand for hybrid event solutions.',
      link: '#',
      featured: false
    },
    {
      id: 6,
      title: 'Bilten Named Top Event Platform by Tech Review',
      category: 'Company News',
      date: '2023-12-10',
      summary: 'Bilten receives recognition as one of the top event discovery platforms in the annual Tech Review Awards.',
      content: 'The platform was recognized for its innovative approach to event discovery, user experience design, and commitment to accessibility. The award highlights Bilten\'s position as a leader in the event technology space.',
      link: '#',
      featured: false
    }
  ];

  const filteredReleases = selectedCategory === 'All' 
    ? pressReleases 
    : pressReleases.filter(release => release.category === selectedCategory);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Animated Background Lines */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Press Room
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Stay updated with the latest news, announcements, and media resources from Bilten. 
                We're revolutionizing the way people discover and attend events.
              </p>
            </div>
          </div>
        </div>

        {/* Company Overview */}
        <div className="py-16 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  About Bilten
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  Bilten is the leading event discovery and ticketing platform that connects people with amazing experiences. 
                  Founded in 2022, we've helped millions of users discover and attend events that matter to them.
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                  Our mission is to make event discovery effortless and accessible to everyone, whether you're looking for 
                  local concerts, professional conferences, or international festivals.
                </p>

                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">1M+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Active Users</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">50+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Cities</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">10K+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Events</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">$25M</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Funding</div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Company Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <BuildingOfficeIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      <span className="text-gray-600 dark:text-gray-300">Founded: 2022</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <UserIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      <span className="text-gray-600 dark:text-gray-300">Employees: 150+</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <GlobeAltIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      <span className="text-gray-600 dark:text-gray-300">Headquarters: San Francisco, CA</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <ChartBarIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      <span className="text-gray-600 dark:text-gray-300">Industry: Event Technology</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Leadership Team
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Sarah Johnson</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">CEO & Co-founder</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Michael Chen</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">CTO & Co-founder</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Emily Rodriguez</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Head of Product</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Press Releases */}
        <div className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Press Releases
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Latest news and announcements from Bilten
              </p>

              {/* Category Filter */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              {filteredReleases.map((release) => (
                <div
                  key={release.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden ${
                    release.featured ? 'ring-2 ring-primary-500' : ''
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-sm font-medium rounded-full">
                            {release.category}
                          </span>
                          {release.featured && (
                            <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm font-medium rounded-full">
                              Featured
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          {release.title}
                        </h3>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            {formatDate(release.date)}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          {release.summary}
                        </p>
                        
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          {release.content}
                        </p>
                        
                        <a
                          href={release.link}
                          className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                        >
                          Read Full Release
                          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredReleases.length === 0 && (
              <div className="text-center py-12">
                <NewspaperIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No press releases found
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  No press releases match the selected category. Check back soon for updates.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Media Kit */}
        <div className="py-16 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Media Kit
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Download logos, images, and other media resources
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                <PhotoIcon className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Company Logos
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  High-resolution logos in various formats and color schemes
                </p>
                <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Download Logos
                </button>
              </div>

              <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                <CameraIcon className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Product Screenshots
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Screenshots of our platform and mobile applications
                </p>
                <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Download Screenshots
                </button>
              </div>

              <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                <VideoCameraIcon className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Brand Videos
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Company overview videos and product demonstrations
                </p>
                <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Download Videos
                </button>
              </div>

              <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                <DocumentIcon className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Fact Sheet
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Key facts, statistics, and company information
                </p>
                <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Download Fact Sheet
                </button>
              </div>

              <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                <UserIcon className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Team Photos
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Professional photos of our leadership team
                </p>
                <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Download Photos
                </button>
              </div>

              <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                <DocumentTextIcon className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Press Kit
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Complete press kit with all resources
                </p>
                <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Download All
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Media Contact
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Get in touch with our press team for interviews, quotes, and media inquiries
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg">
                <EnvelopeIcon className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Press Inquiries
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  For media interviews and press coverage
                </p>
                <a
                  href="mailto:press@bilten.com"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                >
                  press@bilten.com
                </a>
              </div>

              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg">
                <PhoneIcon className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Press Hotline
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  For urgent media inquiries
                </p>
                <a
                  href="tel:+1-555-0124"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                >
                  +1 (555) 012-3457
                </a>
              </div>
            </div>

            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <MegaphoneIcon className="w-5 h-5" />
                <span>Follow us on social media for real-time updates</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Press;
