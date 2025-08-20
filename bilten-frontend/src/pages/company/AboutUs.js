import React from 'react';
import { Link } from 'react-router-dom';
import { 
  HeartIcon, 
  UsersIcon, 
  GlobeAltIcon, 
  SparklesIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const AboutUs = () => {
  const teamMembers = [
    {
      name: 'Ahmet Yılmaz',
      role: 'CEO & Founder',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      bio: 'Passionate about creating unforgettable experiences and connecting people through events.',
      linkedin: '#',
      twitter: '#'
    },
    {
      name: 'Zeynep Kaya',
      role: 'CTO',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      bio: 'Technology enthusiast focused on building scalable solutions for event management.',
      linkedin: '#',
      twitter: '#'
    },
    {
      name: 'Mehmet Demir',
      role: 'Head of Operations',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      bio: 'Ensuring smooth operations and exceptional customer experiences.',
      linkedin: '#',
      twitter: '#'
    },
    {
      name: 'Elif Özkan',
      role: 'Marketing Director',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      bio: 'Creative marketer dedicated to promoting amazing events and experiences.',
      linkedin: '#',
      twitter: '#'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Events Hosted', icon: SparklesIcon },
    { number: '500K+', label: 'Happy Attendees', icon: HeartIcon },
    { number: '1000+', label: 'Organizers', icon: UsersIcon },
    { number: '50+', label: 'Cities Covered', icon: GlobeAltIcon }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Animated Background Lines */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-20 pb-16 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl title-primary text-white mb-6">
              About <span className="text-blue-400 brand-bilten">Bilten</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              We're passionate about connecting people through extraordinary events. 
              Our platform makes it easy for organizers to create and for attendees to discover amazing experiences.
            </p>
            <div className="flex flex-wrap justify-center gap-8 mt-12">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full mx-auto mb-4 border border-white/20">
                    <stat.icon className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{stat.number}</div>
                  <div className="text-gray-300">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl title-primary text-white mb-6">
                  Our Mission
                </h2>
                <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                  At Bilten, we believe that events have the power to transform lives, 
                  create lasting memories, and build stronger communities. Our mission is 
                  to democratize event creation and discovery, making it accessible to 
                  everyone regardless of their technical expertise or budget.
                </p>
                <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                  We're committed to providing a seamless, secure, and innovative platform 
                  that empowers organizers to focus on what matters most - creating 
                  unforgettable experiences for their audiences.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-300">Innovation in event technology</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-300">Exceptional user experience</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-300">Community building through events</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl title-secondary text-white mb-6">Our Values</h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <HeartIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Passion</h4>
                      <p className="text-gray-300">We're passionate about events and the connections they create.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <SparklesIcon className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Innovation</h4>
                      <p className="text-gray-300">Constantly pushing boundaries to improve the event experience.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <UsersIcon className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Community</h4>
                      <p className="text-gray-300">Building strong relationships with our users and partners.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl title-primary text-white mb-6">
                Meet Our Team
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                The passionate individuals behind Bilten who are dedicated to making 
                your event experience extraordinary.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center hover:bg-white/15 transition-all duration-300">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-white/20">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{member.name}</h3>
                  <p className="text-blue-400 mb-3">{member.role}</p>
                  <p className="text-gray-300 text-sm mb-4">{member.bio}</p>
                  <div className="flex justify-center space-x-3">
                    <a href={member.linkedin} className="text-gray-400 hover:text-blue-400 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"/>
                      </svg>
                    </a>
                    <a href={member.twitter} className="text-gray-400 hover:text-blue-400 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84"/>
                      </svg>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl title-primary text-white mb-6">
                Get in Touch
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Have questions or want to learn more about Bilten? 
                We'd love to hear from you!
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl title-secondary text-white mb-6">Contact Information</h3>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <EnvelopeIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">Email</h4>
                      <p className="text-gray-300">hello@bilten.com</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <PhoneIcon className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">Phone</h4>
                      <p className="text-gray-300">+90 (212) 555-0123</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <MapPinIcon className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">Address</h4>
                      <p className="text-gray-300">
                        Levent Mahallesi, Büyükdere Caddesi<br />
                        No: 123, Şişli, İstanbul, Turkey
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <ClockIcon className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">Business Hours</h4>
                      <p className="text-gray-300">
                        Monday - Friday: 9:00 AM - 6:00 PM<br />
                        Saturday: 10:00 AM - 4:00 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl title-secondary text-white mb-6">Quick Links</h3>
                <div className="space-y-4">
                  <Link to="/contact" className="block p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10">
                    <h4 className="text-lg font-semibold text-white mb-2">Contact Form</h4>
                    <p className="text-gray-300">Send us a message directly through our contact form.</p>
                  </Link>
                  <Link to="/help" className="block p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10">
                    <h4 className="text-lg font-semibold text-white mb-2">Help Center</h4>
                    <p className="text-gray-300">Find answers to common questions and get support.</p>
                  </Link>
                  <Link to="/faq" className="block p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10">
                    <h4 className="text-lg font-semibold text-white mb-2">FAQ</h4>
                    <p className="text-gray-300">Frequently asked questions and user guides.</p>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="relative z-10">
                <h2 className="text-4xl title-primary text-white mb-6">
                  Ready to Create Amazing Events?
                </h2>
                <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
                  Join thousands of organizers who trust Bilten to create 
                  unforgettable experiences for their audiences.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    to="/register" 
                    className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Get Started Today
                  </Link>
                  <Link 
                    to="/events" 
                    className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
                  >
                    Browse Events
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;
