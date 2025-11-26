// src/components/profile/ActiveUsers.tsx
// --------------------------------------------------------------------
// Active Users view for Admin dashboard.
// Displays all users with their activity data (transfer counts, playlist counts, etc.)
// Note: Admin and Curator roles are treated the same.
// --------------------------------------------------------------------
import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  AlertCircle,
  Loader2,
  User,
  Mail,
  Calendar,
  Music,
  Share2,
  Shield,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/context/useAuth";
import { getApiBase } from "@/utils/apiConfig";
import { format } from "date-fns";

const API_BASE = getApiBase();

interface ActiveUser {
  id: number;
  username: string;
  email: string;
  role: string;
  verified: boolean;
  isRestricted: boolean;
  createdAt: string;
  transferCount: number;
  publicPlaylistCount: number;
  lastTransferDate: string | null;
}

interface ActiveUsersResponse {
  users: ActiveUser[];
  total: number;
}

export default function ActiveUsers() {
  const { authFetch } = useAuth();
  const { showToast, Toast } = useToast();
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<ActiveUser | null>(null);

  const fetchActiveUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authFetch(`${API_BASE}/api/admin/users`);
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("Access denied. Admin role required.");
        }
        throw new Error("Failed to load active users");
      }
      const data: ActiveUsersResponse = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      console.error("Failed to fetch active users:", err);
      setError(err.message || "Failed to load active users. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchActiveUsers();
  }, [fetchActiveUsers]);

  const getRoleBadgeVariant = (role: string) => {
    if (role === "ROLE_ADMIN" || role === "ADMIN" || role === "ROLE_CURATOR" || role === "CURATOR") {
      return "default";
    }
    return "secondary";
  };

  const getRoleLabel = (role: string) => {
    // Admin and Curator are treated the same - both are "Admin"
    if (role === "ROLE_ADMIN" || role === "ADMIN" || role === "ROLE_CURATOR" || role === "CURATOR") {
      return "Admin";
    }
    return "User";
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-6 hidden md:block'>
        <div className='flex items-center gap-2 mb-4'>
          <Users className='w-5 h-5 text-gray-600' />
          <h2 className='text-2xl font-bold text-gray-900'>Active Users</h2>
        </div>
        <p className='text-gray-600'>View all users and their activity data.</p>
      </motion.div>

      <Card className='bg-white shadow-lg rounded-2xl overflow-hidden'>
        <CardHeader className='border-b border-gray-100 p-6'>
          <CardTitle className='text-xl font-semibold text-gray-900'>User Management</CardTitle>
        </CardHeader>

        <CardContent className='p-0'>
          {loading ? (
            <div className='flex items-center justify-center p-8'>
              <Loader2 className='w-6 h-6 animate-spin text-purple-600' />
              <span className='ml-2 text-gray-600'>Loading users...</span>
            </div>
          ) : error ? (
            <div className='flex items-center justify-center p-8 text-red-600'>
              <AlertCircle className='w-5 h-5 mr-2' />
              <span>{error}</span>
            </div>
          ) : users.length === 0 ? (
            <div className='flex flex-col items-center justify-center p-8 text-gray-500'>
              <Users className='w-12 h-12 mb-4' />
              <p className='text-lg font-medium'>No users found.</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transfers</TableHead>
                    <TableHead>Public Playlists</TableHead>
                    <TableHead>Last Transfer</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow 
                      key={user.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedUser(user)}
                    >
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.verified ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-yellow-600" />
                          )}
                          <span className="text-sm">{user.verified ? "Verified" : "Unverified"}</span>
                          {user.isRestricted && (
                            <Badge variant="destructive" className="ml-2">Restricted</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Music className="w-3 h-3 text-gray-400" />
                          <span>{user.transferCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Share2 className="w-3 h-3 text-gray-400" />
                          <span>{user.publicPlaylistCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.lastTransferDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">
                              {format(new Date(user.lastTransferDate), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* User Details Modal - Simple display for now */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">User Details</h3>
            <div className="space-y-2">
              <p><strong>Username:</strong> {selectedUser.username}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Role:</strong> {getRoleLabel(selectedUser.role)}</p>
              <p><strong>Verified:</strong> {selectedUser.verified ? "Yes" : "No"}</p>
              <p><strong>Restricted:</strong> {selectedUser.isRestricted ? "Yes" : "No"}</p>
              <p><strong>Total Transfers:</strong> {selectedUser.transferCount}</p>
              <p><strong>Public Playlists:</strong> {selectedUser.publicPlaylistCount}</p>
              <p><strong>Joined:</strong> {format(new Date(selectedUser.createdAt), 'MMM dd, yyyy')}</p>
            </div>
            <Button className="mt-4 w-full" onClick={() => setSelectedUser(null)}>Close</Button>
          </div>
        </div>
      )}

      {Toast}
    </>
  );
}

