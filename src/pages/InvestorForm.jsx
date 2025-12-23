import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { NeumorphicCard, NeumorphicButton } from '../components/NeumorphicUI';
import {
  DollarSign,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building,
  TrendingUp,
  Target,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function InvestorForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    investmentAmount: '',
    investmentType: '',
    experience: '',
    expectations: '',
    source: '',
    agreeToTerms: false
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const investmentTypes = [
    'Investing in Traders',
    'Platform Partnership',
    'Venture Investments',
    'Other'
  ];

  const experienceLevels = [
    'Beginner (less than 1 year)',
    'Experienced (1-3 years)',
    'Professional (3-5 years)',
    'Expert (more than 5 years)'
  ];

  const sources = [
    'Recommendation',
    'Social Media',
    'Press/Media',
    'Conferences',
    'Direct Search',
    'Other'
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
      // Валидация
      if (!formData.agreeToTerms) {
        throw new Error('You must agree to the terms of service');
      }

      if (!formData.fullName || !formData.email || !formData.investmentAmount) {
        throw new Error('Please fill in all required fields');
      }

      // Здесь будет отправка данных на сервер
      // await submitInvestorApplication(formData);

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
              Application Submitted!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Thank you for your interest in investing with Alpha Edge.
              Our team will review your application soon and contact you.
            </p>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                We typically respond within 2-3 business days.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to={createPageUrl('')}>
                  <button className="px-6 py-3 bg-[#e0e5ec] rounded-xl shadow-[-4px_-4px_8px_#ffffff,4px_4px_8px_#aeaec040] hover:shadow-[-2px_-2px_4px_#ffffff,2px_2px_4px_#aeaec040] transition-all duration-200 text-gray-700 font-medium">
                    Return to Home
                  </button>
                </Link>
                <Link to={createPageUrl('support')}>
                  <button className="px-6 py-3 bg-[#e0e5ec] rounded-xl shadow-[-4px_-4px_8px_#ffffff,4px_4px_8px_#aeaec040] hover:shadow-[-2px_-2px_4px_#ffffff,2px_2px_4px_#aeaec040] transition-all duration-200 text-gray-700 font-medium">
                    Contact Support
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={createPageUrl('')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Return to Home
          </Link>

          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#e0e5ec] rounded-full shadow-[-4px_-4px_8px_#ffffff,4px_4px_8px_#aeaec040] flex items-center justify-center">
              <DollarSign className="text-green-600" size={32} />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Become an Alpha Edge Investor
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Invest in the world's best traders and gain access to exclusive opportunities.
              Fill out the form below, and our team will contact you.
            </p>
          </div>
        </div>

        {/* Investment Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <NeumorphicCard className="p-6 text-center">
            <TrendingUp className="mx-auto mb-4 text-blue-600" size={32} />
            <h3 className="font-semibold text-gray-800 mb-2">High Potential</h3>
            <p className="text-sm text-gray-600">
              Investments in verified traders with proven profitability
            </p>
          </NeumorphicCard>

          <NeumorphicCard className="p-6 text-center">
            <Target className="mx-auto mb-4 text-green-600" size={32} />
            <h3 className="font-semibold text-gray-800 mb-2">Transparency</h3>
            <p className="text-sm text-gray-600">
              Complete reporting and real-time monitoring of all investments
            </p>
          </NeumorphicCard>

          <NeumorphicCard className="p-6 text-center">
            <Building className="mx-auto mb-4 text-purple-600" size={32} />
            <h3 className="font-semibold text-gray-800 mb-2">Professional Support</h3>
            <p className="text-sm text-gray-600">
              Expert team to help you choose investment strategies
            </p>
          </NeumorphicCard>
        </div>

        {/* Form */}
        <NeumorphicCard className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="md:col-span-2">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User size={20} />
                Personal Information
              </h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company/Organization
                </label>
                <input
                  type="text"
                  className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                  placeholder="Company name"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign size={20} />
                Investment Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Amount *
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                  placeholder="Example: $50,000"
                  value={formData.investmentAmount}
                  onChange={(e) => handleInputChange('investmentAmount', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Type
                </label>
                <select
                  className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                  value={formData.investmentType}
                  onChange={(e) => handleInputChange('investmentType', e.target.value)}
                >
                  <option value="">Select investment type</option>
                  {investmentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Experience
                </label>
                <select
                  className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                >
                  <option value="">Select experience level</option>
                  {experienceLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How did you hear about us?
                </label>
                <select
                  className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                  value={formData.source}
                  onChange={(e) => handleInputChange('source', e.target.value)}
                >
                  <option value="">Select source</option>
                  {sources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>
            </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Expectations and Goals
                </label>
                <textarea
                  rows={4}
                  className="w-full bg-[#e0e5ec] rounded-lg px-4 py-3 border-none outline-none shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff]"
                  placeholder="Tell us about your investment goals, expected returns, investment timeframe, etc."
                  value={formData.expectations}
                  onChange={(e) => handleInputChange('expectations', e.target.value)}
                />
              </div>

            {/* Terms Agreement */}
            <div className="bg-white/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <label htmlFor="agreeToTerms" className="text-sm text-gray-700 cursor-pointer">
                    I agree to the{' '}
                    <Link to={createPageUrl('terms-of-service')} className="text-blue-600 hover:text-blue-800 underline">
                      terms of service
                    </Link>{' '}
                    of the Alpha Edge platform and confirm that the information provided is accurate and complete.
                  </label>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            <div className="flex justify-center pt-4">
              <NeumorphicButton
                type="submit"
                variant="action"
                className="px-8 py-4 text-lg flex items-center justify-center gap-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting application...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Submit Investment Application
                  </>
                )}
              </NeumorphicButton>
            </div>
          </form>
        </NeumorphicCard>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Your data will be processed in accordance with our{' '}
            <Link to={createPageUrl('terms-of-service')} className="text-blue-600 hover:text-blue-800 underline">
              privacy policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
