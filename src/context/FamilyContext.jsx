import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@context/AuthContext';

/* ═══════════════════════════════════════════════════════
   KYŌRA — FamilyContext
   Gestiona hasta MAX_MEMBERS perfiles adicionales bajo
   una misma cuenta (feature del Plan Premium).
   Persiste en localStorage scoped por userId.

   activeMemberId === null → se usa el perfil principal (UserContext)
   activeMemberId === 'fm_xxx' → se usa ese perfil de familia
   ═══════════════════════════════════════════════════════ */

export const MAX_FAMILY_MEMBERS = 2;

const FamilyContext = createContext(null);
const FAMILY_KEY_BASE = 'kyora.family';
const ACTIVE_KEY_BASE = 'kyora.family.active';

function keyFor(base, userId) {
  return userId ? `${base}.${userId}` : `${base}.guest`;
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function persist(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

let _counter = Date.now();
function uid() { return `fm_${(++_counter).toString(36)}`; }

export function FamilyProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id || null;
  const membersKey = keyFor(FAMILY_KEY_BASE, userId);
  const activeKey = keyFor(ACTIVE_KEY_BASE, userId);

  const [members, setMembers] = useState(() => load(membersKey, []));
  const [activeMemberId, setActiveMemberId] = useState(() => load(activeKey, null));

  // Reload when user changes (login / logout / switch account)
  useEffect(() => {
    setMembers(load(membersKey, []));
    setActiveMemberId(load(activeKey, null));
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { persist(membersKey, members); }, [members, membersKey]);
  useEffect(() => { persist(activeKey, activeMemberId); }, [activeMemberId, activeKey]);

  const getMember = useCallback(
    (id) => members.find((m) => m.id === id) ?? null,
    [members]
  );

  const addMember = useCallback((data) => {
    if (members.length >= MAX_FAMILY_MEMBERS) return null;
    const member = { id: uid(), ...data };
    setMembers((prev) => [...prev, member]);
    return member;
  }, [members.length]);

  const updateMember = useCallback((id, data) => {
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, ...data } : m));
  }, []);

  const removeMember = useCallback((id) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    // Si el eliminado era el activo, volver al perfil principal
    setActiveMemberId((prev) => prev === id ? null : prev);
  }, []);

  const setActiveProfile = useCallback((id) => {
    setActiveMemberId(id); // null = perfil principal
  }, []);

  const activeProfile = useMemo(
    () => activeMemberId ? (getMember(activeMemberId) ?? null) : null,
    [activeMemberId, getMember]
  );

  const canAddMember = members.length < MAX_FAMILY_MEMBERS;

  return (
    <FamilyContext.Provider value={{
      members,
      activeMemberId,
      activeProfile,
      canAddMember,
      getMember,
      addMember,
      updateMember,
      removeMember,
      setActiveProfile,
      MAX_FAMILY_MEMBERS,
    }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error('useFamily must be used within FamilyProvider');
  return ctx;
}
