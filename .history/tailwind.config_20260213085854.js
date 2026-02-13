const { hover } = require('@testing-library/user-event/dist/hover');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
        colors: {
            primaryGreen: '#6FCF97',
            hoverGreen: '#4CAF84',
            softGreen: '#E6F6EE',
            border: '#E5E7EB',
            backgroundColor: '#F7F9F8',
            textPrimaryColor: '#1F2937',
            textSecondaryColor: '#6B7280',
            footerBackground: '#1F2937',
            footerTextPrimary: '#E5E7EB',
            footerTextSecondary: '#9CA3AF',
            divider: '#374151',
            policyOutline: '#9FD8C4',
            policyBackground: '#ECF7F2',
            policyBodyText: '#374151'
        },
        fontFamily: {
            poppins: ['Poppins', 'sans-serif'],
            logo: ['Pacifico', 'cursive'],
        },
        animations: {
            /* Modal Animations */

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}

.animate-slideUp {
  animation: slideUp 0.3s ease-out;
}
        },
    },
  },
  plugins: [],
}
