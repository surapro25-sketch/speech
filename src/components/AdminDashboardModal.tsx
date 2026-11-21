import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  UserPlus,
  Users,
  Search,
  Ban,
  CheckCircle,
  Trash2,
  RefreshCw,
  User as UserIcon,
  Crown,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';

export const AdminDashboardModal: React.FC = () => {
  const { isAdminModalOpen, setIsAdminModalOpen, user: currentUser, token, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, bannedUsers: 0, adminUsers: 0 });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'banned'>('all');

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [addError, setAddError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!token || !isAdmin) return;
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminModalOpen && isAdmin) {
      fetchUsers();
    }
  }, [isAdminModalOpen, isAdmin]);

  if (!isAdminModalOpen || !isAdmin) return null;

  const handleToggleBan = async (userToToggle: User) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/users/${userToToggle.id}/ban`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(data.message || `User ${userToToggle.username} status updated`);
        fetchUsers();
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleRole = async (targetUser: User) => {
    if (!token) return;
    const targetRole = targetUser.role === 'admin' ? 'user' : 'admin';
    if (!confirm(`Change role of "${targetUser.username}" to ${targetRole.toUpperCase()}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: targetRole }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`User ${targetUser.username} is now ${targetRole}`);
        fetchUsers();
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        alert(data.error || 'Failed to update role');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userToDelete: User) => {
    if (!token) return;
    if (!confirm(`Are you sure you want to permanently delete user "${userToDelete.username}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`User ${userToDelete.username} deleted.`);
        fetchUsers();
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!newUsername.trim() || !newEmail.trim() || !newPassword) {
      setAddError('Username, email, and password are required');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUsername.trim(),
          email: newEmail.trim(),
          name: newName.trim() || newUsername.trim(),
          password: newPassword,
          role: newRole,
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        setIsAddUserOpen(false);
        setNewUsername('');
        setNewEmail('');
        setNewName('');
        setNewPassword('');
        setNewRole('user');
        setActionSuccess(`User ${data.user.username} created successfully!`);
        fetchUsers();
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        setAddError(data.error || 'Failed to add user');
      }
    } catch (err: any) {
      setLoading(false);
      setAddError(err.message || 'Error creating user');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl border-2 border-amber-500/50 bg-[#030720] shadow-[0_0_60px_rgba(245,158,11,0.3)] text-zinc-100 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-900/60 p-5 bg-[#040c2e]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 font-black shadow-lg shadow-amber-500/30">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-wide">
                  Administrator Control Panel
                </h2>
                <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                  Admin: {currentUser?.username}
                </span>
              </div>
              <p className="text-xs text-cyan-300 font-medium">
                Server-enforced role management, account provisioning, and access controls
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddUserOpen(!isAddUserOpen)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-zinc-950 font-bold px-3.5 py-2 text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add New User</span>
            </button>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="p-2 rounded-xl border border-blue-900 bg-[#07153d] text-zinc-300 hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
              title="Refresh users"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsAdminModalOpen(false)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-blue-900/50 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {actionSuccess && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 px-5 py-2 flex items-center gap-2 text-xs text-emerald-300 font-semibold animate-in fade-in">
            <CheckCircle className="h-4 w-4" />
            <span>{actionSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#020516] border-b border-blue-900/40 text-xs">
          <div className="rounded-xl border border-blue-900/50 bg-[#061239] p-3 flex items-center justify-between">
            <div>
              <span className="text-zinc-400 block font-medium">Total Users</span>
              <strong className="text-lg font-mono text-white">{stats.totalUsers}</strong>
            </div>
            <Users className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="rounded-xl border border-blue-900/50 bg-[#061239] p-3 flex items-center justify-between">
            <div>
              <span className="text-zinc-400 block font-medium">Active Accounts</span>
              <strong className="text-lg font-mono text-emerald-400">{stats.activeUsers}</strong>
            </div>
            <CheckCircle className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="rounded-xl border border-blue-900/50 bg-[#061239] p-3 flex items-center justify-between">
            <div>
              <span className="text-zinc-400 block font-medium">Banned Accounts</span>
              <strong className="text-lg font-mono text-rose-400">{stats.bannedUsers}</strong>
            </div>
            <Ban className="h-5 w-5 text-rose-400" />
          </div>
          <div className="rounded-xl border border-blue-900/50 bg-[#061239] p-3 flex items-center justify-between">
            <div>
              <span className="text-zinc-400 block font-medium">Administrators</span>
              <strong className="text-lg font-mono text-amber-300">{stats.adminUsers}</strong>
            </div>
            <Crown className="h-5 w-5 text-amber-400" />
          </div>
        </div>

        {isAddUserOpen && (
          <div className="p-4 sm:p-5 border-b border-amber-500/40 bg-[#061239] animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <UserPlus className="h-4 w-4 text-amber-400" />
                <span>Create &amp; Provision User Account</span>
              </h3>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {addError && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. new_member"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full rounded-xl border border-blue-900 bg-[#02071d] px-3 py-2 text-white placeholder-zinc-600 focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-xl border border-blue-900 bg-[#02071d] px-3 py-2 text-white placeholder-zinc-600 focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Abebe Bekele"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-blue-900 bg-[#02071d] px-3 py-2 text-white placeholder-zinc-600 focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min 5 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-blue-900 bg-[#02071d] px-3 py-2 text-white placeholder-zinc-600 focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-zinc-300 font-semibold mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as 'user' | 'admin')}
                    className="w-full rounded-xl border border-blue-900 bg-[#02071d] px-2.5 py-2 text-white focus:border-cyan-400 focus:outline-none cursor-pointer"
                  >
                    <option value="user">Standard User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 text-xs transition-all cursor-pointer h-[34px] flex items-center justify-center shrink-0"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="p-4 bg-[#030926] border-b border-blue-900/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by username, email, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-blue-900/80 bg-[#050e30] pl-8 pr-3 py-2 text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="rounded-xl border border-blue-900/80 bg-[#050e30] px-3 py-2 text-white focus:outline-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins Only</option>
              <option value="user">Users Only</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="rounded-xl border border-blue-900/80 bg-[#050e30] px-3 py-2 text-white focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="banned">Banned Only</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="overflow-x-auto rounded-2xl border border-blue-900/60 bg-[#020516]">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-blue-900/60 bg-[#040f35] text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Auth Provider</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-950">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-400">
                      No user accounts found matching query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    const isBanned = u.status === 'banned';
                    const isAdminUser = u.role === 'admin';
                    return (
                      <tr key={u.id} className="hover:bg-blue-950/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-blue-900 ring-1 ring-blue-500/30">
                              <img
                                src={u.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.username}`}
                                alt={u.username}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-white">
                                <span>{u.name || u.username}</span>
                                {isSelf && (
                                  <span className="rounded bg-blue-500/20 text-cyan-300 text-[10px] px-1.5 py-0.2 border border-blue-500/30">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-zinc-400 text-[11px] font-mono">
                                @{u.username} • {u.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {isAdminUser ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                              <Crown className="h-3 w-3" />
                              <span>Admin</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[11px] font-medium text-cyan-300">
                              <UserIcon className="h-3 w-3" />
                              <span>User</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {isBanned ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 border border-rose-500/50 px-2.5 py-0.5 text-[11px] font-bold text-rose-300 animate-pulse">
                              <Ban className="h-3 w-3" />
                              <span>Banned</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                              <CheckCircle className="h-3 w-3" />
                              <span>Active</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="capitalize text-zinc-300 font-mono text-[11px]">
                            {u.authProvider}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-400 text-[11px]">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Role Button (Admin only can change other users' role) */}
                            {!isSelf && (
                              <button
                                onClick={() => handleToggleRole(u)}
                                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-all cursor-pointer ${
                                  isAdminUser
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                                    : 'bg-blue-500/10 border-blue-500/30 text-cyan-300 hover:bg-blue-500/20'
                                }`}
                                title={isAdminUser ? 'Demote to standard user' : 'Promote to administrator'}
                              >
                                <Crown className="h-3 w-3" />
                                <span>{isAdminUser ? 'Demote' : 'Make Admin'}</span>
                              </button>
                            )}

                            {/* Ban / Unban Button */}
                            <button
                              onClick={() => handleToggleBan(u)}
                              disabled={isSelf}
                              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-all cursor-pointer ${
                                isSelf
                                  ? 'opacity-30 cursor-not-allowed border-zinc-700 text-zinc-500'
                                  : isBanned
                                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                              }`}
                              title={isBanned ? 'Unban this user' : 'Ban and block this user'}
                            >
                              <Ban className="h-3 w-3" />
                              <span>{isBanned ? 'Unban' : 'Ban'}</span>
                            </button>

                            {/* Delete User */}
                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={isSelf}
                              className={`p-1.5 rounded-lg border transition-all ${
                                isSelf
                                  ? 'opacity-30 cursor-not-allowed border-zinc-800 text-zinc-600'
                                  : 'border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-950/20 cursor-pointer'
                              }`}
                              title="Delete user account"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
