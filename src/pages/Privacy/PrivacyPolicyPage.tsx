import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="text-[#8E8E93] text-sm leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: SectionProps) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-base font-medium text-white">{title}</h3>
      <div className="text-[#8E8E93] text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black font-['Poppins']">
      {/* Top bar */}
      <div className="border-b border-[#2C2C2E]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[#8E8E93] text-sm hover:text-white transition-colors duration-150"
          >
            <ArrowLeft size={16} />
            Volver
          </Link>
          <div className="h-4 w-px bg-[#2C2C2E]" />
          <span className="text-[#8E8E93] text-sm">Hoop Slam Technologies S.L.</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">

        {/* Header */}
        <div className="space-y-2">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: '#7BFF00' }} />
          <h1 className="text-4xl font-semibold text-white leading-tight">
            Política de Privacidad
          </h1>
          <p className="text-[#8E8E93] text-sm">
            Última actualización: 24 de marzo de 2026
          </p>
        </div>

        {/* 1 — Responsable del tratamiento */}
        <Section title="1. Responsable del tratamiento">
          <p>
            El responsable del tratamiento de los datos personales recogidos a través de la plataforma
            Hoop Slam es:
          </p>
          <div className="bg-[#1C1C1E] rounded-2xl p-5 space-y-1 text-white text-sm">
            <p><span className="text-[#8E8E93]">Razón social:</span> Hoop Slam Technologies S.L.</p>
            <p><span className="text-[#8E8E93]">CIF:</span> B-XXXXXXXX</p>
            <p><span className="text-[#8E8E93]">Domicilio social:</span> Carrer de la Indústria 42, 08025 Barcelona</p>
            <p><span className="text-[#8E8E93]">Inscripción:</span> Registro Mercantil de Barcelona, Tomo XXXXX, Folio XX</p>
            <p><span className="text-[#8E8E93]">Contacto:</span>{' '}
              <a href="mailto:privacy@hoopslam.com" className="text-[#7BFF00] hover:opacity-80 transition-opacity">
                privacy@hoopslam.com
              </a>
            </p>
          </div>
        </Section>

        {/* 2 — Datos recogidos */}
        <Section title="2. Datos personales que recogemos">
          <SubSection title="2.1 Datos que nos proporcionas directamente">
            <ul className="list-disc list-inside space-y-1 marker:text-[#7BFF00]">
              <li>Nombre y apellidos</li>
              <li>Dirección de correo electrónico</li>
              <li>Número de teléfono (opcional)</li>
              <li>Datos de la empresa o instalación deportiva que representas</li>
              <li>Credenciales de acceso (contraseña almacenada con hash bcrypt)</li>
            </ul>
          </SubSection>
          <SubSection title="2.2 Datos generados por el uso del servicio">
            <ul className="list-disc list-inside space-y-1 marker:text-[#7BFF00]">
              <li>Registros de actividad y sesiones (logs de acceso, dirección IP)</li>
              <li>Métricas de uso de canchas, reservas y partidos</li>
              <li>Datos de dispositivos IoT asociados a tu instalación (Smart Hoop)</li>
              <li>Preferencias de configuración de la plataforma</li>
            </ul>
          </SubSection>
          <SubSection title="2.3 Datos recogidos mediante cookies">
            <p>
              Consulta la sección 8 (Cookies) para información detallada sobre los datos
              recogidos mediante cookies y tecnologías similares.
            </p>
          </SubSection>
        </Section>

        {/* 3 — Finalidad y base legal */}
        <Section title="3. Finalidad del tratamiento y base legal">
          <div className="space-y-4">
            <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2C2C2E]">
                    <th className="text-left px-5 py-3 text-[#7BFF00] font-medium">Finalidad</th>
                    <th className="text-left px-5 py-3 text-[#7BFF00] font-medium">Base legal (RGPD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2C2C2E]">
                  <tr>
                    <td className="px-5 py-3 text-white">Prestación del servicio contratado</td>
                    <td className="px-5 py-3 text-[#8E8E93]">Art. 6.1.b — Ejecución de contrato</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 text-white">Gestión de facturación y pagos</td>
                    <td className="px-5 py-3 text-[#8E8E93]">Art. 6.1.b — Ejecución de contrato</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 text-white">Soporte técnico y atención al cliente</td>
                    <td className="px-5 py-3 text-[#8E8E93]">Art. 6.1.b — Ejecución de contrato</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 text-white">Cumplimiento de obligaciones legales</td>
                    <td className="px-5 py-3 text-[#8E8E93]">Art. 6.1.c — Obligación legal</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 text-white">Análisis de uso para mejorar el producto</td>
                    <td className="px-5 py-3 text-[#8E8E93]">Art. 6.1.f — Interés legítimo</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 text-white">Envío de comunicaciones comerciales</td>
                    <td className="px-5 py-3 text-[#8E8E93]">Art. 6.1.a — Consentimiento</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* 4 — Conservación */}
        <Section title="4. Plazo de conservación de los datos">
          <p>
            Los datos personales se conservarán durante el tiempo necesario para cumplir la
            finalidad para la que fueron recogidos y, en todo caso, durante los plazos legalmente
            exigidos:
          </p>
          <ul className="list-disc list-inside space-y-1 marker:text-[#7BFF00]">
            <li>Datos de cuenta activa: durante la vigencia de la relación contractual.</li>
            <li>
              Datos de cuenta cancelada: 5 años para obligaciones fiscales y mercantiles
              (art. 30 Ccom; art. 66 LGT).
            </li>
            <li>Logs de acceso: 12 meses (Ley 34/2002, LSSI).</li>
            <li>
              Datos de marketing: hasta retirada del consentimiento o 3 años de inactividad.
            </li>
          </ul>
          <p>
            Transcurridos estos plazos, los datos serán suprimidos o anonimizados de forma
            irreversible.
          </p>
        </Section>

        {/* 5 — Terceros */}
        <Section title="5. Comunicación de datos a terceros">
          <p>
            Hoop Slam Technologies S.L. no vende ni cede datos personales a terceros con fines
            comerciales. Los datos únicamente se comunican a:
          </p>
          <SubSection title="5.1 Encargados del tratamiento (proveedores de servicios)">
            <ul className="list-disc list-inside space-y-1 marker:text-[#7BFF00]">
              <li>
                <strong className="text-white">Amazon Web Services (AWS)</strong> — alojamiento de
                infraestructura. Servidores en región EU (Irlanda / Frankfurt).
              </li>
              <li>
                <strong className="text-white">Stripe Inc.</strong> — pasarela de pago. Tratamiento
                bajo su propia política de privacidad.
              </li>
              <li>
                <strong className="text-white">Google LLC (Analytics / Firebase)</strong> — análisis
                de uso (solo si has aceptado cookies analíticas). Transferencia a EE.UU. bajo
                cláusulas contractuales tipo (CCT).
              </li>
              <li>
                <strong className="text-white">Intercom</strong> — soporte y comunicación con
                clientes.
              </li>
            </ul>
          </SubSection>
          <SubSection title="5.2 Obligaciones legales">
            <p>
              Podemos comunicar datos a autoridades públicas o judiciales cuando así lo exija la
              legislación española o de la Unión Europea.
            </p>
          </SubSection>
          <p>
            Todos los encargados del tratamiento están vinculados por contratos de encargo que
            garantizan un nivel de protección equivalente al exigido por el RGPD.
          </p>
        </Section>

        {/* 6 — Derechos RGPD */}
        <Section title="6. Derechos de los interesados (RGPD)">
          <p>
            En virtud del Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD),
            puedes ejercer en cualquier momento los siguientes derechos:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                title: 'Acceso',
                desc: 'Obtener confirmación sobre si tratamos tus datos y acceder a una copia de los mismos.',
              },
              {
                title: 'Rectificación',
                desc: 'Solicitar la corrección de datos inexactos o incompletos.',
              },
              {
                title: 'Supresión',
                desc: 'Pedir la eliminación de tus datos cuando ya no sean necesarios o retires el consentimiento.',
              },
              {
                title: 'Portabilidad',
                desc: 'Recibir tus datos en formato estructurado, de uso común y legible por máquina.',
              },
              {
                title: 'Limitación',
                desc: 'Solicitar la suspensión del tratamiento en los supuestos previstos por el RGPD.',
              },
              {
                title: 'Oposición',
                desc: 'Oponerte al tratamiento basado en interés legítimo o con fines de marketing directo.',
              },
            ].map((right) => (
              <div key={right.title} className="bg-[#1C1C1E] rounded-2xl p-4 space-y-1">
                <p className="text-white text-sm font-medium">{right.title}</p>
                <p className="text-[#8E8E93] text-xs leading-relaxed">{right.desc}</p>
              </div>
            ))}
          </div>
          <p>
            Para ejercer cualquiera de estos derechos, envía un correo a{' '}
            <a href="mailto:privacy@hoopslam.com" className="text-[#7BFF00] hover:opacity-80 transition-opacity">
              privacy@hoopslam.com
            </a>{' '}
            indicando el derecho que deseas ejercer y adjuntando copia de tu documento de identidad.
            Responderemos en un plazo máximo de <strong className="text-white">30 días naturales</strong>.
          </p>
          <p>
            Si consideras que el tratamiento vulnera la normativa vigente, tienes derecho a
            presentar una reclamación ante la{' '}
            <strong className="text-white">
              Agencia Española de Protección de Datos (AEPD)
            </strong>{' '}
            — <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-[#7BFF00] hover:opacity-80 transition-opacity">www.aepd.es</a>.
          </p>
        </Section>

        {/* 7 — Seguridad */}
        <Section title="7. Medidas de seguridad">
          <p>
            Hoop Slam Technologies S.L. aplica medidas técnicas y organizativas apropiadas para
            garantizar la seguridad de los datos personales, entre ellas:
          </p>
          <ul className="list-disc list-inside space-y-1 marker:text-[#7BFF00]">
            <li>Cifrado en tránsito mediante TLS 1.3.</li>
            <li>Cifrado en reposo para bases de datos y copias de seguridad.</li>
            <li>Contraseñas almacenadas con hash bcrypt (coste 12).</li>
            <li>Control de accesos basado en roles (RBAC).</li>
            <li>Auditorías de seguridad periódicas y programa de gestión de vulnerabilidades.</li>
          </ul>
        </Section>

        {/* 8 — Cookies */}
        <Section title="8. Política de cookies">
          <p>
            Utilizamos cookies y tecnologías similares en nuestra plataforma. A continuación se
            describen las categorías empleadas:
          </p>
          <div className="space-y-3">
            {[
              {
                name: 'Necesarias',
                desc: 'Esenciales para el funcionamiento de la plataforma (autenticación, seguridad CSRF, preferencias de sesión). No requieren consentimiento.',
                examples: 'session_id, csrf_token, auth_token',
              },
              {
                name: 'Analíticas',
                desc: 'Nos permiten medir el rendimiento y el uso del servicio para mejorarlo.',
                examples: 'Google Analytics (_ga, _gid), Mixpanel',
              },
              {
                name: 'Marketing',
                desc: 'Utilizadas para mostrar publicidad personalizada y medir la eficacia de campañas.',
                examples: 'Meta Pixel (_fbp), Google Ads (IDE)',
              },
            ].map((cat) => (
              <div key={cat.name} className="bg-[#1C1C1E] rounded-2xl p-4 space-y-1">
                <p className="text-white text-sm font-medium">{cat.name}</p>
                <p className="text-[#8E8E93] text-xs leading-relaxed">{cat.desc}</p>
                <p className="text-[#8E8E93] text-xs">
                  <span className="text-white">Ejemplos:</span> {cat.examples}
                </p>
              </div>
            ))}
          </div>
          <p>
            Puedes gestionar o retirar tu consentimiento en cualquier momento desde el banner de
            cookies que aparece al acceder a la plataforma, o desde los ajustes de tu navegador.
            La retirada del consentimiento no afectará a la licitud del tratamiento realizado antes
            de la misma.
          </p>
        </Section>

        {/* 9 — Contacto DPO */}
        <Section title="9. Contacto — Delegado de Protección de Datos (DPO)">
          <p>
            Para cualquier consulta relativa al tratamiento de tus datos personales o al ejercicio
            de tus derechos, puedes contactar con nuestro Delegado de Protección de Datos:
          </p>
          <div className="bg-[#1C1C1E] rounded-2xl p-5 space-y-2 text-sm">
            <p className="text-white font-medium">DPO — Hoop Slam Technologies S.L.</p>
            <p className="text-[#8E8E93]">
              Email:{' '}
              <a
                href="mailto:privacy@hoopslam.com"
                className="text-[#7BFF00] hover:opacity-80 transition-opacity"
              >
                privacy@hoopslam.com
              </a>
            </p>
            <p className="text-[#8E8E93]">
              Dirección postal: Carrer de la Indústria 42, 08025 Barcelona (España)
            </p>
            <p className="text-[#8E8E93] text-xs mt-2">
              Plazo de respuesta: 30 días naturales desde la recepción de la solicitud.
            </p>
          </div>
        </Section>

        {/* Footer note */}
        <div className="border-t border-[#2C2C2E] pt-6">
          <p className="text-[#8E8E93] text-xs leading-relaxed">
            Hoop Slam Technologies S.L. se reserva el derecho a actualizar esta política de
            privacidad para adaptarla a cambios normativos o de servicio. La versión vigente estará
            siempre disponible en esta página con la fecha de última actualización. En caso de
            cambios sustanciales, te notificaremos por correo electrónico o mediante un aviso
            destacado en la plataforma.
          </p>
        </div>

      </div>
    </div>
  );
}
