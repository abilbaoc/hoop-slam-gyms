# Especificacion UX: Sistema de incidencias gym hacia equipo Hoop Slam

Fecha: 2026-03-24 | Autor: hoop-ux | Estado: v1.0 MVP

## 1. Contexto

El gestor puede crear tickets de mantenimiento en el dashboard B2B. Este sistema
hace que las incidencias high/critical lleguen al equipo tecnico de Hoop Slam
y que el gestor pueda ver el estado de la respuesta desde el dashboard.

## 2. Flujo del gestor

### 2.1 Ticket HIGH o CRITICAL: flujo automatico

1. Gestor abre CreateTicketModal
2. Escribe titulo, descripcion, selecciona canasta
3. Selecciona prioridad Alta o Critica
   Banner naranja aparece bajo el campo:
   [!] Esta incidencia sera notificada automaticamente al equipo tecnico de Hoop Slam
4. Hace clic en Crear ticket
5. Modal cierra. Toast 5s:
   Critica: Ticket creado. El equipo tecnico de Hoop Slam ha sido notificado.
   Alta:    Ticket creado. Hoop Slam ha sido notificado.
6. Ticket aparece en lista con badge Hoop notificado

### 2.2 Ticket LOW o MEDIUM: checkbox opcional

3. Al seleccionar prioridad Media o Baja aparece checkbox desmarcado:
   [ ] Notificar al equipo tecnico de Hoop Slam
5. Marcado    => Ticket creado. Hoop Slam ha sido notificado. (4s)
   No marcado => Ticket creado correctamente. (3s)

### 2.3 Escalado manual desde TicketDetailModal

Cuando notifiedAt === null y ticket abierto/en_progreso y canManage === true:
Mostrar boton: [Bell] Notificar a Hoop Slam

Al hacer clic:
1. Deshabilitar boton, mostrar spinner
2. Llamar Edge Function notify-hoop-on-ticket
3. Success => toast Hoop Slam ha sido notificado. (4s)
4. Error   => toast No se pudo notificar a Hoop. Intentalo de nuevo. (5s)
5. Actualizar ticket local: notifiedAt=ahora, hoopStatus=pending

## 3. Estados visuales del badge Hoop

El badge Hoop es independiente del badge de prioridad y estado interno del ticket.

| hoopStatus    | Texto             | Color fondo | Color texto |
|---------------|-------------------|-------------|-------------|
| pending       | Hoop notificado   | #FF9F0A     | #000000     |
| acknowledged  | Hoop: recibido    | #0A84FF     | #FFFFFF     |
| in_progress   | Hoop: en atencion | #0A84FF     | #FFFFFF     |
| resolved      | Hoop: resuelto    | #34C759     | #000000     |
| null          | no mostrar        | -           | -           |

Nota: verde neon #7BFF00 reservado para CTAs. No usar para estados Hoop.

Iconos Lucide por estado (lucide-react ya instalado):
- pending      => Bell 16px #FF9F0A
- acknowledged => Eye 16px #0A84FF
- in_progress  => Wrench 16px #0A84FF
- resolved     => CheckCircle 16px #34C759

## 4. Banner en CreateTicketModal

Estilos del banner de notificacion automatica:
- Fondo: rgba(255, 159, 10, 0.1)
- Borde izquierdo: 3px solid #FF9F0A
- Texto: color #FF9F0A, text-xs, Poppins
- Icono: AlertTriangle 14px #FF9F0A a la izquierda del texto
- Padding: px-3 py-2, rounded-xl
- Margin: mt-2 debajo del select de prioridad

## 5. Modificaciones en TicketCard

Anadir nueva fila entre badges existentes y titulo, visible solo si hoopStatus \!== null.

Antes:  [Alta] [En progreso]   Titulo del ticket
Despues: [Alta] [En progreso]
         [icono] Hoop notificado
         Titulo del ticket

Tamano badge Hoop: text-xs igual que badges existentes.

## 6. Modificaciones en TicketDetailModal

### Seccion SOPORTE HOOP SLAM (solo cuando notifiedAt \!== null)

Posicion: despues de la seccion Historial, antes del area de acciones.

