'use client';

import * as React from 'react';
import { trpc } from '@/lib/trpc/client';
import { MeetingCard } from './meeting-card';
import { MeetingForm, type MeetingFormData } from './meeting-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Search, Loader2, AlertCircle, Filter } from 'lucide-react';
import type { Meeting } from '@/lib/db/schema';
import { useRouter } from 'next/navigation';

export function MeetingList() {
  const router = useRouter();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [agentFilter, setAgentFilter] = React.useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedMeeting, setSelectedMeeting] = React.useState<Meeting | null>(null);

  const utils = trpc.useUtils();

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch meetings
  const { data, isLoading, error } = trpc.meetings.getMany.useQuery({
    page,
    limit: 12,
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
    agentId: agentFilter !== 'all' ? agentFilter : undefined,
  });

  // Fetch agents for filter
  const { data: agentsData } = trpc.agents.getMany.useQuery({
    page: 1,
    limit: 100,
  });

  // Create mutation
  const createMutation = trpc.meetings.create.useMutation({
    onSuccess: () => {
      utils.meetings.getMany.invalidate();
      setIsCreateDialogOpen(false);
    },
  });

  // Update mutation
  const updateMutation = trpc.meetings.update.useMutation({
    onSuccess: () => {
      utils.meetings.getMany.invalidate();
      setIsEditDialogOpen(false);
      setSelectedMeeting(null);
    },
  });

  // Delete mutation
  const deleteMutation = trpc.meetings.remove.useMutation({
    onSuccess: () => {
      utils.meetings.getMany.invalidate();
      setIsDeleteDialogOpen(false);
      setSelectedMeeting(null);
    },
  });

  const handleCreate = (formData: MeetingFormData) => {
    createMutation.mutate(formData);
  };

  const handleUpdate = (formData: MeetingFormData) => {
    if (!selectedMeeting) return;
    updateMutation.mutate({
      id: selectedMeeting.id,
      name: formData.name,
    });
  };

  const handleDelete = () => {
    if (!selectedMeeting) return;
    deleteMutation.mutate({ id: selectedMeeting.id });
  };

  const handleEdit = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsDeleteDialogOpen(true);
  };

  const handleJoin = (meeting: Meeting) => {
    // Navigate to video call page
    router.push(`/dashboard/meetings/${meeting.id}/call` as any);
  };

  const handleViewDetails = (meeting: Meeting) => {
    // Navigate to meeting details page
    router.push(`/dashboard/meetings/${meeting.id}`);
  };

  // Reset filters
  const handleResetFilters = () => {
    setStatusFilter('all');
    setAgentFilter('all');
    setSearch('');
    setPage(1);
  };

  const hasActiveFilters = statusFilter !== 'all' || agentFilter !== 'all' || search !== '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Meetings</h2>
          <p className="text-muted-foreground">
            Manage your AI agent meetings
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Meeting
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meetings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {/* Agent Filter */}
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {agentsData?.data.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="outline" onClick={handleResetFilters}>
            Clear
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loader" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Failed to load meetings. Please try again.
          </p>
        </div>
      ) : data?.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-sm text-muted-foreground">
            {hasActiveFilters
              ? 'No meetings found matching your filters.'
              : 'No meetings yet. Create your first meeting!'}
          </p>
        </div>
      ) : (
        <>
          {/* Meeting Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.data.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onJoin={handleJoin}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Meeting</DialogTitle>
            <DialogDescription>
              Create a new meeting with one of your AI agents.
            </DialogDescription>
          </DialogHeader>
          <MeetingForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={createMutation.isPending}
          />
          {createMutation.error && (
            <p className="text-sm text-destructive">
              {createMutation.error.message}
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Meeting</DialogTitle>
            <DialogDescription>
              Update your meeting name.
            </DialogDescription>
          </DialogHeader>
          {selectedMeeting && (
            <MeetingForm
              meeting={selectedMeeting}
              onSubmit={handleUpdate}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedMeeting(null);
              }}
              isLoading={updateMutation.isPending}
            />
          )}
          {updateMutation.error && (
            <p className="text-sm text-destructive">
              {updateMutation.error.message}
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Meeting</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedMeeting?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedMeeting(null);
              }}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </Button>
          </div>
          {deleteMutation.error && (
            <p className="text-sm text-destructive">
              {deleteMutation.error.message}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
