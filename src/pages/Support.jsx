import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { NeumorphicCard, NeumorphicButton } from '../components/NeumorphicUI';
import {
  HelpCircle,
  ArrowLeft,
  Mail,
  MessageSquare,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Users,
  Book,
  DollarSign,
  Settings
} from 'lucide-react';

export default function Support() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    subject: '',
    message: '',
    priority: 'normal'
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const categories = [
    { value: 'technical', label: 'Technical Support', icon: <Settings size={20} /> },
    { value: 'account', label: 'Account Issues', icon: <Users size={20} /> },
    { value: 'trading', label: 'Trading Questions', icon: <Book size={20} /> },
    { value: 'investment', label: 'Investment Questions', icon: <DollarSign size={20} /> },
    { value: 'billing', label: 'Billing & Payments', icon: <DollarSign size={20} /> },
    { value: 'other', label: 'Other', icon: <HelpCircle size={20} /> }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-blue-600' },
    { value: 'normal', label: 'Normal', color: 'text-gray-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
  ];

  const faqItems = [
    {
      question: 'How do I connect my trading account?',
      answer: 'Go to the "Connect Platforms" section in your dashboard. Select your broker and follow the API integration instructions.'
    },
    {
      question: 'How is the leaderboard ranking calculated?',
      answer: 'Ranking is calculated based on profitability, maximum drawdown, number of trades, and other metrics over the last 6 months.'
    },
    {
      question: 'Can I invest in traders?',
      answer: 'Yes, qualified investors can invest in top platform traders. Fill out the investor form for more information.'
    },
    {
      question: 'How do I link multiple accounts?',
      answer: 'In the platform connection section, you can add multiple accounts. Each account will be tracked separately in your profile.'
    }
  ];

  const contactMethods = [
    {
      icon: <Mail size={24} />,
      title: 'Email Support',
      description: 'Email us at support@alphaedge.com',
      responseTime: 'Response within 24 hours',
      available: '24/7'
    },
    {
      icon: <MessageSquare size={24} />,
      title: 'Live Chat',
      description: 'In-app live chat support',
      responseTime: 'Response within 1 hour',
      available: 'Mon-Fri 9:00-18:00 UTC'
    },
    {
      icon: <Phone size={24} />,
      title: 'Phone Support',
      description: '+1 (555) 123-4567',
      responseTime: 'Response within 30 minutes',
      available: 'Mon-Fri 10:00-17:00 UTC'
    }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.name || !formData.email || !formData.category || !formData.message) {
        throw new Error('Please fill in all required fields');
      }

      // Здесь будет отправка данных на сервер
      // await submitSupportRequest(formData);

      // Имитация задержки
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#e0e5ec] py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <NeumorphicCard className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-600" size={40} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Ticket Submitted!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Thank you for contacting Alpha Edge support.
              We will review your message and respond as soon as possible.
            </p>
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Ticket Number:</strong> SUP-{Date.now().toString().slice(-6)}
                </p>
                <p className="text-sm text-blue-800 mt-2">
                  Save this number to track the status of your ticket.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to={createPageUrl('dashboard')}>
                  <button className="px-6 py-3 bg-[#e0e5ec] rounded-xl shadow-[-4px_-4px_8px_#ffffff,4px_4px_8px_#aeaec040] hover:shadow-[-2px_-2px_4px_#ffffff,2px_2px_4px_#aeaec040] transition-all duration-200 text-gray-700 font-medium">
                    Return to Dashboard
                  </button>
                </Link>
                <Link to={createPageUrl('')}>
                  <button className="px-6 py-3 bg-[#e0e5ec] rounded-xl shadow-[-4px_-4px_8px_#ffffff,4px_4px_8px_#aeaec040] hover:shadow-[-2px_-2px_4px_#ffffff,2px_2px_4px_#aeaec040] transition-all duration-200 text-gray-700 font-medium">
                    Go to Home
                  </button>
                </Link>
              </div>
            </div>
          </NeumorphicCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e0e5ec] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={createPageUrl('dashboard')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Return to Dashboard
          </Link>

          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#e0e5ec] rounded-full shadow-[-4px_-4px_8px_#ffffff,4px_4px_8px_#aeaec040] flex items-center justify-center">
              <HelpCircle className="text-blue-600" size={32} />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Support Center
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're here to help you. Choose a convenient way to contact us or fill out the form below.
            </p>
          </div>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {contactMethods.map((method, index) => (
            <NeumorphicCard key={index} className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-[#e0e5ec] rounded-full shadow-[-3px_-3px_6px_#ffffff,3px_3px_6px_#aeaec040] flex items-center justify-center">
                {method.icon}
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{method.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{method.description}</p>
              <p className="text-xs text-gray-500 mb-1">{method.responseTime}</p>
              <p className="text-xs text-gray-500">{method.available}</p>
            </NeumorphicCard>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* FAQ Section */}
          <div>
            <NeumorphicCard className="p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Book size={24} />
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {faqItems.map((item, index) => (
                  <details key={index} className="group">
                    <summary className="cursor-pointer font-medium text-gray-800 hover:text-blue-600 transition-colors flex items-center gap-2">
                      <span className="text-blue-500">•</span>
                      {item.question}
                    </summary>
                    <p className="mt-2 text-gray-600 text-sm pl-4 border-l-2 border-blue-200">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </NeumorphicCard>
          </div>

          {/* Support Form */}
          <div>
            <NeumorphicCard className="p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <MessageSquare size={24} />
                Create Support Ticket
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                  </div>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  required
                  className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                  placeholder="Briefly describe the issue"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  rows={6}
                  required
                  className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                  placeholder="Describe your problem or question in detail..."
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
                    <span className="text-red-700">{error}</span>
                  </div>
                )}

                <NeumorphicButton
                  type="submit"
                  variant="action"
                  className="w-full flex items-center justify-center gap-3"
                  disabled={loading}
                >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Submit Ticket
                  </>
                )}
                </NeumorphicButton>
              </form>
            </NeumorphicCard>
          </div>
        </div>

        {/* Additional Links */}
        <NeumorphicCard className="p-6 mt-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Additional Resources
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <Link to={createPageUrl('terms-of-service')}>
                                          <button className="px-6 py-3 bg-[#e0e5ec] rounded-xl shadow-[-4px_-4px_8px_#ffffff,4px_4px_8px_#aeaec040] hover:shadow-[-2px_-2px_4px_#ffffff,2px_2px_4px_#aeaec040] transition-all duration-200 text-gray-700 font-medium flex items-center justify-center gap-2">
                                            Terms of Service
                                          </button>
                                        </Link>
                                        <Link to={createPageUrl('investor-form')}>
                                          <button className="px-6 py-3 bg-[#e0e5ec] rounded-xl shadow-[-4px_-4px_8px_#ffffff,4px_4px_8px_#aeaec040] hover:shadow-[-2px_-2px_4px_#ffffff,2px_2px_4px_#aeaec040] transition-all duration-200 text-gray-700 font-medium flex items-center justify-center gap-2">
                                            Become an Investor
                                          </button>
                                        </Link>
            </div>
          </div>
        </NeumorphicCard>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 Alpha Edge. Все права защищены.</p>
        </div>
      </div>
    </div>
  );
}
