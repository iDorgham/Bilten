import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BriefcaseIcon, 
  MapPinIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  HeartIcon,
  UsersIcon,
  SparklesIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

const Careers = () => {
  const [expandedJob, setExpandedJob] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('All');

  const departments = ['All', 'Engineering', 'Design', 'Marketing', 'Sales', 'Operations', 'Customer Support'];

  const jobListings = [
    {
      id: 1,
      title: 'Senior Frontend Developer',
      department: 'Engineering',
      location: 'Remote / New York, NY',
      type: 'Full-time',
      salary: '$120,000 - $150,000',
      experience: '5+ years',
      description: 'We\'re looking for a Senior Frontend Developer to join our team and help build amazing user experiences for our event platform.',
      requirements: [
        'Strong experience with React, TypeScript, and modern JavaScript',
        'Experience with responsive design and CSS frameworks (Tailwind CSS)',
        'Knowledge of state management (Redux, Context API)',
        'Experience with testing frameworks (Jest, React Testing Library)',
        'Understanding of web accessibility standards',
        'Experience with Git and collaborative development workflows'
      ],
      responsibilities: [
        'Develop and maintain high-quality, responsive user interfaces',
        'Collaborate with designers and backend developers',
        'Write clean, maintainable, and well-documented code',
        'Participate in code reviews and technical discussions',
        'Mentor junior developers and share knowledge'
      ]
    },
    {
      id: 2,
      title: 'UX/UI Designer',
      department: 'Design',
      location: 'San Francisco, CA',
      type: 'Full-time',
      salary: '$90,000 - $120,000',
      experience: '3+ years',
      description: 'Join our design team to create beautiful, intuitive experiences that help people discover and attend amazing events.',
      requirements: [
        'Strong portfolio demonstrating user-centered design',
        'Experience with design tools (Figma, Sketch, Adobe Creative Suite)',
        'Understanding of user research and usability principles',
        'Experience with design systems and component libraries',
        'Knowledge of accessibility guidelines and best practices',
        'Experience working with development teams'
      ],
      responsibilities: [
        'Create user flows, wireframes, and high-fidelity mockups',
        'Conduct user research and usability testing',
        'Collaborate with product managers and developers',
        'Maintain and evolve our design system',
        'Present design solutions to stakeholders'
      ]
    },
    {
      id: 3,
      title: 'Marketing Manager',
      department: 'Marketing',
      location: 'Remote / Los Angeles, CA',
      type: 'Full-time',
      salary: '$80,000 - $110,000',
      experience: '4+ years',
      description: 'Help us grow our platform by developing and executing marketing strategies that connect event organizers with attendees.',
      requirements: [
        'Experience in digital marketing and growth strategies',
        'Knowledge of marketing automation tools and analytics',
        'Experience with social media marketing and content creation',
        'Understanding of SEO and SEM principles',
        'Experience with email marketing campaigns',
        'Strong analytical and reporting skills'
      ],
      responsibilities: [
        'Develop and execute marketing campaigns across multiple channels',
        'Manage social media presence and content strategy',
        'Analyze marketing performance and optimize campaigns',
        'Collaborate with sales and product teams',
        'Manage marketing budget and ROI tracking'
      ]
    },
    {
      id: 4,
      title: 'Customer Success Specialist',
      department: 'Customer Support',
      location: 'Remote',
      type: 'Full-time',
      salary: '$50,000 - $70,000',
      experience: '2+ years',
      description: 'Help our customers succeed by providing exceptional support and guidance for our event platform.',
      requirements: [
        'Excellent communication and problem-solving skills',
        'Experience with customer support tools and CRM systems',
        'Ability to handle multiple customer inquiries simultaneously',
        'Knowledge of event management or ticketing platforms',
        'Experience with technical troubleshooting',
        'Strong empathy and patience with customers'
      ],
      responsibilities: [
        'Provide timely and helpful support to customers',
        'Troubleshoot technical issues and escalate when needed',
        'Create and maintain support documentation',
        'Gather customer feedback and insights',
        'Collaborate with product team on feature improvements'
      ]
    }
  ];

  const filteredJobs = selectedDepartment === 'All' 
    ? jobListings 
    : jobListings.filter(job => job.department === selectedDepartment);

  const toggleJob = (jobId) => {
    setExpandedJob(expandedJob === jobId ? null : jobId);
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
                Join Our Team
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Help us revolutionize the way people discover, attend, and create amazing events. 
                We're building the future of event experiences.
              </p>
            </div>
          </div>
        </div>

        {/* Company Culture Section */}
        <div className="py-16 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Why Work With Us
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                We're passionate about creating meaningful connections through events
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <HeartIcon className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Mission-Driven
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  We're on a mission to bring people together through amazing events and experiences.
                </p>
              </div>

              <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <UsersIcon className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Collaborative Culture
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Work with talented, passionate people who support and inspire each other.
                </p>
              </div>

              <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <SparklesIcon className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Innovation First
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  We encourage creativity and experimentation to solve real-world problems.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Benefits & Perks
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                We take care of our team with comprehensive benefits and perks
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <AcademicCapIcon className="w-10 h-10 text-primary-600 dark:text-primary-400 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Learning & Development</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Continuous learning opportunities and professional development</p>
              </div>

              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <GlobeAltIcon className="w-10 h-10 text-primary-600 dark:text-primary-400 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Remote Work</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Flexible remote work options and work-life balance</p>
              </div>

              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <HeartIcon className="w-10 h-10 text-primary-600 dark:text-primary-400 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Health & Wellness</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Comprehensive health insurance and wellness programs</p>
              </div>

              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <CurrencyDollarIcon className="w-10 h-10 text-primary-600 dark:text-primary-400 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Competitive Pay</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Competitive salaries and equity participation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Job Listings Section */}
        <div className="py-16 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Open Positions
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Find the perfect role for your skills and career goals
              </p>

              {/* Department Filter */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {departments.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDepartment(dept)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedDepartment === dept
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden"
                >
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => toggleJob(job.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {job.title}
                          </h3>
                          <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-sm font-medium rounded-full">
                            {job.department}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-1">
                            <MapPinIcon className="w-4 h-4" />
                            {job.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            {job.type}
                          </div>
                          <div className="flex items-center gap-1">
                            <CurrencyDollarIcon className="w-4 h-4" />
                            {job.salary}
                          </div>
                          <div className="flex items-center gap-1">
                            <BriefcaseIcon className="w-4 h-4" />
                            {job.experience}
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        {expandedJob === job.id ? (
                          <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedJob === job.id && (
                    <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-600">
                      <div className="pt-6">
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                          {job.description}
                        </p>

                        <div className="grid md:grid-cols-2 gap-8">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                              Requirements
                            </h4>
                            <ul className="space-y-2">
                              {job.requirements.map((req, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                  <span className="w-1.5 h-1.5 bg-primary-600 dark:bg-primary-400 rounded-full mt-2 flex-shrink-0"></span>
                                  {req}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                              Responsibilities
                            </h4>
                            <ul className="space-y-2">
                              {job.responsibilities.map((resp, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                  <span className="w-1.5 h-1.5 bg-primary-600 dark:bg-primary-400 rounded-full mt-2 flex-shrink-0"></span>
                                  {resp}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                          <button className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                            Apply for this position
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredJobs.length === 0 && (
              <div className="text-center py-12">
                <BriefcaseIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No positions available
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  We don't have any open positions in this department right now. 
                  Check back later or contact us to learn about future opportunities.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Section */}
        <div className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Get in Touch
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Don't see the perfect role? We'd love to hear from you anyway
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg">
                <EnvelopeIcon className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Email Us
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Send us your resume and a cover letter
                </p>
                <a
                  href="mailto:careers@bilten.com"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                >
                  careers@bilten.com
                </a>
              </div>

              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg">
                <PhoneIcon className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Call Us
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Speak directly with our HR team
                </p>
                <a
                  href="tel:+1-555-0123"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                >
                  +1 (555) 012-3456
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Careers;
