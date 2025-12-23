export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@dinedesk.com';
export const OTP_OPTIONAL = process.env.OTP_OPTIONAL === 'true' ? true : false;

export const BRANDING = {
  theme: (process.env.BRANDING_THEME || 'green') as 'green' | 'blue' | 'orange',
  darkModeDefault: process.env.DARK_MODE_DEFAULT === 'true' ? true : false,
  collegeLogoUrl: process.env.COLLEGE_LOGO_URL || '',
  bannerImageUrl: process.env.BANNER_IMAGE_URL || '',
};