Estilos del bloque:
- Fondo: #0A0A0A (mas oscuro que el modal #1C1C1E)
- Borde: border border-[#2C2C2E] rounded-2xl
- Padding: p-4
- Titulo: text-xs font-medium text-[#636366] uppercase tracking-wider

Contenido cuando hay respuesta (acknowledged/in_progress/resolved):
  SOPORTE HOOP SLAM
  Notificado el DD mmm YYYY, HH:MM
  Estado:    [Badge hoopStatus]
  Tecnico:   Nombre del tecnico Hoop      (si hoopAssignedTo tiene valor)
  Respuesta: Texto de hoopNotes           (si hoopNotes tiene valor)

Contenido cuando hoopStatus === pending (sin respuesta aun):
  SOPORTE HOOP SLAM
  Notificado el DD mmm YYYY, HH:MM
  Estado: [Badge Hoop notificado]
  El equipo tecnico revisara la incidencia en un plazo de 24 horas habiles.
  (Estilo: text-xs text-[#636366] italic)

### Boton Notificar a Hoop Slam

Cuando notifiedAt === null y ticket abierto/en_progreso y canManage === true,
mostrar en la zona de acciones:
  Boton variant=secondary size=sm con icono Bell: Notificar a Hoop Slam

## 7. Copywriting de toasts

| Situacion                              | Texto                                                               | Dur |
|----------------------------------------|---------------------------------------------------------------------|-----|
| Ticket critical creado (auto)          | Ticket creado. El equipo tecnico de Hoop Slam ha sido notificado.   | 5s  |
| Ticket high creado (auto)              | Ticket creado. Hoop Slam ha sido notificado.                        | 4s  |
| Ticket medium/low con checkbox marcado | Ticket creado. Hoop Slam ha sido notificado.                        | 4s  |
| Ticket creado sin notificar            | Ticket creado correctamente.                                        | 3s  |
| Notificacion manual exitosa            | Hoop Slam ha sido notificado.                                       | 4s  |
| Notificacion manual fallida            | No se pudo notificar a Hoop. Intentalo de nuevo.                    | 5s  |

## 8. Campos nuevos en MaintenanceTicket

Ver src/types/maintenance-hoop.ts. No modificar src/types/maintenance.ts.

| Campo TypeScript  | Columna SQL       | Tipo              | Descripcion                   |
|-------------------|-------------------|-------------------|-------------------------------|
| hoopStatus        | hoop_status       | HoopTicketStatus  | Estado del lado Hoop          |
| hoopAssignedTo    | hoop_assigned_to  | string o null     | Nombre tecnico Hoop asignado  |
| hoopNotes         | hoop_notes        | string o null     | Notas de Hoop visibles al gym |
| notifiedAt        | notified_at       | string o null     | Timestamp de notificacion     |

## 9. Limites del MVP

| Feature                                    | Razon                                         |
|--------------------------------------------|-----------------------------------------------|
| Panel admin interno Hoop                   | Fuera del scope del dashboard B2B del gym     |
| Equipo Hoop responde desde el dashboard    | Hoop usa su propio canal (webhook destino)    |
| Chat en tiempo real gym-Hoop               | Requiere Supabase Realtime mas UI de chat     |
| Notificaciones push movil al gestor        | Requiere app movil o PWA                      |
| SLA automatico alertas 24h                 | Segunda iteracion                             |
| Historial exportable                       | Segunda iteracion                             |

## 10. Checklist para hoop-dashboard

- [ ] Leer src/types/maintenance-hoop.ts (ya creado por hoop-backend)
- [ ] Actualizar CreateTicketModal: banner naranja high/critical, checkbox low/medium
- [ ] Actualizar CreateTicketModal: llamar Edge Function tras crear si procede
- [ ] Actualizar TicketCard: badge Hoop si hoopStatus !== null
- [ ] Actualizar TicketDetailModal: seccion SOPORTE HOOP SLAM
- [ ] Actualizar TicketDetailModal: boton Notificar a Hoop para tickets sin notificar
- [ ] Actualizar api.ts getMaintenanceTickets: usar maintenanceTicketsWithHoop del mock
- [ ] Verificar textos de toast contra tabla de copywriting de esta spec
