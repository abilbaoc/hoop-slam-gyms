import { useEffect, useState } from 'react';
import { Search, Users, Lock } from 'lucide-react';
import Card from '../../components/ui/Card';
import { getClubMembers } from '../../data/api';
import { useGym } from '../../contexts/GymContext';
import type { ClubMember } from '../../types/club_member';

export default function ClubMembersPage() {
  const { currentGym } = useGym();
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (currentGym?.id) getClubMembers(currentGym.id).then(setMembers);
  }, [currentGym?.id]);

  const filtered = members.filter(m =>
    m.nickname.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl text-white leading-none">Miembros</h1>
        <p className="text-[#8E8E93] text-sm mt-1 font-['Poppins'] normal-case font-normal">
          Jugadores que pertenecen a este club
        </p>
      </div>

      {/* Privacy banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl border-l-2 border-[#FF9F0A] bg-[#FF9F0A]/8">
        <Lock size={14} className="text-[#FF9F0A] mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[#8E8E93]">
          Por protección de datos, los clubs solo tienen acceso al nickname del jugador.
          Los datos personales (email, nombre real) son gestionados exclusivamente por Hoop Slam.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#636366]" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nickname..."
          className="w-full bg-[#1C1C1E] text-white text-sm rounded-xl pl-9 pr-4 py-2.5 border border-[#2C2C2E] outline-none focus:border-[#7BFF00] placeholder-[#636366]"
        />
      </div>

      {/* Table or empty state */}
      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users size={48} className="text-[#3C3C3E] mb-4" />
          <p className="text-white font-medium text-lg">Sin miembros todavía</p>
          <p className="text-sm text-[#8E8E93] mt-2 max-w-sm">
            Los jugadores aparecerán aquí cuando reserven o jueguen en alguna canasta de este club desde la app Hoop Slam.
          </p>
        </div>
      ) : (
        <>
          <Card className="!p-0 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#2C2C2E]">
                  <th className="px-4 py-3 text-xs font-medium text-[#636366] uppercase w-12">#</th>
                  <th className="px-4 py-3 text-xs font-medium text-[#636366] uppercase">Nickname</th>
                  <th className="px-4 py-3 text-xs font-medium text-[#636366] uppercase">Miembro desde</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((member, i) => (
                  <tr key={member.id} className="border-b border-[#2C2C2E] last:border-0 hover:bg-[#2C2C2E]/30">
                    <td className="px-4 py-3 text-sm text-[#636366]">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-white">{member.nickname}</td>
                    <td className="px-4 py-3 text-sm text-[#8E8E93]">
                      {new Date(member.joinedAt).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <p className="text-xs text-[#636366]">
            Mostrando {filtered.length} de {members.length} miembros
          </p>
        </>
      )}
    </div>
  );
}
