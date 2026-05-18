'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  X,
  Globe,
  Lock,
  Eye,
  Download,
  Pencil,
  Trash2,
  Users,
  Search,
} from 'lucide-react';
import {
  useModuleShares,
  useShareModule,
  useUpdateModuleShare,
  useRevokeModuleShare,
} from '@/modules/rbac/hooks/useModuleSharing';
import { useInfiniteUsers } from '@/modules/rbac/hooks/useInfiniteUsers';
import { cn } from '@/lib/utils';
import { UserWithRoles } from '@/modules/rbac/rbac.interface';
import { useAuth } from '@/modules/auth/hooks/useAuth';

// ─── Types ──────────────────────────────────────────────────────────────────

type Permission = 'VIEW' | 'DOWNLOAD' | 'EDIT';

interface SelectedUser {
  id: number;
  username: string;
  email?: string;
  name?: string;
}

interface ShareModuleModalProps {
  children: React.ReactNode;
  itemName?: string;
  moduleId?: number;
  projectId?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PERMISSION_OPTIONS: {
  value: Permission;
  label: string;
  icon: React.ReactNode;
  desc: string;
}[] = [
    { value: 'VIEW', label: 'Xem', icon: <Eye className="h-3.5 w-3.5" />, desc: 'Chỉ xem nội dung' },
    { value: 'DOWNLOAD', label: 'Tải xuống', icon: <Download className="h-3.5 w-3.5" />, desc: 'Xem & tải file' },
    { value: 'EDIT', label: 'Chỉnh sửa', icon: <Pencil className="h-3.5 w-3.5" />, desc: 'Xem, tải & chỉnh sửa' },
  ];

function permissionLabel(p: string) {
  return PERMISSION_OPTIONS.find(o => o.value === p)?.label ?? p;
}

function getInitials(user?: { username?: string | null; name?: string | null }) {
  const s = user?.name || user?.username || '?';
  return s.slice(0, 2).toUpperCase();
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ShareModuleModal({
  children,
  itemName,
  moduleId,
  projectId,
}: ShareModuleModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [permission, setPermission] = useState<Permission>('VIEW');

  const inputRef = useRef<HTMLInputElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Data
  const { data: shares = [], isLoading: sharesLoading } = useModuleShares(
    isOpen && moduleId ? moduleId : undefined
  );
  const shareMutation = useShareModule();
  const updateMutation = useUpdateModuleShare(moduleId);
  const revokeMutation = useRevokeModuleShare(moduleId);

  const { user: me } = useAuth();

  const {
    allUsers,
    hasNextPage,
    isFetchingNextPage,
    isLoading: usersLoading,
    loadMore,
  } = useInfiniteUsers({ search: searchInput, pageSize: 20, enabled: isOpen });

  // Close dropdown on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        dropdownRef.current?.contains(target) ||
        inputAreaRef.current?.contains(target)
      ) return;
      setShowDropdown(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setSelectedUsers([]);
      setSearchInput('');
      setPermission('VIEW');
      setShowDropdown(false);
    }
  }, [isOpen]);

  const activeShares = shares.filter(s => s.status === 'ACTIVE');
  const sharedIds = new Set(activeShares.map(s => s.sharedWithId));
  const selectedIds = new Set(selectedUsers.map(u => u.id));

  const filteredUsers = allUsers.filter(
    (u: UserWithRoles) =>
      !sharedIds.has(u.id) &&
      !selectedIds.has(u.id) &&
      u.id !== Number(me?.id)   // exclude current user
  );

  const handleSelectUser = useCallback((user: UserWithRoles) => {
    setSelectedUsers(prev => [
      ...prev,
      { id: user.id, username: user.username, email: user.email, name: user.name },
    ]);
    setSearchInput('');
    // keep dropdown open so user can keep adding
    inputRef.current?.focus();
  }, []);

  const handleRemoveSelected = (userId: number) =>
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));

  const handleInfiniteScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      if (
        el.scrollHeight - el.scrollTop - el.clientHeight < 60 &&
        hasNextPage &&
        !isFetchingNextPage
      ) loadMore();
    },
    [hasNextPage, isFetchingNextPage, loadMore]
  );

  const handleInvite = async () => {
    if (selectedUsers.length === 0 || !moduleId || !projectId) return;
    try {
      await Promise.all(
        selectedUsers.map(user =>
          shareMutation.mutateAsync({
            moduleId,
            projectId,
            sharedWithId: user.id,
            permission,
          })
        )
      );
      setSelectedUsers([]);
      setSearchInput('');
      setShowDropdown(false);
    } catch {
      // errors handled by mutation's onError toast
    }
  };

  const handlePermissionChange = (shareId: number, newPermission: string) => {
    if (newPermission === 'remove') { revokeMutation.mutate(shareId); return; }
    updateMutation.mutate({ id: shareId, permission: newPermission as Permission });
  };

  const isInviting = shareMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} modal>
      <DialogTrigger asChild>{children}</DialogTrigger>

      {/*
        Modal has a FIXED height (h-[600px]) and uses flex-col so layout
        never shifts when the search dropdown appears or disappears.
        The dropdown is absolutely positioned so it overlays content instead
        of pushing it down.
      */}
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="p-0 gap-0 sm:max-w-[560px] h-[600px] flex flex-col overflow-hidden rounded-2xl border-0 shadow-2xl bg-white dark:bg-slate-950"
      >

        {/* ── Header (fixed) ─────────────────────────────────────────── */}
        <DialogHeader className="px-6 pt-6 pb-5 shrink-0 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950 shrink-0">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="truncate">
              Chia sẻ module{itemName ? `: "${itemName}"` : ''}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* ── Body (flex-1, scrolls internally) ─────────────────────── */}
        <div className="flex flex-col flex-1 min-h-0 px-6 pt-5 pb-0 gap-5">

          {/* ── Invite section (shrink-0 so it never collapses) ─────── */}
          <div className="shrink-0 space-y-3">

            {/* Input area + floating dropdown wrapper */}
            <div className="relative">
              {/* Chip input */}
              <div
                ref={inputAreaRef}
                className={cn(
                  'flex flex-wrap gap-1.5 min-h-[44px] w-full rounded-xl border',
                  'px-3 py-2 cursor-text transition-all duration-150',
                  showDropdown
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-slate-900'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900',
                  'hover:border-slate-300 dark:hover:border-slate-600'
                )}
                onClick={() => { inputRef.current?.focus(); setShowDropdown(true); }}
              >
                {/* Chips */}
                {selectedUsers.map(user => (
                  <span
                    key={user.id}
                    className="inline-flex items-center gap-1 pl-1.5 pr-1 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium shrink-0"
                  >
                    <Avatar className="h-4 w-4 shrink-0">
                      <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.username}`} />
                      <AvatarFallback className="text-[8px]">
                        {(user.username || '?').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-[110px] truncate">{user.name || user.username}</span>
                    <button
                      type="button"
                      onMouseDown={e => { e.preventDefault(); e.stopPropagation(); handleRemoveSelected(user.id); }}
                      className="rounded hover:bg-blue-200 dark:hover:bg-blue-800 p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}

                {/* Text input */}
                <div className="flex items-center gap-1.5 flex-1 min-w-[100px]">
                  <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder={
                      selectedUsers.length === 0
                        ? 'Tìm username hoặc email...'
                        : 'Thêm người...'
                    }
                    value={searchInput}
                    onChange={e => { setSearchInput(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-white"
                  />
                </div>
              </div>

              {/* Floating dropdown — absolute so it doesn't affect layout */}
              {showDropdown && (
                <div
                  ref={dropdownRef}
                  className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
                >
                  <div
                    className="max-h-[200px] overflow-y-auto"
                    onScroll={handleInfiniteScroll}
                  >
                    {usersLoading ? (
                      <div className="flex items-center justify-center py-6 gap-2 text-slate-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Đang tải...</span>
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="py-6 text-center text-sm text-slate-400">
                        {searchInput ? 'Không tìm thấy người dùng.' : 'Tất cả đã được mời.'}
                      </div>
                    ) : (
                      filteredUsers.map((user: UserWithRoles) => (
                        <button
                          key={user.id}
                          type="button"
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                          onMouseDown={e => { e.preventDefault(); handleSelectUser(user); }}
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.username}`} />
                            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-400 to-violet-500 text-white">
                              {getInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {user.name || user.username}
                            </p>
                            {user.email && (
                              <p className="text-xs text-slate-400 truncate">{user.email}</p>
                            )}
                          </div>
                          {selectedIds.has(user.id) && (
                            <Check className="h-4 w-4 text-blue-600 shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                    {isFetchingNextPage && (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Permission + Invite */}
            <div className="flex items-center gap-2">
              <Select value={permission} onValueChange={v => setPermission(v as Permission)}>
                <SelectTrigger className="h-9 flex-1 text-sm border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {PERMISSION_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        <span className="text-slate-500">{opt.icon}</span>
                        <span>{opt.label}</span>
                        <span className="text-xs text-slate-400 hidden sm:inline">— {opt.desc}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                onClick={handleInvite}
                disabled={selectedUsers.length === 0 || isInviting}
                className={cn(
                  'h-9 px-5 rounded-lg font-medium text-sm shrink-0 transition-all duration-150',
                  selectedUsers.length > 0
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200 dark:shadow-blue-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                )}
              >
                {isInviting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Mời
                    {selectedUsers.length > 1 && (
                      <Badge
                        variant="secondary"
                        className="ml-1.5 h-4 px-1.5 text-[10px] bg-blue-500/20 text-blue-100 border-0"
                      >
                        {selectedUsers.length}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* ── Divider ─────────────────────────────────────────────── */}
          <div className="shrink-0 border-t border-slate-100 dark:border-slate-800" />

          {/* ── People with access (flex-1, fills remaining space) ─── */}
          <div className="flex flex-col flex-1 min-h-0 gap-3 pb-5">
            <p className="shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Người có quyền truy cập
              {activeShares.length > 0 && (
                <span className="ml-1.5 normal-case font-normal text-slate-300 dark:text-slate-600">
                  ({activeShares.length})
                </span>
              )}
            </p>

            {/* Scrollable list — expands to fill all remaining space */}
            <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1">
              {sharesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
                </div>
              ) : activeShares.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800/60">
                    <Lock className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Chưa chia sẻ cho ai
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      Mời người dùng ở trên để bắt đầu
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {activeShares.map(share => (
                    <div
                      key={share.id}
                      className="group flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                    >
                      <Avatar className="h-9 w-9 shrink-0 ring-2 ring-white dark:ring-slate-950 shadow-sm">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/notionists/svg?seed=${share.sharedWith?.username}`}
                        />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-violet-400 to-pink-500 text-white font-semibold">
                          {getInitials(share.sharedWith)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate leading-tight">
                          {share.sharedWith?.name || share.sharedWith?.username}
                        </p>
                        {share.sharedWith?.email && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {share.sharedWith.email}
                          </p>
                        )}
                      </div>

                      <Select
                        value={share.permission}
                        onValueChange={v => handlePermissionChange(share.id, v)}
                      >
                        <SelectTrigger
                          className={cn(
                            'h-7 w-auto px-2 gap-1 text-xs border rounded-lg shrink-0',
                            'bg-transparent border-slate-200 dark:border-slate-700',
                            'group-hover:border-slate-300 dark:group-hover:border-slate-600',
                            'focus:ring-0 focus:ring-offset-0 transition-colors'
                          )}
                        >
                          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                            {PERMISSION_OPTIONS.find(o => o.value === share.permission)?.icon}
                            {permissionLabel(share.permission)}
                          </span>
                        </SelectTrigger>
                        <SelectContent align="end" className="rounded-xl min-w-[160px]">
                          {PERMISSION_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <span className="flex items-center gap-2">
                                <span className="text-slate-500">{opt.icon}</span>
                                {opt.label}
                              </span>
                            </SelectItem>
                          ))}
                          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                          <SelectItem
                            value="remove"
                            className="text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/40"
                          >
                            <span className="flex items-center gap-2">
                              <Trash2 className="h-3.5 w-3.5" />
                              Thu hồi quyền
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer (fixed) ─────────────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span>Chỉ người được mời mới có thể truy cập</span>
          </div>
          <Button
            variant="default"
            size="sm"
            className="h-8 px-5 text-sm font-medium rounded-lg shrink-0"
            onClick={() => setIsOpen(false)}
          >
            Xong
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** @deprecated Dùng ShareModuleModal thay thế */
export const ShareModal = ShareModuleModal;
