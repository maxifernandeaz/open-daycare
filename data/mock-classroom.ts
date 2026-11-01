const brandLogo =
  "https://lh3.googleusercontent.com/aida/AEtjO1UZif4Cbii6aEAAPYFJqAvBq-tlGhv7lv8fXT0447lsTcBKyllhfQMgMQubETVvzcx_9qXVqYLs0o4wLM9q6UFa1f3Ocr3WpFbz6ReeAVk2j5JvHNNopw5xvAHJLQ6OnBJSOD_i7urMryXOeXgYbSMa9mBjNHJTlJWmur1ftvIcHZOz4HV4CFyU_H46dX6qj5ZdT8Tjj3a4M-7O0_KPs5GGm6cq7anJFHxvO1hnSaL2AJu4LtG7dfUrbpk";

const userPhoto =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCHth3ZY10WxtQ6AgXBI3rM1JOFqz3LDEOYcZzgCf6AbownJbrBJI5Sj8i6c2fd83TygeQH6Yi_N81Nl5jnhuBWKE3bp8dGY6ZXHkoqLmCQ13gCz6RlphnJRDvvtkcA2_HuPdA62DSDGxBu2l8E_wT3vSwuUEwHTCWh5ZfaIBwgphF8llGrmmFuFqgM7DNYl6xNfaNEEiIZIIKQuYgjuAwXkRZx6otAQ7n7_iZpskoTu_jBrkmgk0bv";

const educatorPhoto =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC5W6SN1L34DgyYdA4ecieylH4RgOQVvpBOXDBWqcO9QcBk8vnzFYuTNVtQmVQhsLxjNBD53wfCYd7ENnLUasR9KjW-70qe6M8c_lSgNy9f8F7ryma21woI1YUeOJbfudxqUt8y5FO71jFgocrauKo92NYkFUdYttY5-_pd1pj9K9qpZaThfQwZz-i9cln3bK71I2kvLnWwWrXeUzUgP2gUT0LN34Hh65xmcVS1V7lQz4gJauGE25ed";

export const classroomShell = {
  brand: {
    logo: brandLogo,
    logoAlt: "KiddiCare Logo",
    initials: "KC",
    name: "KiddiCare",
    tagline: "Gestión Infantil 360°",
  },
  center: {
    name: "Centro Infantil Sol",
    statusLabel: "Activo",
  },
  navItems: [
    { label: "Panel de Aula (Hoy)", icon: "dashboard", path: "panel-de-aula-hoy", active: true },
    { label: "Alumnos y Familias", icon: "diversity_1", path: "alumnos-y-familias" },
    { label: "Registro Diario / Bitácora", icon: "edit_calendar", path: "registro-diario-bitacora" },
    { label: "Asistencia y Acceso", icon: "how_to_reg", path: "asistencia-y-acceso" },
    { label: "Comedor y Alergias", icon: "restaurant", path: "comedor-y-alergias" },
    { label: "Mensajes con Familias", icon: "chat_bubble", path: "mensajes-con-familias" },
    { label: "Facturación y Cuotas", icon: "receipt_long", path: "facturacion-y-cuotas" },
    { label: "Configuración", icon: "settings", path: "configuracion" },
  ] satisfies NavItem[],
  support: {
    icon: "support_agent",
    title: "Soporte KiddiCare",
    availability: "Disponible 8:00 - 18:00",
  },
  header: {
    classroomSelector: {
      icon: "meeting_room",
      label: "Aula en curso",
      value: "Aula Estrellitas - 1 a 2 años",
      toggleIcon: "expand_more",
    },
    dateSelector: {
      icon: "calendar_today",
      label: "Jornada escolar",
      value: "Hoy, 24 de Octubre",
      toggleIcon: "unfold_more",
    },
    primaryAction: {
      icon: "add_circle",
      label: "+ Nueva Actividad / Incidencia",
    },
    notifications: { icon: "notifications", label: "Notificaciones" },
    messages: { icon: "mark_email_unread", label: "Mensajes directos" },
  },
  user: {
    name: "Elena Morales",
    initials: "EM",
    photo: userPhoto,
    alt: "Profile",
    role: "Directora pedagógica",
    shiftLabel: "Turno activo",
  },
};

