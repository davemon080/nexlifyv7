import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getAppSettings } from '../services/mockData';
import { AppSettings, PageSeoConfig } from '../types';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: string;
}

export const SEO: React.FC<SEOProps> = ({ 
  title: propTitle, 
  description: propDescription, 
  keywords: propKeywords, 
  image: propImage, 
  type = 'website' 
}) => {
  const location = useLocation();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  // Try to load dynamic SEO settings from DB
  useEffect(() => {
    const data = getAppSettings();
    setSettings(data);
  }, [location.pathname]);

  // Determine active config based on priority:
  // 1. Database setting for this specific path
  // 2. Props passed to component
  // 3. Default DB settings
  // 4. Fallback strings
  
  const dbConfig: PageSeoConfig | undefined = settings?.seoDefinitions?.[location.pathname];
  const defaults: PageSeoConfig | undefined = settings?.defaultSeo;

  const siteName = settings?.platformName || 'Nexlify';
  
  const title = dbConfig?.title || propTitle || defaults?.title || 'Nexlify - Digital Platform';
  const description = dbConfig?.description || propDescription || defaults?.description || 'A complete digital ecosystem for skills, services, and assets.';
  const keywords = dbConfig?.keywords || propKeywords || defaults?.keywords || 'digital, skills, marketplace, earning, ai';
  const image = dbConfig?.ogImage || propImage || defaults?.ogImage || settings?.logoUrl || '';

  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;

  // React 19 Native Metadata: Just render tags, React hoists them to <head> automatically.
  return (
    <>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={window.location.href} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={image} />}
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
      
      {/* Robots */}
      <meta name="robots" content="index, follow" />
    </>
  );
};