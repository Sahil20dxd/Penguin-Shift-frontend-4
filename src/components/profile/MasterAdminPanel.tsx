// src/components/profile/MasterAdminPanel.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, UserPlus, Check, X, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/useAuth';
import { useToast } from '@/hooks/useToast';
import { getApiBase } from '@/utils/apiConfig';

const API_BASE = getApiBase();

export default function MasterAdminPanel() {
  const { authFetch } = useAuth();
  const { showToast, Toast } = useToast();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdAdmin, setCreatedAdmin] = useState<{ username: string; email: string } | null>(null);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !email.trim() || !password.trim()) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    if (password.length < 8) {
      showToast('Password must be at least 8 characters', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'warning');
      return;
    }

    setCreating(true);
    try {
      const res = await authFetch(`${API_BASE}/api/master/create-admin`, {
        method: 'POST',
        json: {
          username: username.trim(),
          email: email.trim(),
          password,
        },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setCreatedAdmin({ username: data.username, email: data.email });
        showToast('Admin account created successfully!', 'success');
        // Reset form
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setSuccess(false);
          setCreatedAdmin(null);
        }, 5000);
      } else {
        showToast(data.message || 'Failed to create admin account', 'error');
      }
    } catch (err: any) {
      console.error('Error creating admin:', err);
      showToast('Failed to create admin account. Please try again.', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="bg-white shadow-lg rounded-2xl overflow-hidden border-2 border-purple-200">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6" />
            <CardTitle className="text-2xl font-bold">Master Admin Panel</CardTitle>
          </div>
          <p className="text-purple-100 mt-2 text-sm">
            Create admin credentials for new administrators
          </p>
        </CardHeader>

        <CardContent className="p-6">
          {success && createdAdmin && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3"
            >
              <Check className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-green-800">Admin Account Created!</p>
                <p className="text-sm text-green-700 mt-1">
                  Username: <strong>{createdAdmin.username}</strong>
                </p>
                <p className="text-sm text-green-700">
                  Email: <strong>{createdAdmin.email}</strong>
                </p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div>
              <Label htmlFor="admin-username" className="text-sm font-medium text-gray-700">
                Username
              </Label>
              <Input
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                className="mt-1"
                disabled={creating}
              />
            </div>

            <div>
              <Label htmlFor="admin-email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="mt-1"
                disabled={creating}
              />
            </div>

            <div>
              <Label htmlFor="admin-password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                className="mt-1"
                disabled={creating}
              />
            </div>

            <div>
              <Label htmlFor="admin-confirm-password" className="text-sm font-medium text-gray-700">
                Confirm Password
              </Label>
              <Input
                id="admin-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
                minLength={8}
                className="mt-1"
                disabled={creating}
              />
            </div>

            <Button
              type="submit"
              disabled={creating}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-2"
            >
              {creating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating Admin...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Admin Account
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> Admin accounts are automatically verified and can access the moderation dashboard.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {Toast}
    </motion.div>
  );
}

