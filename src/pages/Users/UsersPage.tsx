import { useState, useEffect } from 'react';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';
import { getClubMembers, getReservations, getMatches } from '../../data/api';
import { useGym } from '../../contexts/GymContext';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import type { ClubMember } from '../../types/club_member';
import type { Reservation, Match } from '../../types';

interface UserActivity {
  member: ClubMember;
  reservations: Reservation[];
  matches: Match[];
}

export default function UsersPage() {
  const { currentGym } = useGym();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const gymId = currentGym?.id ?? '';
    Promise.all([
      getClubMembers(gymId),
      getReservations({ gymId }),
      getMatches({ gymId }),
    ]).then(([members, reservations, matches]) => {
      // Build activity per user — match by player name/nickname in reservations
      const userActivities: UserActivity[] = members.map(member => {
        const userReservations = reservations.filter(r =>
          r.playerName.toLowerCase() === member.nickname.toLowerCase()
        );
        const userMatches = matches.filter(m =>
          m.players?.some(p => p.toLowerCase() === member.nickname.toLowerCase())
        );
        return { member, reservations: userReservations, matches: userMatches };
      });

      // Sort by most active first
      userActivities.sort((a, b) =>
        (b.reservations.length + b.matches.length) - (a.reservations.length + a.matches.length)
      );

      setActivities(userActivities);
      setLoading(false);
    });
  }, [currentGym?.id]);

  const filtered = search
    ? activities.filter(a => a.member.nickname.toLowerCase().includes(search.toLowerCase()))
    : activities;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl text-white leading-none">Usuarios</h1>
        <p className="text-[#8E8E93] text-sm mt-1 font-['Poppins'] normal-case font-normal">
          Actividad de los jugadores de la app en tu club ({activities.length})
        </p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Buscar por nickname..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-sm bg-[#2C2C2E] text-white text-sm rounded-xl px-4 py-2.5 border border-[#2C2C2E] outline-none focus:border-[#7BFF00] placeholder-[#636366]"
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#7BFF00] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users size={40} className="text-[#3C3C3E] mb-3" />
          <p className="text-white font-medium">
            {search ? 'No se encontraron jugadores' : 'Sin jugadores registrados'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(({ member, reservations, matches }) => {
            const isExpanded = expandedUser === member.id;
            const totalActivity = reservations.length + matches.length;
            const cancelled = reservations.filter(r => r.status === 'cancelled').length;
            const confirmed = reservations.filter(r => r.status === 'confirmed').length;

            return (
              <Card key={member.id} className="!p-0 overflow-hidden">
                {/* User row */}
                <button
                  onClick={() => setExpandedUser(isExpanded ? null : member.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2C2C2E]/30 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-[#7BFF00]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#7BFF00] text-xs font-bold">
                      {member.nickname.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-white font-medium">{member.nickname}</span>
                    {isAdmin && member.level != null && (
                      <span className="text-xs text-[#636366] ml-2">Nivel {member.level.toFixed(1)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {isAdmin && matches.length > 0 && (
                      <Badge variant="green">{matches.length} partido{matches.length !== 1 ? 's' : ''}</Badge>
                    )}
                    {isAdmin && reservations.length > 0 && (
                      <Badge variant="blue">{reservations.length} reserva{reservations.length !== 1 ? 's' : ''}</Badge>
                    )}
                    {isAdmin && totalActivity === 0 && (
                      <span className="text-xs text-[#636366]">Sin actividad</span>
                    )}
                    {isExpanded ? <ChevronUp size={16} className="text-[#636366]" /> : <ChevronDown size={16} className="text-[#636366]" />}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-[#2C2C2E] px-4 py-3 bg-[#0A0A0F] space-y-3">
                    {isAdmin ? (
                      <>
                        {/* Stats summary — admin only */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <p className="text-[10px] text-[#636366] uppercase">Partidos</p>
                            <p className="text-lg font-bold text-white">{matches.length}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#636366] uppercase">Reservas</p>
                            <p className="text-lg font-bold text-white">{confirmed}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#636366] uppercase">Canceladas</p>
                            <p className="text-lg font-bold text-white">{cancelled}</p>
                          </div>
                          {member.winPercentage != null && (
                            <div>
                              <p className="text-[10px] text-[#636366] uppercase">% Victorias</p>
                              <p className="text-lg font-bold text-white">{Math.round(member.winPercentage * 100)}%</p>
                            </div>
                          )}
                        </div>

                        {/* Recent reservations — admin */}
                        {reservations.length > 0 && (
                          <div>
                            <p className="text-xs text-[#636366] uppercase mb-2">Ultimas reservas</p>
                            <div className="space-y-1">
                              {reservations.slice(0, 5).map(r => (
                                <div key={r.id} className="flex items-center justify-between text-xs py-1">
                                  <span className="text-[#8E8E93]">{r.date} {r.startTime}-{r.endTime}</span>
                                  <Badge variant={r.status === 'confirmed' ? 'green' : 'gray'} size="sm">
                                    {r.status === 'confirmed' ? 'Completada' : 'Cancelada'}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recent matches — admin */}
                        {matches.length > 0 && (
                          <div>
                            <p className="text-xs text-[#636366] uppercase mb-2">Ultimos partidos</p>
                            <div className="space-y-1">
                              {matches.slice(0, 5).map(m => (
                                <div key={m.id} className="flex items-center justify-between text-xs py-1">
                                  <span className="text-[#8E8E93]">
                                    {new Date(m.startedAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                                    {' '}{m.courtName && `en ${m.courtName}`}
                                  </span>
                                  <span className="text-white">{m.format} · {m.duration} min</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {totalActivity === 0 && (
                          <p className="text-xs text-[#636366]">Este jugador no tiene actividad registrada en tus cestas.</p>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Gestor: only reservation times */}
                        {reservations.length > 0 ? (
                          <div className="space-y-1">
                            {reservations.slice(0, 5).map(r => (
                              <div key={r.id} className="text-xs py-1">
                                <span className="text-[#8E8E93]">{r.date} {r.startTime}-{r.endTime}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#636366]">Sin reservas en tus canastas.</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
