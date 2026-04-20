import { useMemo } from 'react';
import { useUser } from '@context/UserContext';
import { useFamily } from '@context/FamilyContext';

/* ═══════════════════════════════════════════════════════
   KYŌRA — useActiveProfile()
   Devuelve el perfil activo: el del usuario principal o el de
   un miembro de familia seleccionado. Todos los componentes
   que consumen el perfil para el agente / generación de planes
   deben usar este hook en lugar de useUser() directamente.
   ═══════════════════════════════════════════════════════ */

const GOAL_LABELS = {
  lose:     'Perder grasa',
  gain:     'Ganar músculo',
  both:     'Recomposición corporal',
  health:   'Comer mejor',
  energy:   'Más energía',
  maintain: 'Mantener estado actual',
};

function formatForAgent(p) {
  if (!p) return null;
  return {
    nombre:       p.nombre || 'Usuario',
    sexo:         p.sexo === 'hombre' ? 'Hombre' : p.sexo === 'mujer' ? 'Mujer' : 'No especificado',
    edad:         p.edad        || 'No especificada',
    peso:         p.peso        ? `${p.peso} kg`    : 'No especificado',
    altura:       p.altura      ? `${p.altura} cm`  : 'No especificada',
    objetivo:     GOAL_LABELS[p.objetivo] || p.objetivo || 'No especificado',
    restricciones: p.restricciones?.length ? p.restricciones.join(', ') : 'Ninguna',
    actividad:    p.actividad || 'No especificada',
    preferencias: p.cocinas?.length ? p.cocinas.join(', ') : 'Sin preferencias específicas',
  };
}

export function useActiveProfile() {
  const { profile, profileForAgent, profileLoading } = useUser();
  const { activeMemberId, activeProfile } = useFamily();

  return useMemo(() => {
    if (activeMemberId && activeProfile) {
      return {
        profile:        activeProfile,
        profileForAgent: formatForAgent(activeProfile),
        profileLoading: false,
        isFamilyMember: true,
        memberName:     activeProfile.nombre || 'Familiar',
        memberId:       activeMemberId,
      };
    }
    return {
      profile,
      profileForAgent,
      profileLoading,
      isFamilyMember: false,
      memberName:     profile?.nombre || 'Mi perfil',
      memberId:       null,
    };
  }, [activeMemberId, activeProfile, profile, profileForAgent, profileLoading]);
}
