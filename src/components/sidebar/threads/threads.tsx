import {
  ChevronDown,
  Edit,
  Filter,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Star,
  Trash2,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';

import { useWorkspaceThreads } from '@/hooks/use-workspace-threads';
import { Virtuoso } from 'react-virtuoso';
import { renameThread } from '../../../apis/message-threads';
import { useSmartSpace } from '../../../contexts/smartspace-context';
import { SortOrder } from '../../../enums/threads-sort-order';
import { MessageThread } from '../../../models/message-threads';
import { getAvatarColour } from '../../../utils/avatar-colour';
import { getInitials } from '../../../utils/initials';
import { ThreadRenameModal } from './thread-rename-modal/thread-rename-modal';

export function Threads() {
  const { sortOrder, setSortOrder } = useSmartSpace();
  
  const {
    threads,
    isLoading,
    updateThreadMetadata,
    handleDeleteThread,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useWorkspaceThreads();

  const [hoveredThreadId, setHoveredThreadId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { workspaceId: urlWorkspaceId, threadId } = useParams();

  const handleThreadClick = (thread: MessageThread) => {
    navigate(
      `/workspace/${urlWorkspaceId}/thread/${thread.id}`,
    );
  };

  const [autoCreatedThreadId, setAutoCreatedThreadId] = useState<string | null>(null);

  const handleNewThread = () => {
    const newThreadId = crypto.randomUUID();

    // might need to set isNew search param
    navigate(
      `/workspace/${urlWorkspaceId}/thread/${newThreadId}`,
    );
  }

  useEffect(() => {
    if (!threadId && threads === undefined) {
      const newThreadId = crypto.randomUUID();
      setAutoCreatedThreadId(newThreadId);
      
      // might need to set isNew search param
      navigate(
        `/workspace/${urlWorkspaceId}/thread/${newThreadId}`,
      );
      return;
    }

    if (threads && threads.length > 0 && (!threadId || threadId === autoCreatedThreadId)) {
      const firstThread = threads[0];
      navigate(`/workspace/${urlWorkspaceId}/thread/${firstThread.id}`);
      return;
    }
  }, [
    threads,
    isLoading,
    threadId,
    urlWorkspaceId,
  ]);

  return (
    <>
      <SidebarContent className="px-0 py-0 overflow-auto h-full">
        <div className="sticky top-0 z-10 border-t border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              Threads
            </h2>
            <ThreadsFilter
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
            />
          </div>
        </div>

        <SidebarContent className="p-0">
          {isLoading ? (
            <ThreadsLoadingSkeleton />
          ) : threads?.length ?? 0 > 0 ? (
            <Virtuoso
              data={threads}
              overscan={200}
              endReached={() => {
                if (hasNextPage && !isFetchingNextPage) {
                  fetchNextPage();
                }
              }}
              itemContent={(index, thread) => (
                <div className="px-3 pb-1">
                  <ThreadItem
                    key={thread.id}
                    thread={thread}
                    isActive={threadId === thread.id}
                    hoveredThreadId={hoveredThreadId}
                    openMenuId={openMenuId}
                    onThreadClick={handleThreadClick}
                    onHover={setHoveredThreadId}
                    onMenuOpenChange={setOpenMenuId}
                    updateThreadMetadata={updateThreadMetadata}
                    handleDeleteThread={handleDeleteThread}
                  />
                </div>
              )}
              className="pt-2"
              style={{ height: '100%', width: '100%' }}
              components={{
                Footer: () =>
                  isFetchingNextPage ? (
                    <div className="p-4 text-xs text-gray-500">Loading more...</div>
                  ) : null,
              }}
            />
          ) : (
            <EmptyThreadsState />
          )}
        </SidebarContent>
      </SidebarContent>
      <SidebarFooter className="border-t p-4 mt-auto sticky bottom-0 ">
        <Button onClick={handleNewThread} className="w-full gap-2 text-xs h-9">
          <Plus className="h-3.5 w-3.5" />
          New Thread
        </Button>
      </SidebarFooter>
    </>
  );
}

type ThreadsFilterProps = {
  sortOrder: SortOrder;
  onSortOrderChange: (value: SortOrder) => void;
};

function ThreadsFilter({ sortOrder, onSortOrderChange }: ThreadsFilterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-md text-xs"
        >
          <Filter className="h-3.5 w-3.5 mr-1" />
          Filter
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 rounded-lg p-1 shadow-lg border-gray-100"
      >
        <DropdownMenuRadioGroup
          value={sortOrder}
          onValueChange={(value) => onSortOrderChange(value as SortOrder)}
        >
          <DropdownMenuRadioItem
            value={SortOrder.NEWEST}
            className="text-xs cursor-pointer"
          >
            Newest first
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value={SortOrder.OLDEST}
            className="text-xs cursor-pointer"
          >
            Oldest first
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value={SortOrder.MOST_REPLIES}
            className="text-xs cursor-pointer"
          >
            Most replies
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThreadsLoadingSkeleton() {
  return (
    <>
      {Array(5)
        .fill(0)
        .map((_, index) => (
          <div key={index} className="p-2.5">
            <div className="flex items-start gap-2.5">
              <Skeleton className="h-8 w-8 rounded-md flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
    </>
  );
}

function EmptyThreadsState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center h-full">
      <div className="rounded-full bg-gray-100 p-3 mb-3">
        <MessageSquare className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-1">
        No threads found
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Create a new thread to get started
      </p>
    </div>
  );
}

type ThreadItemProps = {
  thread: MessageThread;
  isActive: boolean;
  hoveredThreadId: string | null;
  openMenuId: string | null;
  onThreadClick: (thread: MessageThread) => void;
  onHover: (id: string | null) => void;
  onMenuOpenChange: (id: string | null) => void;
  updateThreadMetadata: (
    threadId: string,
    updates: Partial<MessageThread>
  ) => void;
  handleDeleteThread: (threadId: string) => void;
};

function ThreadItem({
  thread,
  isActive,
  hoveredThreadId,
  openMenuId,
  onThreadClick,
  onHover,
  onMenuOpenChange,
  updateThreadMetadata,
  handleDeleteThread,
}: ThreadItemProps) {
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [newThreadName, setNewThreadName] = useState(thread.name);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (
      e.target instanceof Element &&
      (e.target.closest('button') || e.target.closest('[role="menuitem"]'))
    ) {
      return;
    }
    onThreadClick(thread);
  };

  const handleRenameSubmit = async () => {
    if (newThreadName.trim()) {
      try {
        onMenuOpenChange(null);
        await renameThread(thread, newThreadName);
        updateThreadMetadata(thread.id, { name: newThreadName });
        setIsRenameModalOpen(false);
        toast.success('Thread renamed successfully');
      } catch (error) {
        console.error('Error renaming thread:', error);
        toast.error('Failed to rename thread. Please try again.');
      }
    }
  };

  const handleDeleteThreadItem = async () => {
    try {
      onMenuOpenChange(null);
      handleDeleteThread(thread.id);
      setIsDeleteDialogOpen(false);
      toast.success('Thread deleted successfully');
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast.error('Failed to delete thread. Please try again.');
    }
  };

  return (
    <div
      id={`thread-${thread.id}`}
      className={`group relative flex items-start gap-2.5 p-2.5 hover:bg-accent cursor-pointer transition-all rounded-lg ${
        isActive ? 'bg-accent shadow-sm' : ''
      }`}
      onClick={handleClick}
      onMouseEnter={() => onHover(thread.id)}
      onMouseLeave={() => {
        if (hoveredThreadId === thread.id && openMenuId !== thread.id) {
          onHover(null);
        }
      }}
    >
      <Avatar
        className={`h-8 w-8 flex-shrink-0 shadow-sm ${getAvatarColour(
          thread.name
        )}`}
      >
        <AvatarFallback className="text-xs font-medium">
          {getInitials(thread.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h3 className="text-xs font-medium truncate">{thread.name}</h3>
        <p className="text-[11px] mt-0.5">
          {thread.totalMessages}{' '}
          {thread.totalMessages === 1 ? 'message' : 'messages'} ·{' '}
          {thread.lastUpdated}
        </p>
      </div>

      <ThreadItemMenu
        thread={thread}
        isActive={isActive}
        isHovered={hoveredThreadId === thread.id}
        isMenuOpen={openMenuId === thread.id}
        onMenuOpenChange={(open) => onMenuOpenChange(open ? thread.id : null)}
        onRename={() => setIsRenameModalOpen(true)}
        onDelete={() => setIsDeleteDialogOpen(true)}
      />

      <ThreadRenameModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        threadName={newThreadName}
        setThreadName={setNewThreadName}
        onSubmit={handleRenameSubmit}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Thread</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{thread.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-5">
            <AlertDialogCancel className="text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteThreadItem}
              className="bg-red-500 hover:bg-red-600 text-white text-sm"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type ThreadItemMenuProps = {
  thread: MessageThread;
  isActive: boolean;
  isHovered: boolean;
  isMenuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onRename: () => void;
  onDelete: () => void;
};

function ThreadItemMenu({
  thread,
  isActive,
  isHovered,
  isMenuOpen,
  onMenuOpenChange,
  onRename,
  onDelete,
}: ThreadItemMenuProps) {
  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={onMenuOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-5 w-5 absolute right-1.5 top-1.5 p-0 transition-opacity rounded-full ${
            isHovered || isMenuOpen ? 'opacity-100' : 'opacity-0'
          } ${
            isActive
              ? 'text-slate-700 hover:bg-slate-300'
              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-3 w-3" />
          <span className="sr-only">More options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 rounded-lg p-1 shadow-lg border-gray-100"
      >
        <DropdownMenuItem className="text-xs py-1.5 px-2 rounded-md">
          <Star className="mr-2 h-3.5 w-3.5 text-amber-400" />
          <span>
            {thread.favorited ? 'Remove from favorites' : 'Add to favorites'}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-xs py-1.5 px-2 rounded-md"
          onClick={(e) => {
            e.preventDefault();
            onRename();
          }}
        >
          <Edit className="mr-2 h-3.5 w-3.5 text-gray-500" />
          <span>Rename</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1 bg-gray-100" />
        <DropdownMenuItem
          className="text-xs py-1.5 px-2 rounded-md text-red-500"
          onClick={(e) => {
            e.preventDefault();
            onDelete();
          }}
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default Threads;
