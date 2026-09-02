import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import {
  computeIsUserOnline,
  isPresenceSharingAllowed,
  formatLastSeen,
  updateMyPresence,
  sendOfflineBeacon,
} from '../lib/presenceService';

interface UseChatPresenceOptions {
  currentUserId?: string;
  currentUserProfile?: Profile | null;
  activeContactId?: string;
  onProfileUpdated?: (updatedProfile: Partial<Profile> & { id: string }) => void;
}

export function useChatPresence({
  currentUserId,
  currentUserProfile,
  activeContactId,
  onProfileUpdated,
}: UseChatPresenceOptions) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  // Per-contact presence data store (keyed strictly by contact user_id)
  const [contactPresenceMap, setContactPresenceMap] = useState<
    Map<string, { is_online?: boolean; last_seen?: string | null; show_online_status?: boolean }>
  >(new Map());
  // Periodic ticker to recalculate relative timestamps ("just now", "5m ago", etc.)
  const [, setTick] = useState(0);

  const hiddenTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);
  const onProfileUpdatedRef = useRef(onProfileUpdated);

  useEffect(() => {
    onProfileUpdatedRef.current = onProfileUpdated;
  }, [onProfileUpdated]);

  // Periodic tick to automatically keep relative time strings fresh in the UI
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => (t + 1) % 10000);
    }, 15_000);
    return () => clearInterval(timer);
  }, []);

  // Fetch fresh per-user presence whenever active conversation partner changes
  useEffect(() => {
    if (!activeContactId) return;

    let isMounted = true;
    (supabase as any)
      .from('profiles')
      .select('id, is_online, last_seen, show_online_status')
      .eq('id', activeContactId)
      .maybeSingle()
      .then(({ data, error }: any) => {
        if (!isMounted || error || !data) return;
        setContactPresenceMap((prev) => {
          const next = new Map(prev);
          next.set(data.id, data);
          return next;
        });
        if (onProfileUpdatedRef.current) {
          onProfileUpdatedRef.current(data);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeContactId]);

  // Main presence channel effect
  useEffect(() => {
    if (!currentUserId) return;

    let isCleanedUp = false;

    // Helper to refresh online IDs from presence state
    const syncPresences = (channel: any) => {
      try {
        const state = channel.presenceState();
        const activeIds = new Set<string>();
        for (const key of Object.keys(state)) {
          if (key) activeIds.add(key);
        }
        setOnlineUserIds(activeIds);
      } catch (err) {
        console.warn('[Presence] Error reading presenceState:', err);
      }
    };

    // 1. Join the presence channel
    const channel = supabase.channel('chat-presence', {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        if (!isCleanedUp) syncPresences(channel);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        if (!isCleanedUp && key) {
          setOnlineUserIds((prev) => {
            const next = new Set(prev);
            next.add(key);
            return next;
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (!isCleanedUp && key) {
          setOnlineUserIds((prev) => {
            const next = new Set(prev);
            // Verify if key still has other active presences
            const state = channel.presenceState();
            if (!state[key] || state[key].length === 0) {
              next.delete(key);
            }
            return next;
          });
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated?.id && !isCleanedUp) {
            setContactPresenceMap((prev) => {
              const next = new Map(prev);
              next.set(updated.id, {
                is_online: updated.is_online,
                last_seen: updated.last_seen,
                show_online_status: updated.show_online_status,
              });
              return next;
            });
            if (onProfileUpdatedRef.current) {
              onProfileUpdatedRef.current(updated);
            }
          }
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await channel.track({
              user_id: currentUserId,
              online_at: new Date().toISOString(),
            });
            // Mark online in DB
            await updateMyPresence(currentUserId, true);
          } catch (e) {
            console.warn('[Presence] Error tracking channel:', e);
          }
        }
      });

    // 2. Periodic heartbeat (every 18 seconds) while foregrounded
    heartbeatIntervalRef.current = setInterval(async () => {
      if (document.visibilityState === 'visible') {
        try {
          await updateMyPresence(currentUserId, true);
        } catch {}
      }
    }, 18_000);

    // 3. Tab visibility handler (30s background timeout)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        // App went to background: schedule mark offline in ~30s
        hiddenTimeoutRef.current = setTimeout(async () => {
          try {
            await updateMyPresence(currentUserId, false);
            if (channelRef.current) {
              await channelRef.current.untrack();
            }
          } catch {}
        }, 30_000);
      } else {
        // App restored to foreground
        if (hiddenTimeoutRef.current) {
          clearTimeout(hiddenTimeoutRef.current);
          hiddenTimeoutRef.current = null;
        }
        try {
          await updateMyPresence(currentUserId, true);
          if (channelRef.current) {
            await channelRef.current.track({
              user_id: currentUserId,
              online_at: new Date().toISOString(),
            });
          }
        } catch {}
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 4. Tab close / unload handler (beforeunload & pagehide)
    const handleUnload = () => {
      sendOfflineBeacon(currentUserId);
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    // Cleanup on component unmount
    return () => {
      isCleanedUp = true;
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (hiddenTimeoutRef.current) {
        clearTimeout(hiddenTimeoutRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);

      // Gracefully mark offline & remove channel
      sendOfflineBeacon(currentUserId);
      updateMyPresence(currentUserId, false).catch(() => {});
      channel.untrack().catch(() => {});
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [currentUserId]);

  /**
   * Evaluates if a contact is online, factoring in mutual privacy settings and per-contact presence map.
   */
  const isContactOnline = useCallback(
    (contactId?: string, contactProfile?: Profile | null): boolean => {
      if (!contactId) return false;

      // Merge latest individual contact presence data
      const override = contactPresenceMap.get(contactId);
      const effectiveProfile = override
        ? ({ ...contactProfile, ...override } as Profile)
        : contactProfile;

      // Privacy check: if either user turned off status, hide
      const allowed = isPresenceSharingAllowed(currentUserProfile, effectiveProfile);
      if (!allowed) return false;

      return computeIsUserOnline(contactId, onlineUserIds, effectiveProfile);
    },
    [currentUserProfile, onlineUserIds, contactPresenceMap]
  );

  /**
   * Returns display text, online boolean, and visibility for the chat header.
   */
  const getContactStatus = useCallback(
    (
      contactProfile?: Profile | null
    ): { isOnline: boolean; statusText: string; isVisible: boolean } => {
      if (!contactProfile?.id) {
        return { isOnline: false, statusText: '', isVisible: false };
      }

      // Merge latest individual contact presence data
      const override = contactPresenceMap.get(contactProfile.id);
      const effectiveProfile = override
        ? ({ ...contactProfile, ...override } as Profile)
        : contactProfile;

      // Check mutual privacy
      const allowed = isPresenceSharingAllowed(currentUserProfile, effectiveProfile);
      if (!allowed) {
        return { isOnline: false, statusText: '', isVisible: false };
      }

      const online = computeIsUserOnline(
        contactProfile.id,
        onlineUserIds,
        effectiveProfile
      );

      if (online) {
        return { isOnline: true, statusText: 'Online', isVisible: true };
      }

      const lastSeenText = formatLastSeen(effectiveProfile.last_seen);
      return {
        isOnline: false,
        statusText: lastSeenText,
        isVisible: Boolean(lastSeenText),
      };
    },
    [currentUserProfile, onlineUserIds, contactPresenceMap]
  );

  return {
    onlineUserIds,
    isContactOnline,
    getContactStatus,
  };
}
