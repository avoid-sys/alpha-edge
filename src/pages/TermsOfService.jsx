import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { NeumorphicCard } from '../components/NeumorphicUI';
import {
  Shield,
  FileText,
  ArrowLeft,
  Users,
  TrendingUp,
  Lock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function TermsOfService() {
  const sections = [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      icon: <CheckCircle className="text-green-600" size={24} />,
      content: [
        'By using the Alpha Edge platform, you agree to comply with and be bound by these Terms of Service.',
        'If you do not agree to any provision of these terms, please do not use our platform.',
        'We reserve the right to modify these terms at any time. Continued use of the platform after changes means your acceptance of the new terms.'
      ]
    },
    {
      id: 'eligibility',
      title: '2. Eligibility Criteria',
      icon: <Users className="text-blue-600" size={24} />,
      content: [
        'The platform is intended exclusively for qualified traders over 18 years old.',
        'Users must have experience trading financial instruments and understand the associated risks.',
        'Alpha Edge reserves the right to refuse registration or suspend access to any user at its discretion.',
        'All users must provide accurate and up-to-date information during registration.'
      ]
    },
    {
      id: 'platform-use',
      title: '3. Platform Usage',
      icon: <TrendingUp className="text-purple-600" size={24} />,
      content: [
        'The platform provides tools for tracking and analyzing trading activity.',
        'Users can connect their trading accounts through secure API integrations.',
        'All trading data must be obtained legally and belong to the user.',
        'Use of the platform for fraudulent purposes or market manipulation is prohibited.',
        'Users are responsible for the confidentiality of their credentials.'
      ]
    },
    {
      id: 'data-privacy',
      title: '4. Data Privacy',
      icon: <Lock className="text-orange-600" size={24} />,
      content: [
        'We collect only necessary information to provide platform services.',
        'User trading data is stored encrypted and protected by modern security technologies.',
        'We do not share personal information with third parties without explicit user consent.',
        'Users have the right to access, correct, and delete their data.',
        'We use analytics to improve the platform but do not disclose individual trading strategies.'
      ]
    },
    {
      id: 'risk-disclaimer',
      title: '5. Risk Disclaimer',
      icon: <AlertTriangle className="text-red-600" size={24} />,
      content: [
        'Trading financial instruments involves substantial risks of financial loss.',
        'Past results do not guarantee future returns.',
        'Alpha Edge does not provide investment advice and does not recommend specific trading strategies.',
        'Users make trading decisions independently and bear full responsibility for the results.',
        'The platform is not responsible for financial losses incurred by users.'
      ]
    },
    {
      id: 'prohibited-activities',
      title: '6. Prohibited Activities',
      icon: <XCircle className="text-red-500" size={24} />,
      content: [
        'Using the platform for illegal activities is prohibited.',
        'Providing false information about trading results is unacceptable.',
        'Manipulating ratings or results of other users is forbidden.',
        'Using automated scripts without permission is not allowed.',
        'Sharing credentials with other persons is prohibited.'
      ]
    },
    {
      id: 'termination',
      title: '7. Termination of Use',
      icon: <FileText className="text-gray-600" size={24} />,
      content: [
        'Alpha Edge reserves the right to suspend or terminate user access to the platform.',
        'Reasons may include violation of terms, fraud suspicion, or other substantial reasons.',
        'Upon termination, all user data may be deleted.',
        'Users may stop using the platform at any time.',
        'Some obligations remain in effect after termination of use.'
      ]
    },
    {
      id: 'liability',
      title: '8. Limitation of Liability',
      icon: <Shield className="text-indigo-600" size={24} />,
      content: [
        'The platform is provided "as is" without any warranties.',
        'Alpha Edge is not responsible for technical failures or data loss.',
        'Maximum liability is limited to the amount paid for platform usage.',
        'We are not responsible for indirect or consequential damages.',
        'Users agree to defend and indemnify Alpha Edge from any claims.'
      ]
    }
  ];

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
              <Shield className="text-blue-600" size={32} />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Alpha Edge Terms of Service
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Rules and regulations for using the trading platform.
              Please carefully review these terms before using our service.
            </p>
          </div>
        </div>

        {/* Terms Content */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <NeumorphicCard key={section.id} className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {section.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    {section.title}
                  </h2>
                  <ul className="space-y-3">
                    {section.content.map((paragraph, pIndex) => (
                      <li key={pIndex} className="text-gray-600 leading-relaxed flex items-start gap-2">
                        <span className="text-blue-500 mt-1.5 flex-shrink-0">•</span>
                        <span>{paragraph}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </NeumorphicCard>
          ))}
        </div>

        {/* Contact Information */}
        <NeumorphicCard className="p-6 mt-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Have Questions?
            </h3>
            <p className="text-gray-600 mb-6">
              If you have questions regarding these terms of service,
              please contact our support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl('support')}>
                <button className="px-6 py-3 bg-[#e0e5ec] rounded-xl shadow-[-4px_-4px_8px_#ffffff,4px_4px_8px_#aeaec040] hover:shadow-[-2px_-2px_4px_#ffffff,2px_2px_4px_#aeaec040] transition-all duration-200 text-gray-700 font-medium flex items-center justify-center gap-2">
                  Contact Support
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
          <p>Last updated: {new Date().toLocaleDateString('en-US')}</p>
          <p className="mt-2">
            © 2024 Alpha Edge. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
