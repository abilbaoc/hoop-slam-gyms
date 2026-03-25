import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { getClubMembers } from '../../data/api';
import { useGym } from '../../contexts/GymContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import type { ClubMember } from '../../types/club_member';

export default function UsersPage() {
  const { currentGym } = useGym();
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    getClubMembers(currentGym?.id ?? '').then(data => {
      setMembers(data);
      setLoading(false);
    });
  }, [currentGym?.id]);

  const filtered = search
    ? members.filter(m => m.nickname.toLowerCase().includes(search.toLowerCase()))
    : members;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl text-white leading-none">Usuarios</h1>
        <p className="text-[#8E8E93] text-sm mt-1 font-['Poppins'] normal-case font-normal">
          Jugadores registrados en la app ({members.length})
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
        <Card className="overflow-x-auto !p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#636366] text-xs border-b border-[#2C2C2E]">
                <th className="text-left py-3 px-4 font-medium">Nickname</th>
                <th className="text-left py-3 px-4 font-medium hidden sm:table-cell">Nivel</th>
                <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Partidos</th>
                <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Victorias</th>
                <th className="text-left py-3 px-4 font-medium hidden lg:table-cell">% Victorias</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <tr key={member.id} className="border-b border-[#2C2C2E] last:border-0 hover:bg-[#2C2C2E]/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#7BFF00]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#7BFF00] text-xs font-bold">
                          {member.nickname.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-white font-medium">{member.nickname}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    {member.level != null ? (
                      <span className="text-white font-medium">{member.level.toFixed(1)}</span>
                    ) : <span className="text-[#636366]">—</span>}
                  </td>
                  <td className="py-3 px-4 text-[#8E8E93] hidden md:table-cell">
                    {member.gamesPlayed ?? '—'}
                  </td>
                  <td className="py-3 px-4 text-[#8E8E93] hidden md:table-cell">
                    {member.gamesWon ?? '—'}
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell">
                    {member.winPercentage != null ? (
                      <span className="text-white">{Math.round(member.winPercentage * 100)}%</span>
                    ) : <span className="text-[#636366]">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
