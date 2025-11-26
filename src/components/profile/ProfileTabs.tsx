import React from 'react';
import { History, Share2, Settings, Shield, Users, Globe, Flag } from 'lucide-react';
import { useAuth } from '@/context/useAuth';
import { motion } from 'framer-motion';

interface ProfileTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobile?: boolean;
}

export default function ProfileTabs({ activeTab, setActiveTab, isMobile = false }: ProfileTabsProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'CURATOR' || user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_CURATOR';
  
  // Regular users see: History, Sharing, Settings
  // Admins see: Settings, All Playlists, Moderation Dashboard, Active Users
  // Note: Admin and Curator roles are treated the same
  // Note: Flagged Playlists removed - Moderation dashboard shows all playlists
  const tabs = isAdmin
    ? [
        { id: 'settings', label: 'Account Settings', icon: Settings },
        { id: 'all-playlists', label: 'All Playlists', icon: Globe },
        { id: 'admin', label: 'Moderation', icon: Shield },
        { id: 'users', label: 'Active Users', icon: Users },
      ]
    : [
        { id: 'history', label: 'My History', icon: History },
        { id: 'sharing', label: 'My Sharing', icon: Share2 },
        { id: 'settings', label: 'Account Settings', icon: Settings },
      ];

  if (isMobile) {
    return (
      <div className='flex flex-col gap-2'>
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive
                  ? 'text-purple-600'
                  : 'text-gray-600'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeMobileTabIndicator"
                  className="absolute inset-0 bg-purple-100 rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <tab.icon className='w-5 h-5' />
              </motion.div>
              <span>{tab.label}</span>
            </motion.button>
          );
        })}
      </div>
    );
  }

  return (
    <div className='mb-8'>
      <div className='flex gap-2 border-b border-gray-200 pb-2'>
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-6 py-3 rounded-t-lg font-medium transition-all duration-200 ${
                isActive
                  ? 'text-purple-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-white rounded-t-lg border-b-2 border-purple-600 -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <tab.icon className='w-4 h-4' />
              </motion.div>
              <span>{tab.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
