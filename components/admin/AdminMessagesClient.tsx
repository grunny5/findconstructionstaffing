'use client';

import { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Building2, AlertCircle, MessageSquare, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Participant {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface ConversationData {
  id: string;
  context_type: string;
  context_agency: {
    id: string;
    name: string;
    slug: string;
  } | null;
  participants: Participant[];
  total_messages: number;
  recent_messages_24h: number;
  last_message_preview: string;
  last_message_at: string;
  created_at: string;
  is_high_volume: boolean;
}

interface AdminMessagesClientProps {
  conversations: ConversationData[];
}

type FilterType = 'all' | 'flagged' | 'high_volume';

export function AdminMessagesClient({
  conversations,
}: AdminMessagesClientProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  // ========================================================================
  // FILTERING LOGIC
  // ========================================================================
  const filteredConversations = useMemo(() => {
    let result = conversations;

    // Apply filter
    if (filter === 'high_volume') {
      result = result.filter((conv) => conv.is_high_volume);
    } else if (filter === 'flagged') {
      // Flagged conversations (future implementation)
      result = [];
    }

    // Apply search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter((conv) =>
        conv.participants.some(
          (p) =>
            p.full_name.toLowerCase().includes(searchLower) ||
            p.email.toLowerCase().includes(searchLower)
        )
      );
    }

    return result;
  }, [conversations, filter, search]);

  // ========================================================================
  // COUNTS
  // ========================================================================
  const counts = {
    all: conversations.length,
    flagged: 0, // Future implementation
    high_volume: conversations.filter((c) => c.is_high_volume).length,
  };

  // ========================================================================
  // RENDER
  // ========================================================================
  return (
    <div className="space-y-6">
      {/* Admin Banner */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You are viewing conversations as an administrator. All platform
          conversations are visible for moderation purposes.
        </AlertDescription>
      </Alert>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Message Moderation</h1>
          <p className="text-muted-foreground">
            View and moderate all platform conversations
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="space-y-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <TabsList>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="high_volume">
              High Volume ({counts.high_volume})
            </TabsTrigger>
            <TabsTrigger value="flagged" disabled>
              Flagged ({counts.flagged})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Input
          type="search"
          placeholder="Search by participant name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Conversations Table */}
      {filteredConversations.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No conversations found</h3>
          <p className="text-muted-foreground">
            {search.trim()
              ? 'Try adjusting your search query'
              : filter === 'high_volume'
                ? 'No high-volume conversations at this time'
                : 'No conversations to display'}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participants</TableHead>
                <TableHead>Context</TableHead>
                <TableHead className="text-right">Messages</TableHead>
                <TableHead className="text-right">24h Activity</TableHead>
                <TableHead>Last Message</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConversations.map((conv) => {
                const lastMessageTime = formatDistanceToNow(
                  new Date(conv.last_message_at),
                  { addSuffix: true }
                );

                return (
                  <TableRow key={conv.id}>
                    {/* Participants */}
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {conv.participants.map((p) => (
                          <div key={p.id} className="flex items-center gap-2">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{p.full_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {p.role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </TableCell>

                    {/* Context */}
                    <TableCell>
                      {conv.context_type === 'agency_inquiry' &&
                      conv.context_agency ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {conv.context_agency.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          General
                        </span>
                      )}
                    </TableCell>

                    {/* Total Messages */}
                    <TableCell className="text-right">
                      <Badge variant="secondary">{conv.total_messages}</Badge>
                    </TableCell>

                    {/* 24h Activity */}
                    <TableCell className="text-right">
                      {conv.is_high_volume ? (
                        <Badge variant="destructive">
                          {conv.recent_messages_24h}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {conv.recent_messages_24h}
                        </span>
                      )}
                    </TableCell>

                    {/* Last Message Preview */}
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="truncate text-sm text-muted-foreground">
                          {conv.last_message_preview}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {lastMessageTime}
                        </p>
                      </div>
                    </TableCell>

                    {/* Created Date */}
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(conv.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/messages/conversations/${conv.id}`}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Footer Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredConversations.length} of {conversations.length}{' '}
          conversations
        </span>
        <span>High volume: {counts.high_volume} conversations</span>
      </div>
    </div>
  );
}