export const classroomPanel = {
  hero: {
    liveLabel: "EN DIRECTO",
    shiftLabel: "Jornada Continua",
    title: "Monitor Operativo de Aula",
    subtitle:
      "Supervisión integral de ritmos biológicos, protocolos sanitarios y relevo con familias en tiempo real.",
    educators: {
      label: "Educadores de Turno",
      summary: "Elena M. y Carlos M.",
      people: [
        {
          name: "Elena Morales",
          initials: "EM",
          photo: educatorPhoto,
          alt: "Educadora infantil profesional sonriendo en aula guarderia con uniforme verde suave y ambiente luminoso calido",
        },
        { name: "Carlos Méndez", initials: "CM" },
      ] satisfies Educator[],
    },
    action: { icon: "broadcast_on_personal", label: "Aviso a Familias" },
  },
  quickActions: [
    { label: "Entrada / Salida", icon: "how_to_reg", iconTone: "primary" },
    { label: "Comida / Menú", icon: "lunch_dining", iconTone: "secondary" },
    { label: "Cambio Pañal", icon: "clean_hands", iconTone: "tertiary" },
    { label: "Siesta Masiva", icon: "hotel", iconTone: "surface" },
    { label: "Foto a Familias", icon: "photo_camera", iconTone: "secondary" },
  ] satisfies QuickAction[],
  nextActivity: {
    time: "15:00",
    title: "Próxima Actividad Programada",
    description: "Estimulación musical y texturas otoñales en sala blanda 2",
    actionLabel: "Preparar Material",
  } satisfies NextActivity,
  pickups: [
    {
      id: "pickup-sofia",
      time: "13:00",
      timeTone: "secondary",
      childName: "Sofía Navarro",
      collector: "Recoge: Roberto Navarro (Padre)",
      verification: { icon: "qr_code_2", text: "Reconocimiento QR", tone: "primary" },
    },
    {
      id: "pickup-lucas",
      time: "13:30",
      timeTone: "tertiary",
      childName: "Lucas Martín",
      collector: "Recoge: Carmen López (Abuela)",
      verification: { icon: "badge", text: "DNI: ***4829J cotejado", tone: "outline" },
      badge: "DNI Req.",
    },
    {
      id: "pickup-pablo",
      time: "14:00",
      timeTone: "surface",
      childName: "Pablo Rivas",
      collector: "Recoge: Clara Santamaría (Madre)",
      verification: { icon: "app_shortcut", text: "App Padres Verificada", tone: "primary" },
    },
  ] satisfies PickupTurn[],
  logEntries: [
    {
      id: "log-elena",
      author: "Elena Morales",
      timeAgo: "Hace 10 min",
      text: "Publicó 3 fotos del taller de estimulación sensorial con harina de maíz en el muro de familias.",
      dotTone: "primary",
    },
    {
      id: "log-carlos",
      author: "Carlos Méndez",
      timeAgo: "Hace 25 min",
      text: "Registro general de pañales previo a la siesta completado para 14 niños.",
      dotTone: "secondary",
    },
    {
      id: "log-cocina",
      author: "Cocina Central",
      timeAgo: "Hace 50 min",
      text: "Comedor finalizado y platos especiales APLV y Celíaco firmados conforme a registro bromatológico.",
      dotTone: "tertiary",
    },
  ] satisfies LogEntry[],
};

export type Tone = "primary" | "secondary" | "tertiary" | "error" | "outline" | "surface";

export type NavItem = { label: string; icon: string; path: string; active?: boolean };
export type Educator = { name: string; initials: string; photo?: string; alt?: string };

export type KpiCard = {
  id: "attendance" | "canteen" | "nap" | "pickups";
  icon: string;
  iconTone: Tone;
  badge: string;
  badgeTone: Tone;
  badgeIcon?: string;
  label: string;
  value: string;
  valueTone?: Tone;
  unit: string;
  unitTone?: Tone;
  aside?: string;
  progress?: { segments: { width: number; tone: Tone }[]; suffix: string; suffixTone: Tone };
  footnote?: { icon?: string; dotTone?: Tone; text: string; textTone?: Tone };
  link?: string;
  linkTone?: Tone;
};

export type QuickAction = { label: string; icon: string; iconTone: Tone };

export type HealthTag = { icon: string; text: string; tone: Tone };

export type PickupTurn = {
  id: string;
  time: string;
  timeTone: Tone;
  childName: string;
  collector: string;
  verification: { icon: string; text: string; tone: Tone } | null;
  badge?: string;
};

export type LogEntry = { id: string; author: string; timeAgo: string; text: string; dotTone: Tone };

export type NextActivity = { time: string; title: string; description: string; actionLabel: string };
